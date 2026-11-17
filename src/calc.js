import { E10R_F13, E10R_F14, E10R_F16, E10R_F18, E10R_F19, E10R_F20, E10R_F21, E10C_F03, E10C_F05, E10C_F12, E10R_F22, E10R_F23, } from './engine.js';
import { classifyUnit, unitToDisplay } from './scanner.js';
import { TEXTS, RULED, stillNeeded, linePrefix, needsUnit, aboveZero, foldTooSmall, zeroOrMore, kind1Words, kind1WordsAboutOne, kind3StockWords, kind3PercentWords, kind3SolidWords, kind3SolidFwWords, kind3FoldWords, kind3ActivityMassWords, makeUpRow, tooManyDigits, } from './texts.js';
import { FigureStop, callOneText, figureForDimension, factorText } from './display.js';
import { t, label, numField, unitField, unitDisplay, missingLabels, bothFamilies, anyUFamily, tooLongGate, } from './fields.js';
import { parseRounding, makeFigureWith } from './figure.js';
import { readSA, saMissing, checkStatement, makeStatementBuilder } from './statements.js';
import { makePercentCalculator } from './percent.js';
export const DEFAULT_FNS = Object.freeze({
    E10R_F13, E10R_F14, E10R_F16, E10R_F18, E10R_F19, E10R_F20, E10R_F21, E10R_F22, E10R_F23, E10C_F03, E10C_F05, E10C_F12,
});
export function makeEngineInfo(metadata, vendored) {
    if (!metadata || typeof metadata.version !== 'string' || typeof metadata.name !== 'string') {
        throw new TypeError('engine metadata needs name and version');
    }
    let record = null;
    const keys = Object.keys(vendored || {});
    for (let i = 0; i < keys.length; i++) {
        const r = vendored[keys[i]];
        if (r && r.package === metadata.name)
            record = r;
    }
    if (!record || typeof record.source_commit !== 'string')
        throw new TypeError('no vendored record for the package');
    if (record.version !== metadata.version)
        throw new TypeError('installed version and vendored version differ');
    const info = { package: metadata.name, version: metadata.version, commit: record.source_commit };
    if (record.modules && typeof record.modules.E10 === 'string')
        info.e10 = record.modules.E10;
    return info;
}
const AMOUNT_DIMS = Object.freeze(['mass', 'volume', 'amount', 'activity']);
const CONC_DIMS = Object.freeze(['massConcentration', 'molarConcentration']);
function valueSentence(f) {
    if (f.scan.kind === 'refused')
        return TEXTS['MBP-RF-02'];
    if (f.scan.kind === 'tooLong')
        return tooManyDigits(label(f.labelKey));
    if (f.need === 'pct') {
        if (f.scan.negative && !f.scan.allZeroDigits)
            return TEXTS['MBP-RF-10-below0'];
        return TEXTS['MBP-RF-10-above100'];
    }
    if (f.need === 'ge1')
        return foldTooSmall();
    if (f.need === 'pos')
        return aboveZero(label(f.labelKey));
    return zeroOrMore(label(f.labelKey));
}
function mapRefusal(res, map, unitFields) {
    const parts = [];
    const push = (s) => { if (!parts.includes(s))
        parts.push(s); };
    const names = res.fields || [];
    if (res.code === 'E10-RC-01') {
        for (let i = 0; i < names.length; i++) {
            const f = map[names[i]];
            if (!f)
                continue;
            if (f.cls.status === 'perUL')
                push(TEXTS['MBP-RF-14']);
            else
                push(needsUnit(label(f.labelKey), f.dim || AMOUNT_DIMS));
        }
    }
    else if (res.code === 'E10-RC-02') {
        if (typeof res.message === 'string') {
            push(RULED['MBP-RF-04']);
        }
        else if (bothFamilies(unitFields)) {
            push(TEXTS['MBP-RF-05']);
        }
        else {
            for (let i = 0; i < names.length; i++) {
                const f = map[names[i]];
                if (!f)
                    continue;
                push(needsUnit(label(f.labelKey), f.dim || AMOUNT_DIMS));
            }
        }
    }
    else if (res.code === 'CCS-RF-03') {
        for (let i = 0; i < names.length; i++) {
            const f = map[names[i]];
            if (!f)
                continue;
            push(valueSentence(f));
        }
    }
    else {
        throw new Error('unexpected engine status: ' + res.status);
    }
    if (parts.length === 0)
        throw new Error('an engine refusal named no field of the line: ' + JSON.stringify(res.fields));
    return { code: res.code, parts };
}
class Refusal extends Error {
    constructor(code, parts) { super('refusal'); this.code = code; this.parts = parts; }
}
export function makeCalculator(fns = DEFAULT_FNS) {
    function run(fn, args, map, unitFields) {
        const res = fn(...args);
        if (res.status === 'result')
            return res;
        if (res.status === 'rejected') {
            const m = mapRefusal(res, map, unitFields);
            throw new Refusal(m.code, m.parts);
        }
        throw new Error('unexpected engine status: ' + res.status + ' ' + JSON.stringify(res.missing || []));
    }
    const makeFig = makeFigureWith(fns);
    const buildStatement = makeStatementBuilder(fns, makeFig);
    const percentSolution = makePercentCalculator(fns, makeFig);
    function recipeContext(recipe) {
        const rec = recipe || {};
        const rounding = parseRounding(rec.rounding);
        const fv = numField('finalVolume', rec.finalVolume, 'pos');
        const fu = unitField('finalVolume', rec.finalUnit, 'volume');
        return { rec, rounding, fv, fu, solvent: t(rec.baseLiquid) };
    }
    function recipeLevel(rc) {
        const parts = [];
        const missing = missingLabels([['finalVolume', rc.fv.text], ['finalVolume', rc.fu.text], ['baseLiquid', rc.solvent]]);
        if (rc.rounding.declared && rc.rounding.missing)
            missing.push(label('roundingPlaces'));
        if (missing.length) {
            return { state: 'incomplete', code: null, parts: [stillNeeded(missing)] };
        }
        if (rc.fu.cls.status !== 'unit') {
            parts.push(needsUnit(label('finalVolume'), 'volume'));
            return { state: 'refused', code: 'E10-RC-01', parts };
        }
        if (rc.fu.cls.dimension !== 'volume') {
            parts.push(needsUnit(label('finalVolume'), 'volume'));
            return { state: 'refused', code: 'E10-RC-02', parts };
        }
        let fvPart = null;
        if (rc.fv.scan.kind === 'refused')
            fvPart = TEXTS['MBP-RF-02'];
        else if (rc.fv.scan.kind === 'tooLong')
            fvPart = tooManyDigits(label('finalVolume'));
        else if (rc.fv.scan.negative || rc.fv.scan.allZeroDigits)
            fvPart = aboveZero(label('finalVolume'));
        if (fvPart !== null) {
            return { state: 'refused', code: 'CCS-RF-03', parts: [fvPart] };
        }
        return { state: 'result', code: null, parts: [] };
    }
    function makeFigure(exact, unitAscii, dimension, rc) {
        return makeFig(exact, unitAscii, dimension, rc.rounding);
    }
    function makeIntermediate(exact, unitAscii) {
        const cls = classifyUnit(unitAscii);
        const dim = unitAscii === 'g/L' ? 'massConcentration' : cls.dimension;
        const f = figureForDimension(exact, dim);
        const ud = unitToDisplay(unitAscii);
        return { exact, unit: unitAscii, unitDisplay: ud, figure: f.text, display: f.text + ' ' + ud, mode: f.mode };
    }
    function newLine(L, n, kind) {
        return {
            ordinal: n, prefix: linePrefix(n), name: t(L.name), kind,
            state: 'result', code: null, parts: [], reason: null,
            kindWords: null, phrase: null, note: null, noAmount: false, noAmountText: null,
            statement: null, statementRoute: null, statementFigures: [], roundingStatements: [], flags: [],
            amountOfSubstance: false,
            target: null, factor: null, intermediates: [], bar: null, sci3Shown: false, stop: null,
            actual: t(L.actual),
        };
    }
    const settle = (line, state, code, parts) => {
        line.state = state;
        line.code = code;
        line.parts = parts;
        line.reason = parts.length ? line.prefix + parts.join(' ') : null;
        return line;
    };
    function markU(line, unitFields) {
        if (anyUFamily(unitFields) && !line.flags.includes(TEXTS['MBP-FL-05']))
            line.flags.push(TEXTS['MBP-FL-05']);
    }
    function barValue(fn, args, map, unitFields, rc) {
        const res = run(fn, args, map, unitFields);
        return { exact: res.exact, unit: rc.fu.ascii };
    }
    function kind1(L, line, rc) {
        const own = t(L.sourceVolume) !== '' || t(L.sourceUnit) !== '';
        const sv = own ? numField('sourceVolume', L.sourceVolume, 'pos') : numField('sourceVolume', rc.rec.sourceVolume, 'pos');
        const su = own ? unitField('sourceVolume', L.sourceUnit, 'volume') : unitField('sourceVolume', rc.rec.sourceUnit, 'volume');
        const q = numField('amount', L.amount, 'nonneg');
        const qu = unitField('amount', L.amountUnit, null);
        const d = unitField('displayUnit', L.displayUnit, qu.cls.status === 'unit' ? qu.cls.dimension : null);
        const missing = missingLabels([
            ['finalVolume', rc.fv.text], ['finalVolume', rc.fu.text], ['sourceVolume', sv.text], ['sourceVolume', su.text],
            ['amount', q.text], ['amount', qu.text], ['displayUnit', d.text],
            ...(rc.rounding.declared ? [['roundingPlaces', rc.rounding.places]] : []),
        ]);
        if (missing.length)
            return settle(line, 'incomplete', null, [stillNeeded(missing)]);
        const units = [qu, d, su, rc.fu];
        const tooLong = tooLongGate([rc.fv, sv, q], units);
        if (tooLong)
            return settle(line, 'refused', 'CCS-RF-03', tooLong);
        const map = { q, unit: qu, Vfrom: sv, VfromUnit: su, Vto: rc.fv, VtoUnit: rc.fu, toUnit: d };
        const common = [q.engineText, qu.ascii, sv.engineText, su.ascii, rc.fv.engineText, rc.fu.ascii];
        const main = run(fns.E10R_F13, [...common, d.ascii], map, units);
        const fres = run(fns.E10R_F13, ['1', 'mL', sv.engineText, su.ascii, rc.fv.engineText, rc.fu.ascii, 'mL'], map, units);
        const ft = factorText(fres.exact);
        const factorIsOne = fres.exact.num === '1' && fres.exact.den === '1';
        line.factor = { exact: fres.exact, display: ft };
        const asTyped = (f, u) => f.text + ' ' + unitDisplay(u);
        line.kindWords = ft === '1' && !factorIsOne
            ? kind1WordsAboutOne(asTyped(sv, su), asTyped(rc.fv, rc.fu))
            : kind1Words(ft);
        line.target = makeFigure(main.exact, d.ascii, d.cls.dimension, rc);
        line.amountOfSubstance = d.cls.dimension === 'amount';
        markU(line, [qu, d]);
        if (qu.cls.dimension === 'volume') {
            line.bar = barValue(fns.E10R_F13, [...common, rc.fu.ascii], map, units, rc);
        }
        return line;
    }
    function kind2(L, line, rc) {
        const q = numField('amount', L.amount, 'nonneg');
        const qu = unitField('amount', L.amountUnit, null);
        const missing = missingLabels([['amount', q.text], ['amount', qu.text]]);
        if (missing.length)
            return settle(line, 'incomplete', null, [stillNeeded(missing)]);
        line.kindWords = TEXTS['MBP-FL-02-kind2'];
        line.phrase = TEXTS['MBP-FL-03'];
        const c = qu.cls;
        if (c.status === 'perUL')
            return settle(line, 'refused', 'E10-RC-01', [TEXTS['MBP-RF-14']]);
        if (c.status !== 'unit')
            return settle(line, 'refused', 'E10-RC-01', [needsUnit(label('amount'), AMOUNT_DIMS)]);
        if (c.dimension !== 'mass' && c.dimension !== 'volume' && c.dimension !== 'amount' && c.dimension !== 'activity') {
            return settle(line, 'refused', 'E10-RC-02', [needsUnit(label('amount'), AMOUNT_DIMS)]);
        }
        if (q.scan.kind === 'refused')
            return settle(line, 'refused', 'CCS-RF-03', [TEXTS['MBP-RF-02']]);
        if (q.scan.kind === 'tooLong')
            return settle(line, 'refused', 'CCS-RF-03', [tooManyDigits(label('amount'))]);
        if (q.scan.negative && !q.scan.allZeroDigits)
            return settle(line, 'refused', 'CCS-RF-03', [zeroOrMore(label('amount'))]);
        const echo = q.engineText;
        line.target = { type: 'echo', exact: null, unit: qu.ascii, unitDisplay: unitToDisplay(qu.ascii), figure: echo, display: echo + ' ' + unitToDisplay(qu.ascii), mode: 'typed', decimal: null, terminates: null, statement: null };
        line.amountOfSubstance = c.dimension === 'amount';
        markU(line, [qu]);
        if (c.dimension === 'volume' && rc.fu.cls.status === 'unit' && rc.fu.cls.dimension === 'volume') {
            const res = fns.E10C_F03(q.engineText, qu.ascii, rc.fu.ascii);
            if (res.status !== 'result')
                throw new Error('E10C-F03 refused a typed kind 2 volume: ' + JSON.stringify(res));
            line.bar = { exact: res.exact, unit: rc.fu.ascii };
        }
        return line;
    }
    function kind4(L, line) {
        const text = t(L.instruction);
        const missing = missingLabels([['instruction', text]]);
        if (missing.length)
            return settle(line, 'incomplete', null, [stillNeeded(missing)]);
        line.kindWords = TEXTS['MBP-FL-02-kind4'];
        line.note = TEXTS['MBP-FL-02-kind4-titrant'];
        line.target = { type: 'text', exact: null, unit: null, unitDisplay: null, figure: null, display: text, mode: 'typed', decimal: null, terminates: null, statement: null };
        return line;
    }
    function kind3(L, line, rc) {
        const route = t(L.route);
        if (route === '') {
            return settle(line, 'incomplete', null, [stillNeeded(missingLabels([['finalVolume', rc.fv.text], ['finalVolume', rc.fu.text], ['route', '']]))]);
        }
        if (route === 'activityMass')
            return activityMassLine(L, line, rc);
        if (route === 'f' && t(L.basis) === 'w/w')
            return settle(line, 'refused', 'page', [TEXTS['MBP-RF-12']]);
        const places = rc.rounding.declared ? [['roundingPlaces', rc.rounding.places]] : [];
        const tgt = numField('target', L.target, 'nonneg');
        const dimOfTarget = route === 'a' ? 'massConcentration' : route === 'b' ? 'molarConcentration' : route === 'd' ? 'activityConcentration' : route === 'c' ? CONC_DIMS : null;
        const tu = unitField('target', L.targetUnit, dimOfTarget);
        const stockDim = route === 'c' ? (tu.cls.status === 'unit' ? tu.cls.dimension : CONC_DIMS) : route === 'd' ? 'activityConcentration' : null;
        const sa = readSA(L.sa);
        const stmtUnit = unitField('saStatementUnit', L.statementUnit, 'activityConcentration');
        const saActive = (route === 'a' || route === 'c') && (sa.any || stmtUnit.text !== '');
        const stock = numField('stock', L.stock, 'pos');
        const su = unitField('stock', L.stockUnit, stockDim);
        const displayDim = route === 'a' || route === 'b' ? 'mass'
            : route === 'f' ? (t(L.basis) === 'w/v' ? 'mass' : t(L.basis) === 'v/v' ? 'volume' : null) : 'volume';
        const d = unitField('displayUnit', L.displayUnit, displayDim);
        const fw = numField('formulaWeight', L.formulaWeight, 'pos');
        const fold = numField('fold', L.fold, 'ge1');
        const pct = numField('percent', L.percent, 'pct');
        const basis = t(L.basis);
        const entries = [['finalVolume', rc.fv.text], ['finalVolume', rc.fu.text]];
        if (route === 'a')
            entries.push(['target', tgt.text], ['target', tu.text]);
        else if (route === 'b')
            entries.push(['target', tgt.text], ['target', tu.text], ['formulaWeight', fw.text]);
        else if (route === 'c' || route === 'd')
            entries.push(['target', tgt.text], ['target', tu.text], ['stock', stock.text], ['stock', su.text]);
        else if (route === 'e')
            entries.push(['fold', fold.text]);
        else if (route === 'f')
            entries.push(['percent', pct.text], ['basis', basis]);
        else
            throw new TypeError('route is a, b, c, d, e, f or activityMass');
        entries.push(['displayUnit', d.text], ...places);
        if (saActive)
            entries.push(['saStatementUnit', stmtUnit.text]);
        const missing = missingLabels(entries);
        if (saActive)
            for (const l of saMissing(sa))
                if (!missing.includes(l))
                    missing.push(l);
        const parts = [];
        if (missing.length)
            parts.push(stillNeeded(missing));
        if (route === 'b' && (t(L.formula) === '' || t(L.formulaSource) === ''))
            parts.push(TEXTS['MBP-IN-08']);
        if (parts.length)
            return settle(line, 'incomplete', null, parts);
        const gateNums = [rc.fv];
        const gateUnits = [rc.fu, d];
        if (route === 'a') {
            gateNums.push(tgt);
            gateUnits.push(tu);
        }
        else if (route === 'b') {
            gateNums.push(tgt, fw);
            gateUnits.push(tu);
        }
        else if (route === 'c' || route === 'd') {
            gateNums.push(tgt, stock);
            gateUnits.push(tu, su);
        }
        else if (route === 'e')
            gateNums.push(fold);
        else
            gateNums.push(pct);
        if (saActive) {
            if (sa.form === 'single')
                gateNums.push(sa.single);
            if (sa.form === 'minimum' || sa.form === 'range')
                gateNums.push(sa.lower);
            if (sa.form === 'maximum' || sa.form === 'range')
                gateNums.push(sa.upper);
            gateUnits.push(stmtUnit, sa.unit);
        }
        const tooLong = tooLongGate(gateNums, gateUnits);
        if (tooLong)
            return settle(line, 'refused', 'CCS-RF-03', tooLong);
        if (saActive) {
            const early = checkStatement('mass', sa, tgt, tu, stmtUnit, 'saStatementUnit');
            if (early)
                return settle(line, early.state, early.code, early.parts);
        }
        const V = [rc.fv.engineText, rc.fu.ascii];
        let main;
        let barArgs = null;
        let barFn = null;
        let map;
        let units;
        if (route === 'a') {
            map = { c: tgt, unit: tu, V: rc.fv, Vunit: rc.fu, toUnit: d };
            units = [tu, rc.fu, d];
            main = run(fns.E10C_F12, [tgt.engineText, tu.ascii, ...V, d.ascii], map, units);
        }
        else if (route === 'b') {
            const map1 = { c: tgt, unit: tu, MW: fw };
            const c1 = run(fns.E10C_F05, [tgt.engineText, tu.ascii, fw.engineText, 'g/L'], map1, [tu]);
            line.intermediates.push(makeIntermediate(c1.exact, 'g/L'));
            const text = callOneText(c1.exact);
            map = { c: tgt, unit: tu, V: rc.fv, Vunit: rc.fu, toUnit: d };
            units = [tu, rc.fu, d];
            main = run(fns.E10C_F12, [text, 'g/L', ...V, d.ascii], map, units);
        }
        else if (route === 'c') {
            const nUnit = tu.cls.status === 'unit' && tu.cls.dimension === 'molarConcentration' ? 'mol' : 'g';
            const map1 = { c: tgt, unit: tu, V: rc.fv, Vunit: rc.fu };
            const c1 = run(fns.E10C_F12, [tgt.engineText, tu.ascii, ...V, nUnit], map1, [tu, rc.fu]);
            line.intermediates.push(makeIntermediate(c1.exact, nUnit));
            const text = callOneText(c1.exact);
            map = { c: stock, cUnit: su, toUnit: d };
            units = [tu, su, d];
            main = run(fns.E10R_F14, [text, nUnit, stock.engineText, su.ascii, d.ascii], map, units);
            barFn = fns.E10R_F14;
            barArgs = [text, nUnit, stock.engineText, su.ascii, rc.fu.ascii];
        }
        else if (route === 'd') {
            const act = tu.cls.status === 'unit' && tu.cls.family === 'U' ? 'U' : 'IU';
            const map1 = { c: tgt, cUnit: tu, V: rc.fv, Vunit: rc.fu };
            const c1 = run(fns.E10R_F22, [tgt.engineText, tu.ascii, ...V, act], map1, [tu, rc.fu]);
            line.intermediates.push(makeIntermediate(c1.exact, act));
            const text = callOneText(c1.exact);
            map = { c: stock, cUnit: su, toUnit: d };
            units = [tu, su, d];
            main = run(fns.E10R_F14, [text, act, stock.engineText, su.ascii, d.ascii], map, units);
            barFn = fns.E10R_F14;
            barArgs = [text, act, stock.engineText, su.ascii, rc.fu.ascii];
        }
        else if (route === 'e') {
            map = { Vfinal: rc.fv, Vunit: rc.fu, fold, toUnit: d };
            units = [rc.fu, d];
            main = run(fns.E10R_F18, [...V.slice(0, 1), rc.fu.ascii, fold.engineText, d.ascii], map, units);
            barFn = fns.E10R_F18;
            barArgs = [rc.fv.engineText, rc.fu.ascii, fold.engineText, rc.fu.ascii];
        }
        else {
            map = { pct, B: rc.fv, Bunit: rc.fu, toUnit: d };
            units = [rc.fu, d];
            main = run(fns.E10R_F16, [pct.engineText, basis, 'final', ...V, d.ascii], map, units);
            if (basis === 'v/v') {
                barFn = fns.E10R_F16;
                barArgs = [pct.engineText, basis, 'final', ...V, rc.fu.ascii];
            }
        }
        line.target = makeFigure(main.exact, d.ascii, d.cls.dimension, rc);
        if (barFn)
            line.bar = barValue(barFn, barArgs, map, units, rc);
        if (route === 'a')
            line.kindWords = kind3SolidWords();
        else if (route === 'b')
            line.kindWords = kind3SolidFwWords(fw.text);
        else if (route === 'c' || route === 'd')
            line.kindWords = kind3StockWords(stock.text + ' ' + unitDisplay(su));
        else if (route === 'e')
            line.kindWords = kind3FoldWords(fold.text);
        else
            line.kindWords = kind3PercentWords(pct.text, basis);
        if (route === 'f' && basis === 'w/v')
            line.flags.push(TEXTS['MBP-FL-10']);
        if (route === 'd')
            markU(line, [tu, su]);
        if (saActive) {
            const s = buildStatement('mass', sa, tgt, tu, stmtUnit, 'saStatementUnit', rc.rounding);
            if (s.state === 'refused')
                throw new Refusal(s.code, s.parts);
            applyStatement(line, s);
        }
        return line;
    }
    function applyStatement(line, s) {
        line.statement = s.statement;
        line.statementRoute = s.route;
        line.statementFigures = s.figures;
        line.roundingStatements.push(...s.roundingStatements);
        for (const f of s.flags)
            if (!line.flags.includes(f))
                line.flags.push(f);
        for (const f of s.figures)
            if (f.mode === 'sci3')
                line.sci3Shown = true;
    }
    function activityMassLine(L, line, rc) {
        line.noAmount = true;
        line.noAmountText = TEXTS['MBP-CD-02-noAmount'];
        const tgt = numField('target', L.target, 'pos');
        const tu = unitField('target', L.targetUnit, 'activityConcentration');
        const d = unitField('displayUnit', L.displayUnit, 'massConcentration');
        const sa = readSA(L.sa);
        const entries = [['target', tgt.text], ['target', tu.text], ['displayUnit', d.text]];
        if (rc.rounding.declared)
            entries.push(['roundingPlaces', rc.rounding.places]);
        const missing = missingLabels(entries);
        if (sa.any)
            for (const l of saMissing(sa))
                if (!missing.includes(l))
                    missing.push(l);
        const parts = [];
        if (missing.length)
            parts.push(stillNeeded(missing));
        if (!sa.any)
            parts.push(TEXTS['MBP-RF-06']);
        if (parts.length)
            return settle(line, 'incomplete', null, parts);
        const amNums = [tgt];
        if (sa.form === 'single')
            amNums.push(sa.single);
        if (sa.form === 'minimum' || sa.form === 'range')
            amNums.push(sa.lower);
        if (sa.form === 'maximum' || sa.form === 'range')
            amNums.push(sa.upper);
        const amLong = tooLongGate(amNums, [tu, d, sa.unit]);
        if (amLong)
            return settle(line, 'refused', 'CCS-RF-03', amLong);
        line.kindWords = kind3ActivityMassWords();
        const s = buildStatement('activity', sa, tgt, tu, d, 'displayUnit', rc.rounding);
        if (s.state !== 'result')
            return settle(line, s.state, s.code, s.parts);
        applyStatement(line, s);
        line.state = 'statementOnly';
        return line;
    }
    function runLine(L, n, rc) {
        const kind = L.kind;
        if (kind === undefined || kind === null || kind === '') {
            return settle(newLine(L, n, undefined), 'incomplete', null, [stillNeeded([label('lineKind')])]);
        }
        if (kind !== 1 && kind !== 2 && kind !== 3 && kind !== 4)
            throw new TypeError('kind is 1, 2, 3 or 4');
        const line = newLine(L, n, kind);
        try {
            if (kind === 1)
                kind1(L, line, rc);
            else if (kind === 2)
                kind2(L, line, rc);
            else if (kind === 3)
                kind3(L, line, rc);
            else
                kind4(L, line);
        }
        catch (e) {
            if (e instanceof Refusal)
                return clearFigure(settle(line, 'refused', e.code, e.parts));
            if (e instanceof FigureStop) {
                line.stop = e.reason;
                clearFigure(line);
                return settle(line, 'stop', null, [RULED['MBP-DP-stop']]);
            }
            throw e;
        }
        if (line.target && line.target.type === 'figure' && line.target.mode === 'sci3')
            line.sci3Shown = true;
        for (let i = 0; i < line.intermediates.length; i++)
            if (line.intermediates[i].mode === 'sci3')
                line.sci3Shown = true;
        return line;
    }
    function clearFigure(line) {
        line.target = null;
        line.factor = null;
        line.intermediates = [];
        line.bar = null;
        line.sci3Shown = false;
        line.statement = null;
        line.statementRoute = null;
        line.statementFigures = [];
        line.roundingStatements = [];
        line.flags = [];
        line.amountOfSubstance = false;
        return line;
    }
    return function calculate(input, engineInfo) {
        if (!engineInfo || typeof engineInfo.version !== 'string' || typeof engineInfo.commit !== 'string') {
            throw new TypeError('calculate needs the engine version and commit (makeEngineInfo)');
        }
        const rc = recipeContext(input && input.recipe);
        const rl = recipeLevel(rc);
        const lines = [];
        const src = (input && input.lines) || [];
        for (let i = 0; i < src.length; i++)
            lines.push(runLine(src[i], i + 1, rc));
        const finalAsTyped = rl.state === 'result' ? rc.fv.text + ' ' + unitDisplay(rc.fu) : null;
        const recipe = {
            state: rl.state,
            code: rl.code,
            parts: rl.parts,
            reason: rl.parts.length ? rl.parts.join(' ') : null,
            finalVolume: { text: rc.fv.text, unit: rc.fu.ascii, unitDisplay: unitDisplay(rc.fu), asTyped: finalAsTyped },
            baseLiquid: rc.solvent,
            rounding: {
                declared: rc.rounding.declared, rule: rc.rounding.rule, places: rc.rounding.places,
                refused: rc.rounding.refused, message: rc.rounding.message,
            },
            makeUp: rl.state === 'result' ? makeUpRow(finalAsTyped, rc.solvent) : null,
            makeUpActual: t(rc.rec.makeUpActual),
        };
        const barValues = [];
        const summary = { result: 0, incomplete: 0, refused: 0, stop: 0, statementOnly: 0 };
        let sci3Shown = false;
        for (let i = 0; i < lines.length; i++) {
            const l = lines[i];
            summary[l.state]++;
            if (l.bar)
                barValues.push({ ordinal: l.ordinal, exact: l.bar.exact, unit: l.bar.unit });
            if (l.sci3Shown)
                sci3Shown = true;
        }
        let outcome = null;
        let fill = null;
        const everyLineHasResult = summary.incomplete === 0 && summary.refused === 0 && summary.stop === 0;
        if (rl.state === 'result' && everyLineHasResult && barValues.length > 0) {
            const finalCall = fns.E10C_F03(rc.fv.engineText, rc.fu.ascii, rc.fu.ascii);
            if (finalCall.status !== 'result') {
                outcome = 'notDrawn';
            }
            else {
                const fillLines = barValues.map((v) => ({ exact: v.exact, unit: v.unit }));
                const test = fns.E10R_F23(fillLines, { exact: finalCall.exact, unit: rc.fu.ascii });
                if (test.status !== 'result') {
                    outcome = 'notDrawn';
                }
                else {
                    fill = test.fill;
                    outcome = fill === 'over' ? 'overFull' : 'fill';
                }
            }
        }
        return {
            engine: engineInfo,
            recipe,
            lines,
            bar: {
                unit: rc.fu.cls.status === 'unit' && rc.fu.cls.dimension === 'volume' ? rc.fu.ascii : null,
                values: barValues,
                outcome,
                fill,
            },
            sci3Shown,
            summary,
            percentSolution: input && input.percent ? percentSolution(input.percent) : null,
        };
    };
}
export const calculate = makeCalculator();
