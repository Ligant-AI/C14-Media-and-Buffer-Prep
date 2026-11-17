import { e10, e9 } from '@ligant/bench-engines';
export const E10R_F13 = e10.scaleToVolume;
export const E10R_F14 = e10.volumeFromAmount;
export const E10R_F16 = e10.percentSolution;
export const E10R_F18 = e10.concentrateVolume;
export const E10R_F19 = e10.roundDeclared;
export const E10R_F20 = e10.activityToMass;
export const E10R_F21 = e10.massToActivity;
export const E10R_F22 = e10.activityAmountFromConcentration;
export const E10R_F23 = e10.volumeFill;
export const E10C_F03 = e10.scaleUnit;
export const E10C_F05 = e10.molarToMass;
export const E10C_F12 = e10.amountFromConcentration;
export const CLOSED_LIST = Object.freeze({
    'E10R-F13': E10R_F13,
    'E10R-F14': E10R_F14,
    'E10R-F16': E10R_F16,
    'E10R-F18': E10R_F18,
    'E10R-F19': E10R_F19,
    'E10R-F20': E10R_F20,
    'E10R-F21': E10R_F21,
    'E10R-F22': E10R_F22,
    'E10R-F23': E10R_F23,
    'E10C-F03': E10C_F03,
    'E10C-F05': E10C_F05,
    'E10C-F12': E10C_F12,
});
const rawDisplay = e9.display;
function isDigitText(s, from) {
    if (typeof s !== 'string' || s.length <= from)
        return false;
    for (let i = from; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (c < 48 || c > 57)
            return false;
    }
    return true;
}
function requireExact(x) {
    if (x === null || typeof x !== 'object' || Array.isArray(x)) {
        throw new TypeError('display takes an exact {num, den} object only');
    }
    const proto = Object.getPrototypeOf(x);
    if (proto !== Object.prototype && proto !== null)
        throw new TypeError('display takes a plain exact object only');
    const keys = Object.keys(x);
    if (keys.length !== 2 || !keys.includes('num') || !keys.includes('den')) {
        throw new TypeError('display takes an object with exactly the keys num and den');
    }
    const { num, den } = x;
    if (!isDigitText(num, typeof num === 'string' && num.charCodeAt(0) === 45 ? 1 : 0)) {
        throw new TypeError('exact.num is not a decimal-integer string');
    }
    if (!isDigitText(den, 0))
        throw new TypeError('exact.den is not a decimal-integer string');
    let allZero = true;
    for (let i = 0; i < den.length; i++)
        if (den.charCodeAt(i) !== 48)
            allZero = false;
    if (allZero)
        throw new TypeError('exact.den is zero');
    return x;
}
export function sig3(exact) { return rawDisplay('sig3', requireExact(exact)); }
export function sci3(exact) { return rawDisplay('sci3', requireExact(exact)); }
export function sig3trim(exact) { return rawDisplay('sig3trim', requireExact(exact)); }
export function exactTextForChain(exact) { return rawDisplay('exact', requireExact(exact)); }
export const WRAPPED_DISPLAY = Object.freeze({ sig3, sci3, sig3trim, exactTextForChain });
