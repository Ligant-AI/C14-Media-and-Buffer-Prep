import { TEXTS, aboveZero, FL04_MASS_TARGET, FL04_ACTIVITY_TARGET, specificActivityBasis, stillNeeded, needsUnit, LOWER_STRICTNESS_WORDS, UPPER_STRICTNESS_WORDS, tooManyDigits, } from './texts.js';
import { t, label, numField, unitField, unitDisplay, missingLabels, bothFamilies, anyUFamily } from './fields.js';
const RELATION = Object.freeze({ 'more than': '>', 'at least': '>=', 'less than': '<', 'at most': '<=' });
const FORMS = Object.freeze(['single', 'minimum', 'maximum', 'range']);
export function readSA(sa) {
    const s = sa || {};
    const f = {
        form: t(s.form),
        single: numField('saValue', s.single, 'pos'),
        lower: numField('saLower', s.lower, 'pos'),
        upper: numField('saUpper', s.upper, 'pos'),
        unit: unitField('saUnit', s.unit, 'specificActivity'),
        lowerWord: t(s.lowerWord),
        upperWord: t(s.upperWord),
        lot: t(s.lot),
        source: t(s.source),
        docNumber: t(s.docNumber),
    };
    f.any = f.form !== '' || f.single.text !== '' || f.lower.text !== '' || f.upper.text !== '' || f.unit.text !== '' ||
        f.lowerWord !== '' || f.upperWord !== '' || f.lot !== '' || f.source !== '' || f.docNumber !== '';
    return f;
}
export function saMissing(f) {
    const e = [['saForm', f.form]];
    if (f.form === 'single')
        e.push(['saValue', f.single.text]);
    if (f.form === 'minimum' || f.form === 'range')
        e.push(['saLower', f.lower.text], ['saLowerStrictness', f.lowerWord]);
    if (f.form === 'maximum' || f.form === 'range')
        e.push(['saUpper', f.upper.text], ['saUpperStrictness', f.upperWord]);
    e.push(['saUnit', f.unit.text], ['saLot', f.lot], ['saSource', f.source], ['saDocNumber', f.docNumber]);
    return missingLabels(e);
}
function saValueSentences(f) {
    const parts = [];
    const push = (s) => { if (!parts.includes(s))
        parts.push(s); };
    const check = (nf) => {
        if (nf.scan.kind === 'refused')
            push(TEXTS['MBP-RF-02']);
        else if (nf.scan.kind === 'tooLong')
            push(tooManyDigits(label(nf.labelKey)));
        else if (nf.scan.negative || nf.scan.allZeroDigits)
            push(TEXTS['MBP-RF-07']);
    };
    if (f.form === 'single')
        check(f.single);
    if (f.form === 'minimum' || f.form === 'range')
        check(f.lower);
    if (f.form === 'maximum' || f.form === 'range')
        check(f.upper);
    if ((f.form === 'minimum' || f.form === 'range') && !LOWER_STRICTNESS_WORDS.includes(f.lowerWord))
        push(TEXTS['MBP-RF-09']);
    if ((f.form === 'maximum' || f.form === 'range') && !UPPER_STRICTNESS_WORDS.includes(f.upperWord))
        push(TEXTS['MBP-RF-09']);
    return parts;
}
function engineSA(f) {
    const unit = f.unit.ascii;
    if (f.form === 'single')
        return { form: 'single', value: f.single.engineText, unit };
    if (f.form === 'minimum')
        return { form: 'bound', relation: RELATION[f.lowerWord], value: f.lower.engineText, unit };
    if (f.form === 'maximum')
        return { form: 'bound', relation: RELATION[f.upperWord], value: f.upper.engineText, unit };
    return {
        form: 'interval', unit,
        lower: { value: f.lower.engineText, relation: RELATION[f.lowerWord] },
        upper: { value: f.upper.engineText, relation: RELATION[f.upperWord] },
    };
}
const NONE = { statement: null, route: null, figures: [], roundingStatements: [], flags: [] };
export function checkStatement(mode, f, targetNum, targetUnit, outUnit, outLabelKey) {
    const none = NONE;
    const missing = saMissing(f);
    if (!f.any && mode === 'activity') {
        return { ...none, state: 'incomplete', code: null, parts: [TEXTS['MBP-RF-06']] };
    }
    if (missing.length)
        return { ...none, state: 'incomplete', code: null, parts: [stillNeeded(missing)] };
    if (!FORMS.includes(f.form))
        throw new TypeError('specific activity form is single, minimum, maximum or range');
    const wantTarget = mode === 'mass' ? 'massConcentration' : 'activityConcentration';
    const wantOut = mode === 'mass' ? 'activityConcentration' : 'massConcentration';
    const units = [
        [f.unit, 'specificActivity', label('saUnit')],
        [targetUnit, wantTarget, label(targetUnit.labelKey)],
        [outUnit, wantOut, label(outLabelKey)],
    ];
    if (bothFamilies([f.unit, targetUnit, outUnit])) {
        return { ...none, state: 'refused', code: 'E10-RC-02', parts: [TEXTS['MBP-RF-05']] };
    }
    const unitParts = [];
    let code = null;
    for (let i = 0; i < units.length; i++) {
        const [u, dim, lab] = units[i];
        if (u.cls.status === 'perUL') {
            unitParts.push(TEXTS['MBP-RF-14']);
            code = code || 'E10-RC-01';
        }
        else if (u.cls.status !== 'unit') {
            unitParts.push(needsUnit(lab, dim));
            code = code || 'E10-RC-01';
        }
    }
    if (unitParts.length === 0) {
        for (let i = 0; i < units.length; i++) {
            const [u, dim, lab] = units[i];
            if (u.cls.dimension !== dim) {
                unitParts.push(needsUnit(lab, dim));
                code = code || 'E10-RC-02';
            }
        }
    }
    if (unitParts.length)
        return { ...none, state: 'refused', code, parts: unitParts };
    const vparts = saValueSentences(f);
    const tgtScan = targetNum.scan;
    if (tgtScan.kind === 'refused')
        vparts.unshift(TEXTS['MBP-RF-02']);
    else if (tgtScan.kind === 'tooLong')
        vparts.unshift(tooManyDigits(label(targetNum.labelKey)));
    else if (tgtScan.negative || tgtScan.allZeroDigits)
        vparts.unshift(aboveZero(label(targetNum.labelKey)));
    if (vparts.length)
        return { ...none, state: 'refused', code: 'CCS-RF-03', parts: vparts };
    return null;
}
export function makeStatementBuilder(fns, makeFigure) {
    return function buildStatement(mode, f, targetNum, targetUnit, outUnit, outLabelKey, rounding) {
        const none = NONE;
        const wantOut = mode === 'mass' ? 'activityConcentration' : 'massConcentration';
        const early = checkStatement(mode, f, targetNum, targetUnit, outUnit, outLabelKey);
        if (early)
            return early;
        const fn = mode === 'mass' ? fns.E10R_F21 : fns.E10R_F20;
        const res = fn(targetNum.engineText, targetUnit.ascii, engineSA(f), outUnit.ascii);
        if (res.status === 'rejected') {
            if (res.code === 'CCS-RF-03') {
                const named = res.fields || [];
                if (named.includes('SA.lower') && named.includes('SA.upper')) {
                    return {
                        ...none, state: 'refused', code: res.code,
                        parts: [typeof res.message === 'string' ? TEXTS['MBP-RF-08-equal'] : TEXTS['MBP-RF-08-reversed']],
                    };
                }
                return { ...none, state: 'refused', code: res.code, parts: [TEXTS['MBP-RF-07']] };
            }
            throw new Error('E10R-F20/F21 refused after the page checks: ' + JSON.stringify(res));
        }
        if (res.status !== 'result')
            throw new Error('unexpected engine status: ' + res.status);
        const outDim = wantOut;
        const figures = [];
        const fig = (exact, unit) => { const x = makeFigure(exact, unit, outDim, rounding); figures.push(x); return x.display; };
        const spec = specificActivityBasis(f.form === 'single' ? f.single.text : f.form === 'maximum' ? f.upper.text : f.lower.text, unitDisplay(f.unit), f.lot);
        const targetAsTyped = targetNum.text + ' ' + unitDisplay(targetUnit);
        let statement;
        let route = null;
        if (mode === 'mass') {
            if (f.form === 'single')
                statement = FL04_MASS_TARGET.single(targetAsTyped, fig(res.exact, res.unit), spec);
            else if (f.form === 'minimum')
                statement = FL04_MASS_TARGET.minimum(fig(res.lower.exact, res.unit));
            else if (f.form === 'maximum')
                statement = FL04_MASS_TARGET.maximum(fig(res.upper.exact, res.unit));
            else
                statement = FL04_MASS_TARGET.range(fig(res.lower.exact, res.unit), fig(res.upper.exact, res.unit));
        }
        else {
            route = TEXTS['MBP-FL-04-route'];
            if (f.form === 'single')
                statement = FL04_ACTIVITY_TARGET.single(targetAsTyped, fig(res.exact, res.unit), spec);
            else if (f.form === 'minimum')
                statement = FL04_ACTIVITY_TARGET.minimum(fig(res.upper.exact, res.unit), targetAsTyped);
            else if (f.form === 'maximum')
                statement = FL04_ACTIVITY_TARGET.maximum(fig(res.lower.exact, res.unit), targetAsTyped);
            else
                statement = FL04_ACTIVITY_TARGET.range(fig(res.lower.exact, res.unit), fig(res.upper.exact, res.unit), targetAsTyped);
        }
        const flags = anyUFamily([f.unit, targetUnit, outUnit]) ? [TEXTS['MBP-FL-05']] : [];
        const roundingStatements = [];
        for (let i = 0; i < figures.length; i++)
            if (figures[i].statement)
                roundingStatements.push(figures[i].statement);
        return { state: 'result', code: null, parts: [], statement, route, figures, roundingStatements, flags };
    };
}
