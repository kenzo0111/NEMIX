/**
 * Responsibility Center Code & Acronym Extraction Utilities for COA Compliance Forms (RSMI)
 */

export interface ResponsibilityCenterInfo {
    id?: number | string;
    name?: string;
    code?: string;
    acronym?: string;
}

/**
 * Canonical dictionary of official Responsibility Center Codes and acronyms.
 */
export const CANONICAL_OFFICE_CODES: Record<string, string> = {
    'office of the vice president for administration and finance': 'OVPAF',
    'office of the vice president for academic affairs': 'OVPAA',
    'office of the vice president for research and extension': 'OVPRE',
    'office of the president': 'OP',
    'college of engineering': 'CE',
    'college of arts and sciences': 'CAS',
    'college of business and public administration': 'CBPA',
    'college of computing and multimedia studies': 'CCMS',
    'college of education': 'CoEd',
    'college of fisheries, aquatic sciences, & technology': 'CFAST',
    'college of fisheries, aquatic sciences and technology': 'CFAST',
    'college of agriculture and natural resources': 'CANR',
    'college of trades and technology': 'CoTT',
    'graduate school': 'GS',
    'academic services division': 'ASD',
    'auxiliary services division': 'ASD',
    'information technology services office': 'ITSO',
    'supply and property management office': 'SPMO',
    'general services office': 'GSO',
    'library': 'LIB',
    'admission office': 'AO',
    'alumni affairs office': 'AAO',
    'center for equity, inclusivity and diversity': 'CEID',
    'culture and performing arts unit': 'CPAU',
    'electronic counseling services': 'E-Counseling',
    'extension services division': 'ESD',
    'fabrication and manufacturing research center': 'FMRC',
    'guidance and counseling office': 'GCO',
    'integrated sustainability and resilience office': 'ISRO',
    'intellectual property management office': 'IPMO',
    'legal affairs office': 'LAO',
    'medical and dental services': 'MDS',
    'national service training program office': 'NSTP',
    'national service training program': 'NSTP',
    'office of student services and development': 'OSSD',
    'planning and development office': 'PDO',
    'public information and community relations office': 'PICRO',
    'quality assurance office': 'QAO',
    'queen pineapple research and development institute': 'QPRDI',
    "registrar's office": 'RO',
    'registrars office': 'RO',
    'research services division': 'RSD',
    'sentro ng wika at kultura': 'SWK',
    'social policy research center': 'SPRC',
    'sports and development office': 'SDO',
    'student financial assistance unit': 'SFAU',
    'testing and evaluation': 'TE',
};

const STOP_WORDS = new Set([
    'of',
    'the',
    'and',
    'for',
    'in',
    'to',
    'at',
    'ng',
    'mga',
    '&',
]);

/**
 * Checks if a string is already a compact, canonical code (e.g. 'OVPAF', 'CCMS', '01-101-00').
 */
export const isAlreadyCode = (val?: string | null): boolean => {
    if (!val) return false;
    const trimmed = val.trim();
    if (!trimmed || trimmed === '-') return false;

    // Numerical institutional code like 01-101-00
    if (/^\d{2}-\d{3}-\d{2}$/.test(trimmed)) return true;

    // Single token under 8 chars without spaces
    if (!trimmed.includes(' ') && trimmed.length <= 8) {
        return true;
    }

    return false;
};

/**
 * Strips campus / branch location suffixes from office strings.
 * e.g. 'College of Engineering - Main Campus' -> 'College of Engineering'
 * e.g. 'College of Trades and Technology - Jose Panganiban Campus' -> 'College of Trades and Technology'
 */
export const stripCampusSuffix = (name: string): string => {
    return name
        .replace(/\s*-\s*(?:[A-Za-z\s]+)?Campus.*$/i, '')
        .replace(/\s*-\s*(Main|Jose Panganiban|Abaño|Mercedes|Labo).*$/i, '')
        .trim();
};

/**
 * Algorithmic fallback to derive an acronym from organization title words.
 */
export const generateAcronymFromTitle = (name: string): string => {
    const cleaned = stripCampusSuffix(name)
        .replace(/[^\w\s-]/g, ' ')
        .trim();

    if (!cleaned) return '-';

    const words = cleaned
        .split(/\s+/)
        .filter((w) => w && !STOP_WORDS.has(w.toLowerCase()));

    if (words.length === 0) return '-';

    if (words.length === 1) {
        const single = words[0];
        if (single.length <= 4) return single.toUpperCase();
        if (single.toLowerCase() === 'library') return 'LIB';
        return single.length <= 6 ? single.toUpperCase() : single.substring(0, 3).toUpperCase();
    }

    return words
        .map((w) => (w[0] ? w[0].toUpperCase() : ''))
        .join('');
};

/**
 * Extracts acronym from an office/department name string.
 * Priority:
 * 1. If string is already a compact code (e.g. 'OVPAF', 'CCMS', '01-101-00'), returns it.
 * 2. Acronym inside parentheses (e.g. '(CCMS)', '(CoTT)', '(SPMO)', '(CBPA)').
 * 3. Canonical dictionary match (e.g. 'Office of the Vice President for Administration and Finance' -> 'OVPAF').
 * 4. Algorithmic acronym generation from significant words.
 * 5. '-' fallback.
 */
export const extractAcronym = (name?: string | null): string => {
    if (!name) return '-';
    const trimmed = String(name).trim();
    if (!trimmed || trimmed === '-') return '-';

    // 1. Acronym inside parentheses: e.g. "College of Computing and Multimedia Studies (CCMS) - Main Campus"
    const parenthetical = trimmed.match(/\(([A-Za-z0-9&/ -]+)\)/);
    if (parenthetical?.[1]) {
        const inside = parenthetical[1].trim();
        if (inside && inside !== '-') {
            return inside;
        }
    }

    // 2. Check canonical dictionary after stripping campus suffix
    const baseName = stripCampusSuffix(trimmed).toLowerCase();
    if (CANONICAL_OFFICE_CODES[baseName]) {
        return CANONICAL_OFFICE_CODES[baseName];
    }
    if (CANONICAL_OFFICE_CODES[trimmed.toLowerCase()]) {
        return CANONICAL_OFFICE_CODES[trimmed.toLowerCase()];
    }

    // 3. If already a clean short code/acronym, return it directly
    if (isAlreadyCode(trimmed)) {
        return trimmed;
    }

    // 4. Algorithmic generation
    const generated = generateAcronymFromTitle(trimmed);
    if (generated && generated !== '-') {
        return generated;
    }

    return trimmed;
};

/**
 * Resolves the display acronym / code for a Responsibility Center in the RSMI form.
 * Priority:
 * 1. Existing responsibility_center.code (if valid compact code)
 * 2. Existing responsibility_center.acronym (if valid compact code)
 * 3. Existing responsibility_center_code / responsibilityCenterCode
 * 4. Acronym found inside parentheses
 * 5. Canonical dictionary / algorithmic acronym from office name
 * 6. '-' fallback
 */
export const getResponsibilityCenterCode = (
    itemOrCenter?: any,
    fallback: string = '-'
): string => {
    if (!itemOrCenter) return fallback;

    // Direct string passed
    if (typeof itemOrCenter === 'string') {
        const extracted = extractAcronym(itemOrCenter);
        return extracted !== '-' ? extracted : fallback;
    }

    // Object passed: could be item or responsibility_center / responsibilityCenter object
    const centerObj =
        itemOrCenter.responsibility_center ||
        itemOrCenter.responsibilityCenter ||
        itemOrCenter;

    if (typeof centerObj === 'string') {
        const extracted = extractAcronym(centerObj);
        return extracted !== '-' ? extracted : fallback;
    }

    // 1. Check structured code and acronym on responsibility_center
    const structuredCode = centerObj?.code || centerObj?.acronym;
    if (structuredCode && typeof structuredCode === 'string') {
        const extracted = extractAcronym(structuredCode);
        if (extracted && extracted !== '-') {
            return extracted;
        }
    }

    // 2. Check direct code on item itself (e.g. responsibilityCenterCode, responsibility_center_code, center_code)
    const directItemCode =
        itemOrCenter.responsibilityCenterCode ||
        itemOrCenter.responsibility_center_code ||
        itemOrCenter.center_code;

    if (directItemCode && typeof directItemCode === 'string') {
        const extracted = extractAcronym(directItemCode);
        if (extracted && extracted !== '-') {
            return extracted;
        }
    }

    // 3. Fallback to name or department/office/division field
    const fullName =
        centerObj?.name ||
        itemOrCenter.department ||
        itemOrCenter.office ||
        itemOrCenter.division;

    if (fullName && typeof fullName === 'string') {
        const extracted = extractAcronym(fullName);
        if (extracted && extracted !== '-') {
            return extracted;
        }
    }

    return fallback;
};
