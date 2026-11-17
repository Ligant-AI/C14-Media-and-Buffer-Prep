import { scanNumber, classifyUnit, unitToAscii, unitToDisplay } from './scanner.js';
import { LABELS, tooManyDigits } from './texts.js';
export const t = (x) => (typeof x === 'string' ? x : '');
export const label = (key) => LABELS[key].text;
export function numField(labelKey, text, need) {
    const typed = t(text);
    const scan = scanNumber(typed);
    let engineText = typed;
    if (scan.kind === 'refused' || scan.kind === 'tooLong')
        engineText = 'x';
    else if (scan.kind === 'decimal' && scan.negative && scan.allZeroDigits)
        engineText = typed.slice(1);
    return { isUnit: false, labelKey, text: typed, scan, need, engineText };
}
export function unitField(labelKey, text, dim) {
    const typed = t(text);
    return { isUnit: true, labelKey, text: typed, ascii: unitToAscii(typed), cls: classifyUnit(typed), dim: dim || null };
}
export const unitDisplay = (f) => unitToDisplay(f.ascii);
export function missingLabels(entries) {
    const out = [];
    for (let i = 0; i < entries.length; i++) {
        const [key, fieldText] = entries[i];
        if (fieldText === '' && !out.includes(label(key)))
            out.push(label(key));
    }
    return out;
}
export function tooLongSentences(fields) {
    const out = [];
    for (let i = 0; i < fields.length; i++) {
        if (fields[i].scan.kind !== 'tooLong')
            continue;
        const s = tooManyDigits(label(fields[i].labelKey));
        if (!out.includes(s))
            out.push(s);
    }
    return out;
}
const AMOUNTS = Object.freeze(['mass', 'volume', 'amount', 'activity']);
export function unitsAreFine(unitFields) {
    if (bothFamilies(unitFields))
        return false;
    for (let i = 0; i < unitFields.length; i++) {
        const u = unitFields[i];
        if (u.cls.status !== 'unit')
            return false;
        const want = u.dim === null ? AMOUNTS : Array.isArray(u.dim) ? u.dim : [u.dim];
        if (!want.includes(u.cls.dimension))
            return false;
    }
    return true;
}
export function tooLongGate(numFields, unitFields) {
    const parts = tooLongSentences(numFields);
    if (parts.length === 0 || !unitsAreFine(unitFields))
        return null;
    return parts;
}
export function bothFamilies(unitFields) {
    let iu = false;
    let u = false;
    for (let i = 0; i < unitFields.length; i++) {
        const c = unitFields[i].cls;
        if (c.status === 'unit' && c.family === 'IU')
            iu = true;
        if (c.status === 'unit' && c.family === 'U')
            u = true;
    }
    return iu && u;
}
export function anyUFamily(unitFields) {
    for (let i = 0; i < unitFields.length; i++) {
        const c = unitFields[i].cls;
        if (c.status === 'unit' && c.family === 'U')
            return true;
    }
    return false;
}
