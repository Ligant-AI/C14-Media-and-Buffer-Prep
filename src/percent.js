import { TEXTS, RULED, WORKING, stillNeeded, needsUnit, aboveZero, makeUpRow, ifVolumesAdd, percentOfFinalRow, percentReachedRow, rowCopy, tooManyDigits, } from './texts.js';
import { t, label, numField, unitField, unitDisplay, missingLabels } from './fields.js';
import { parseRounding } from './figure.js';
import { FigureStop } from './display.js';
const MODES = Object.freeze(['final', 'added', 'reach']);
const BASES = Object.freeze(['w/v', 'v/v', 'w/w']);
export function basesOffered(mode) {
    if (mode === 'final')
        return [...BASES];
    if (mode === 'added' || mode === 'reach')
        return ['v/v'];
    return [];
}
export const PERCENT_MODES = MODES;
function out(state, code, parts, extra) {
    return {
        state, code, parts, reason: parts.length ? parts.join(' ') : null,
        mode: null, basis: null, basisWords: null, rows: [], makeUp: null, caption: null, working: null,
        flags: [], roundingStatements: [], sci3Shown: false, stop: null, ...(extra || {}),
    };
}
export function makePercentCalculator(fns, makeFigure) {
    return function percentSolution(input) {
        const rounding = parseRounding((input || {}).rounding);
        const result = percentBody(input, rounding);
        result.rounding = {
            declared: rounding.declared, rule: rounding.rule, places: rounding.places,
            refused: rounding.refused, message: rounding.message,
        };
        return result;
    };
    function percentBody(input, rounding) {
        const inp = input || {};
        const mode = t(inp.mode);
        const basis = t(inp.basis);
        if (mode !== '' && !MODES.includes(mode))
            throw new TypeError('mode is final, added or reach');
        if (basis !== '' && !BASES.includes(basis))
            throw new TypeError('basis is w/v, v/v or w/w');
        const pct = numField('percent', inp.percent, 'pct');
        const bKey = basis === 'w/w' ? 'bMass' : mode === 'added' || mode === 'reach' ? 'bAdded' : 'bFinal';
        const b = numField(bKey, inp.b, 'pos');
        const bu = unitField(bKey, inp.bUnit, basis === 'w/w' ? 'mass' : 'volume');
        const du = unitField('displayUnit', inp.displayUnit, basis === 'v/v' ? 'volume' : 'mass');
        const solvent = t(inp.solvent);
        const needSolvent = mode === 'final' && (basis === 'w/v' || basis === 'v/v');
        const entries = [['question', mode], ['basis', basis], ['percent', pct.text], [bKey, b.text], [bKey, bu.text], ['displayUnit', du.text]];
        if (needSolvent)
            entries.push(['baseLiquid', solvent]);
        if (rounding.declared)
            entries.push(['roundingPlaces', rounding.places]);
        const missing = missingLabels(entries);
        if (missing.length)
            return out('incomplete', null, [stillNeeded(missing)]);
        if ((mode === 'added' || mode === 'reach') && basis !== 'v/v')
            return out('refused', 'page', [TEXTS['MBP-RF-11']]);
        const unitParts = [];
        let code = null;
        for (const u of [bu, du]) {
            if (u.cls.status === 'perUL') {
                unitParts.push(TEXTS['MBP-RF-14']);
                code = code || 'E10-RC-01';
            }
            else if (u.cls.status !== 'unit') {
                unitParts.push(needsUnit(label(u.labelKey), u.dim));
                code = code || 'E10-RC-01';
            }
        }
        if (!unitParts.length) {
            for (const u of [bu, du]) {
                if (u.cls.dimension !== u.dim) {
                    unitParts.push(needsUnit(label(u.labelKey), u.dim));
                    code = code || 'E10-RC-02';
                }
            }
        }
        if (unitParts.length)
            return out('refused', code, unitParts);
        const vparts = [];
        if (pct.scan.kind === 'refused')
            vparts.push(TEXTS['MBP-RF-02']);
        else if (pct.scan.kind === 'tooLong')
            vparts.push(tooManyDigits(label('percent')));
        else if (pct.scan.negative && !pct.scan.allZeroDigits)
            vparts.push(TEXTS['MBP-RF-10-below0']);
        if (b.scan.kind === 'refused') {
            if (!vparts.includes(TEXTS['MBP-RF-02']))
                vparts.push(TEXTS['MBP-RF-02']);
        }
        else if (b.scan.kind === 'tooLong')
            vparts.push(tooManyDigits(label(bKey)));
        else if (b.scan.negative || b.scan.allZeroDigits)
            vparts.push(aboveZero(label(bKey)));
        if (vparts.length)
            return out('refused', 'CCS-RF-03', vparts);
        const res = fns.E10R_F16(pct.engineText, basis, mode, b.engineText, bu.ascii, du.ascii);
        if (res.status === 'rejected') {
            const names = res.fields || [];
            const parts = [];
            if (names.includes('reference'))
                parts.push(TEXTS['MBP-RF-11']);
            if (names.includes('pct'))
                parts.push(mode === 'reach' ? TEXTS['MBP-RF-10-reach'] : TEXTS['MBP-RF-10-above100']);
            if (names.includes('B'))
                parts.push(aboveZero(label(bKey)));
            if (names.includes('Bunit'))
                parts.push(needsUnit(label(bKey), bu.dim));
            if (names.includes('toUnit'))
                parts.push(needsUnit(label('displayUnit'), du.dim));
            if (!parts.length)
                throw new Error('E10R-F16 refused after the page checks: ' + JSON.stringify(res));
            return out('refused', res.code, parts);
        }
        if (res.status !== 'result')
            throw new Error('unexpected engine status: ' + res.status);
        try {
            const result = out('result', null, [], { mode, basis, basisWords: TEXTS['MBP-FL-12-' + basis] });
            const figs = [];
            const fig = (exact, unit, dim) => { const f = makeFigure(exact, unit, dim, rounding); figs.push(f); return f; };
            const dim = basis === 'v/v' ? 'volume' : 'mass';
            const pTyped = pct.text;
            const bTyped = b.text + ' ' + unitDisplay(bu);
            if (basis === 'w/w') {
                const solute = fig(res.exact, res.unit, 'mass');
                const solv = fig(res.solvent.exact, res.solvent.unit, 'mass');
                result.rows.push({ key: 'solute', label: RULED['MBP-DT-12-label-solute'], shown: solute.display, figure: solute }, { key: 'solvent', label: RULED['MBP-DT-12-label-solvent'], shown: solv.display, figure: solv });
                result.caption = TEXTS['MBP-DT-12-caption'];
                result.working = WORKING.ww(pTyped, bTyped, solute.display, solv.display);
            }
            else if (mode === 'final') {
                const tg = fig(res.exact, res.unit, dim);
                result.rows.push({ key: 'target', label: RULED['MBP-DT-12-label-target'], shown: tg.display, figure: tg });
                result.makeUp = makeUpRow(bTyped, solvent);
                result.working = basis === 'w/v' ? WORKING.wv(pTyped, bTyped, tg.display) : WORKING.vvFinal(pTyped, bTyped, tg.display);
                if (basis === 'w/v')
                    result.flags.push(TEXTS['MBP-FL-10']);
            }
            else {
                const tg = fig(res.exact, res.unit, 'volume');
                const fv = fig(res.finalVolume.exact, res.finalVolume.unit, 'volume');
                result.rows.push({ key: 'target', label: RULED['MBP-DT-12-label-target'], shown: ifVolumesAdd(tg.display), figure: tg }, { key: 'finalVolume', label: RULED['MBP-DT-12-label-finalVolume'], shown: ifVolumesAdd(fv.display), figure: fv });
                if (mode === 'added') {
                    const pf = fig(res.percentOfFinal.exact, '%', 'percent');
                    result.rows.push({ key: 'percentOfFinal', label: null, shown: percentOfFinalRow(pf.figure), figure: pf });
                    result.working = WORKING.added(pTyped, bTyped, tg.display, fv.display, pf.figure);
                }
                else {
                    result.rows.push({ key: 'percentReached', label: null, shown: percentReachedRow(pTyped), figure: null });
                    result.working = WORKING.reach(pTyped, bTyped, tg.display, fv.display);
                }
            }
            for (const r of result.rows)
                r.copy = r.label === null ? r.shown : rowCopy(r.label, r.shown);
            for (const f of figs) {
                if (f.statement)
                    result.roundingStatements.push(f.statement);
                if (f.mode === 'sci3')
                    result.sci3Shown = true;
            }
            return result;
        }
        catch (e) {
            if (e instanceof FigureStop) {
                return out('stop', null, [RULED['MBP-DP-stop']], { stop: e.reason, mode, basis });
            }
            throw e;
        }
    }
}
