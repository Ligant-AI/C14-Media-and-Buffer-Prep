import { unitToDisplay } from './scanner.js';
import { decimalOf, figureForDimension } from './display.js';
import { RULED, roundingStatementTerminating, roundingStatementNonTerminating } from './texts.js';
const t = (x) => (typeof x === 'string' ? x : '');
const CAP = '400';
export function parseRounding(r) {
    const rule = t(r && r.rule);
    const places = t(r && r.places);
    if (rule === '' || rule === 'none') {
        return { declared: false, rule: 'none', places: '', missing: false, bad: false, over: false, refused: false, message: null };
    }
    if (rule !== 'half-up' && rule !== 'half-even')
        throw new TypeError('rounding rule is none, half-up or half-even');
    let digits = places.length > 0;
    let started = false;
    let count = 0;
    let order = 0;
    for (let i = 0; i < places.length; i++) {
        const c = places.charCodeAt(i);
        if (c < 48 || c > 57) {
            digits = false;
            break;
        }
        if (!started && c === 48)
            continue;
        started = true;
        if (count < CAP.length && order === 0) {
            const k = CAP.charCodeAt(count);
            order = c < k ? -1 : c > k ? 1 : 0;
        }
        count++;
    }
    const bad = places !== '' && !digits;
    const over = digits && (count > CAP.length || (count === CAP.length && order === 1));
    const message = bad ? RULED['MBP-DT-13-places'] : over ? RULED['MBP-DT-13-places-over'] : null;
    return { declared: true, rule, places, missing: places === '', bad, over, refused: bad || over, message };
}
export function makeFigureWith(fns) {
    return function makeFigure(exact, unitAscii, dimension, rounding) {
        const ud = unitToDisplay(unitAscii);
        const decimal = decimalOf(exact);
        let text;
        let mode;
        let statement = null;
        if (rounding.declared && !rounding.refused) {
            const r = fns.E10R_F19(exact, rounding.rule, rounding.places);
            if (r.status !== 'result')
                throw new Error('E10R-F19 refused after the page checks: ' + JSON.stringify(r));
            text = r.text;
            mode = 'declared';
            statement = decimal.terminates
                ? roundingStatementTerminating(rounding.rule, rounding.places, decimal.text, ud)
                : roundingStatementNonTerminating(rounding.rule, rounding.places, exact.num, exact.den, ud);
        }
        else {
            const f = figureForDimension(exact, dimension);
            text = f.text;
            mode = f.mode;
        }
        return {
            type: 'figure',
            exact,
            unit: unitAscii,
            unitDisplay: ud,
            figure: text,
            display: text + ' ' + ud,
            mode,
            decimal: decimal.text,
            terminates: decimal.terminates,
            statement,
        };
    };
}
