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
 * Extracts acronym from an office/department name string.
 * e.g., 'College of Computing and Multimedia Studies (CCMS) - Main Campus' -> 'CCMS'
 * e.g., 'Supply and Property Management Office (SPMO)' -> 'SPMO'
 * e.g., 'CCMS' -> 'CCMS'
 * e.g., 'Library' -> 'Library'
 * e.g., null / '' / '-' -> '-'
 */
export const extractAcronym = (name?: string | null): string => {
    if (!name) return '-';
    const trimmed = String(name).trim();
    if (!trimmed || trimmed === '-') return '-';

    const acronymMatch = trimmed.match(/\(([^)]+)\)/);
    if (acronymMatch?.[1]) {
        const extracted = acronymMatch[1].trim();
        if (extracted) {
            return extracted;
        }
    }

    return trimmed;
};

/**
 * Resolves the display acronym / code for a Responsibility Center in the RSMI form.
 * Inspects structured fields first (acronym, code), then falls back to extracting
 * the acronym from full office / department name strings.
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

    // 1. Direct acronym or code on structured responsibility_center object
    const structuredCode = centerObj?.acronym || centerObj?.code;
    if (structuredCode && typeof structuredCode === 'string') {
        const extracted = extractAcronym(structuredCode);
        if (extracted && extracted !== '-') {
            return extracted;
        }
    }

    // 2. Direct code on item itself (e.g. responsibilityCenterCode, responsibility_center_code, center_code)
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
