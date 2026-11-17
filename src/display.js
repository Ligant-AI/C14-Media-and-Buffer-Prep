import { sig3, sci3, sig3trim, exactTextForChain } from './engine.js';
export class FigureStop extends Error {
    constructor(reason) {
        super('figure stopped: ' + reason);
        this.name = 'FigureStop';
        this.reason = reason;
    }
}
export function terminates(exact) {
    const den = exact && exact.den;
    if (typeof den !== 'string' || den.length === 0)
        throw new TypeError('den is a decimal-integer string');
    let allZero = true;
    for (let i = 0; i < den.length; i++) {
        const c = den.charCodeAt(i);
        if (c < 48 || c > 57)
            throw new TypeError('den is a decimal-integer string');
        if (c !== 48)
            allZero = false;
    }
    if (allZero)
        throw new TypeError('den is above zero');
    let d = BigInt(den);
    while (d % 2n === 0n)
        d /= 2n;
    while (d % 5n === 0n)
        d /= 5n;
    return d === 1n;
}
export function decimalOf(exact, writer = exactTextForChain) {
    if (!terminates(exact))
        return { terminates: false, text: null };
    let text;
    try {
        text = writer(exact);
    }
    catch (e) {
        if (e instanceof TypeError)
            throw e;
        throw new FigureStop('writer-limit');
    }
    return { terminates: true, text };
}
export function callOneText(exact, writer = exactTextForChain) {
    if (!terminates(exact))
        throw new FigureStop('chain-den');
    return decimalOf(exact, writer).text;
}
export function sci3ExponentIsThreeOrMore(s) {
    if (typeof s !== 'string')
        throw new FigureStop('sci3-pattern');
    const n = s.length;
    const stop = () => { throw new FigureStop('sci3-pattern'); };
    if (n < 11)
        stop();
    const c0 = s.charCodeAt(0);
    if (c0 < 49 || c0 > 57)
        stop();
    if (s.charCodeAt(1) !== 46)
        stop();
    for (let i = 2; i <= 3; i++) {
        const c = s.charCodeAt(i);
        if (c < 48 || c > 57)
            stop();
    }
    if (s.charCodeAt(4) !== 32 || s.charCodeAt(5) !== 0xD7 || s.charCodeAt(6) !== 32)
        stop();
    if (s.charCodeAt(7) !== 49 || s.charCodeAt(8) !== 48 || s.charCodeAt(9) !== 94)
        stop();
    let i = 10;
    let negative = false;
    if (s.charCodeAt(i) === 45) {
        negative = true;
        i++;
    }
    if (i >= n)
        stop();
    for (let j = i; j < n; j++) {
        const c = s.charCodeAt(j);
        if (c < 48 || c > 57)
            stop();
    }
    if (negative)
        return false;
    while (i < n - 1 && s.charCodeAt(i) === 48)
        i++;
    const rest = n - i;
    if (rest > 1)
        return true;
    return s.charCodeAt(i) >= 51;
}
export function figureAtThousand(exact) {
    const s = sci3(exact);
    if (s === '0')
        return { text: sig3(exact), mode: 'sig3' };
    if (sci3ExponentIsThreeOrMore(s))
        return { text: s, mode: 'sci3' };
    return { text: sig3(exact), mode: 'sig3' };
}
export function figureForDimension(exact, dimension) {
    if (dimension === 'mass' || dimension === 'volume' || dimension === 'amount' || dimension === 'activity') {
        return figureAtThousand(exact);
    }
    if (dimension === 'massConcentration' || dimension === 'molarConcentration' ||
        dimension === 'activityConcentration' || dimension === 'specificActivity') {
        return { text: sci3(exact), mode: 'sci3' };
    }
    if (dimension === 'percent')
        return { text: sig3(exact), mode: 'sig3' };
    throw new TypeError('unknown dimension for display: ' + dimension);
}
export function factorText(exact) {
    return sig3trim(exact);
}
