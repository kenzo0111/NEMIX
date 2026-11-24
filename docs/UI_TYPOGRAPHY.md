# Interface typography

Screen typography uses Figtree with the existing system sans-serif fallback. Load
weights 400, 500, 600, and 700. Use regular text for descriptions and medium or
semibold for labels, actions, headings and key values. Use
`tabular-nums` for quantities and identifiers without switching font families.

The shared Tailwind scale is defined in `tailwind.config.js`:

| Role | Utility | Size | Line height |
| --- | --- | --- | --- |
| Supporting text, labels, tables | `text-sm` | 14px | 24px |
| Body and form input text | `text-base` | 16px | 26px |
| Subsection heading | `text-lg` | 18px | 28px |
| Section heading | `text-xl` | 20px | 30px |
| Page heading, mobile | `text-2xl` | 24px | 32px |
| Page heading, larger screens | `sm:text-3xl` | 30px | 38px |

Use sentence case and normal letter spacing for interface labels. Preserve actual
acronyms such as RFID and RIS. Keep descriptions brief and avoid repeating the
page description inside each toolbar. Use relaxed line height for supporting
prose. Let filters wrap or stack rather than compressing labels or shrinking text.
Controls have a 40px minimum height; inputs use 16px text. Authentication controls
use a 52px minimum and 16px action text. Standalone icon controls use 44px targets.
Use the shared Button, Field, StatusBadge and dialog primitives rather than
adding conflicting Tailwind color, focus, radius or weight utilities.

Official forms in `resources/Official Forms`, the two printable audit ledgers,
and document print/PDF styles retain their document-specific typography. Preview
dialog controls follow the screen scale while their embedded paper forms retain
the official layout. Official form roots use `data-paper-preview`; screen type
rules exclude that boundary and descendants. Do not normalize paper heading or
table-header weights with application-wide selectors.

Validation: `npm run build`, `npx tsc --noEmit`, and
`node --test tests/Frontend/*.test.mjs`.
