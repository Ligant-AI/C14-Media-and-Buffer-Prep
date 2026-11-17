const MICRO = 'µ';
export const MAX_DIGITS = 400;
export function scanNumber(text) {
    if (typeof text !== 'string')
        throw new TypeError('scanNumber takes the text as typed');
    const n = text.length;
    if (n === 0)
        return { text, kind: 'empty', negative: false, allZeroDigits: false };
    const refused = { text, kind: 'refused', negative: false, allZeroDigits: false };
    let i = 0;
    let negative = false;
    if (text.charCodeAt(0) === 45) {
        negative = true;
        i = 1;
    }
    let allZero = true;
    let intDigits = 0;
    while (i < n) {
        const c = text.charCodeAt(i);
        if (c < 48 || c > 57)
            break;
        if (c !== 48)
            allZero = false;
        intDigits++;
        i++;
    }
    if (intDigits === 0)
        return refused;
    let fracDigits = 0;
    if (i < n) {
        if (text.charCodeAt(i) !== 46)
            return refused;
        i++;
        while (i < n) {
            const c = text.charCodeAt(i);
            if (c < 48 || c > 57)
                return refused;
            if (c !== 48)
                allZero = false;
            fracDigits++;
            i++;
        }
        if (fracDigits === 0)
            return refused;
    }
    if (intDigits > MAX_DIGITS || fracDigits > MAX_DIGITS) {
        return { text, kind: 'tooLong', negative, allZeroDigits: allZero, intDigits, fracDigits };
    }
    return { text, kind: 'decimal', negative, allZeroDigits: allZero };
}
const row = (unit, dimension, line, family) => (family ? { unit, dimension, line, family } : { unit, dimension, line });
export const UNITS = Object.freeze([
    row('g', 'mass', 126), row('mg', 'mass', 126), row('ug', 'mass', 126),
    row('ng', 'mass', 126), row('pg', 'mass', 126), row('fg', 'mass', 126),
    row('L', 'volume', 126), row('mL', 'volume', 126), row('uL', 'volume', 126),
    row('mol', 'amount', 126), row('mmol', 'amount', 126), row('umol', 'amount', 126), row('nmol', 'amount', 126),
    row('pmol', 'amount', 126), row('fmol', 'amount', 126), row('amol', 'amount', 126),
    row('g/L', 'massConcentration', 126), row('mg/mL', 'massConcentration', 126), row('ug/uL', 'massConcentration', 126),
    row('ug/mL', 'massConcentration', 126), row('ng/uL', 'massConcentration', 126), row('ng/mL', 'massConcentration', 126),
    row('pg/uL', 'massConcentration', 126),
    row('M', 'molarConcentration', 126), row('mM', 'molarConcentration', 126), row('uM', 'molarConcentration', 126),
    row('nM', 'molarConcentration', 126), row('pM', 'molarConcentration', 126), row('fM', 'molarConcentration', 126),
    row('IU', 'activity', 126, 'IU'), row('U', 'activity', 126, 'U'),
    row('IU/mL', 'activityConcentration', 126, 'IU'), row('U/mL', 'activityConcentration', 126, 'U'),
    row('IU/mg', 'specificActivity', 88, 'IU'), row('IU/ug', 'specificActivity', 88, 'IU'),
    row('U/mg', 'specificActivity', 88, 'U'), row('U/ug', 'specificActivity', 88, 'U'),
]);
export function unitsOfDimension(dimension) {
    const out = [];
    for (let i = 0; i < UNITS.length; i++)
        if (UNITS[i].dimension === dimension)
            out.push(UNITS[i].unit);
    return out;
}
export const PER_UL_UNITS = Object.freeze(['U/uL', 'IU/uL']);
export function unitToAscii(token) {
    let out = '';
    for (let i = 0; i < token.length; i++)
        out += token[i] === MICRO ? 'u' : token[i];
    return out;
}
export function unitToDisplay(token) {
    let out = '';
    for (let i = 0; i < token.length; i++)
        out += token[i] === 'u' ? MICRO : token[i];
    return out;
}
export function classifyUnit(token) {
    const ascii = unitToAscii(token);
    for (let i = 0; i < PER_UL_UNITS.length; i++) {
        if (PER_UL_UNITS[i] === ascii)
            return { status: 'perUL', ascii };
    }
    for (let i = 0; i < UNITS.length; i++) {
        if (UNITS[i].unit === ascii) {
            const out = { status: 'unit', ascii, display: unitToDisplay(ascii), dimension: UNITS[i].dimension };
            if (UNITS[i].family)
                out.family = UNITS[i].family;
            return out;
        }
    }
    return { status: 'unknown', ascii };
}
export function echoFreeText(text) {
    return text;
}
