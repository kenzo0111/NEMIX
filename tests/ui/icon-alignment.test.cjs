const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');

const rootDir = path.resolve(__dirname, '..', '..');

function walkFiles(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'Official Forms') continue;
            walkFiles(fullPath, files);
        } else if (/\.(tsx|ts)$/.test(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
}

test('ui.css uses low-specificity :where wrappers for .ui-field and allows custom positioning on absolute icon buttons', () => {
    const uiCss = fs.readFileSync(path.join(rootDir, 'resources/css/ui.css'), 'utf8');
    const ast = postcss.parse(uiCss);

    const fieldRules = [];
    const absIconRules = [];

    ast.walkRules((rule) => {
        if (rule.selector.includes('.ui-field') && !rule.selector.includes('.ui-field-group')) {
            const props = rule.nodes.filter((n) => n.type === 'decl').map((d) => d.prop);
            if (props.some((p) => p === 'padding' || p === 'padding-right' || p === 'padding-left' || p === 'font-size')) {
                fieldRules.push(rule.selector);
            }
        }
        if (rule.selector.includes(".ui-button[data-size='icon'].absolute")) {
            absIconRules.push({
                selector: rule.selector,
                props: rule.nodes.filter((n) => n.type === 'decl').map((d) => d.prop),
            });
        }
    });

    assert.ok(fieldRules.length >= 4, 'expected default .ui-field rules in ui.css');
    for (const selector of fieldRules) {
        assert.ok(
            selector.includes(':where('),
            `expected low-specificity :where() on "${selector}" so Tailwind padding/font utilities override cleanly`,
        );
    }

    assert.ok(absIconRules.length >= 1, 'expected .ui-button[data-size="icon"].absolute sizing rule');
    for (const rule of absIconRules) {
        assert.ok(rule.selector.includes(':where('), `expected :where() on "${rule.selector}"`);
        assert.ok(!rule.props.includes('top'), 'absolute icon button rule must not force top: 0');
        assert.ok(!rule.props.includes('bottom'), 'absolute icon button rule must not force bottom: 0');
    }
});

test('app.css suppresses native search cancel buttons on .ui-field search inputs', () => {
    const appCss = fs.readFileSync(path.join(rootDir, 'resources/css/app.css'), 'utf8');
    assert.match(appCss, /input\[type="search"\]\.ui-field::-webkit-search-cancel-button/);
});

test('frontend UI components use Lucide icons instead of raw inline svg or oversized clear buttons', () => {
    const files = walkFiles(path.join(rootDir, 'resources/js'));
    const rawSvgViolations = [];
    const rawTextClearButtonViolations = [];

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        if (/<svg[\s>]/.test(content)) {
            rawSvgViolations.push(path.relative(rootDir, file));
        }
        if (/<Button\b[^>]*>\s*[✕×]\s*<\/Button>/.test(content)) {
            rawTextClearButtonViolations.push(path.relative(rootDir, file));
        }
    }

    assert.deepEqual(rawSvgViolations, [], 'raw <svg> tags found outside Official Forms');
    assert.deepEqual(rawTextClearButtonViolations, [], 'raw Unicode close/clear buttons without Lucide icons found');
});
