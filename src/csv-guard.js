const GUARD = '=+-@\t\r';
export const UNIT_TOKENS = Object.freeze(new Set([
    'g', 'mg', 'µg', 'ng', 'pg', 'fg',
    'L', 'mL', 'µL',
    'mol', 'mmol', 'µmol', 'nmol', 'pmol', 'fmol', 'amol',
    'g/L', 'mg/mL', 'µg/µL', 'µg/mL', 'ng/µL', 'ng/mL', 'pg/µL',
    'M', 'mM', 'µM', 'nM', 'pM', 'fM',
    'IU', 'U', 'IU/mL', 'U/mL',
    'IU/mg', 'IU/µg', 'U/mg', 'U/µg',
    '%',
]));
const isDigit = (c) => c >= '0' && c <= '9';
export function isN1(s) {
    let i = s[0] === '-' ? 1 : 0;
    let digits = 0;
    let dots = 0;
    for (; i < s.length; i += 1) {
        const c = s[i];
        if (isDigit(c))
            digits += 1;
        else if (c === '.')
            dots += 1;
        else
            return false;
    }
    return digits >= 1 && dots <= 1;
}
export function isN2(s) {
    let i = s[0] === '-' ? 1 : 0;
    let d = 0;
    while (i < s.length && isDigit(s[i])) {
        i += 1;
        d += 1;
    }
    if (d === 0)
        return false;
    if (i === s.length)
        return true;
    if (s[i] !== '/')
        return false;
    i += 1;
    let e = 0;
    while (i < s.length && isDigit(s[i])) {
        i += 1;
        e += 1;
    }
    return e > 0 && i === s.length;
}
function isSci(s) {
    let i = s[0] === '-' ? 1 : 0;
    if (!(isDigit(s[i]) && s[i + 1] === '.' && isDigit(s[i + 2]) && isDigit(s[i + 3])))
        return false;
    i += 4;
    const mid = ' × 10^';
    if (s.slice(i, i + mid.length) !== mid)
        return false;
    i += mid.length;
    if (s[i] === '-')
        i += 1;
    let d = 0;
    while (i < s.length && isDigit(s[i])) {
        i += 1;
        d += 1;
    }
    return d > 0 && i === s.length;
}
export function isN3(s) {
    if (isN1(s) || isSci(s))
        return true;
    const k = s.lastIndexOf(' ');
    if (k <= 0)
        return false;
    const head = s.slice(0, k);
    return UNIT_TOKENS.has(s.slice(k + 1)) && (isN1(head) || isSci(head));
}
export function isNumberCell(s) {
    return isN1(s) || isN2(s) || isN3(s);
}
export function csvCell(text, numberSlot = false) {
    let s = String(text);
    if (s.length > 0 && GUARD.includes(s[0]) && !(numberSlot === true && isNumberCell(s)))
        s = `'${s}`;
    return `"${s.split('"').join('""')}"`;
}
