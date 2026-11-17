import { PAGE, LABELS, RULED, TEXTS, WORKING, SA_FORM_WORDS, fill, rowCopy } from './texts.js';
import { unitToDisplay } from './scanner.js';
import { el } from './dom.js';
const TIMES = '×';
const SA_ROUTES = ['a', 'c', 'activityMass'];
const withUnit = (v, u) => v + ' ' + unitToDisplay(u);
function typedPairs(m, kind, rec) {
    const p = [];
    const add = (label, text) => { if (text !== '')
        p.push([label, text]); };
    const addUV = (label, v, u) => { if (v !== '')
        p.push([label, withUnit(v, u)]); };
    add(PAGE.component, m.name);
    if (kind === 1) {
        const own = m.sourceVolume !== '' || m.sourceUnit !== '';
        addUV(LABELS.finalVolume.text, rec.finalVolume, rec.finalUnit);
        addUV(LABELS.sourceVolume.text, own ? m.sourceVolume : rec.sourceVolume, own ? m.sourceUnit : rec.sourceUnit);
        addUV(LABELS.amount.text, m.amount, m.amountUnit);
        add(LABELS.displayUnit.text, unitToDisplay(m.displayUnit));
    }
    else if (kind === 2) {
        addUV(LABELS.amount.text, m.amount, m.amountUnit);
    }
    else if (kind === 4) {
        add(LABELS.instruction.text, m.instruction);
    }
    else if (kind === 3) {
        const r = m.route;
        if (r !== 'activityMass')
            addUV(LABELS.finalVolume.text, rec.finalVolume, rec.finalUnit);
        if (r === 'a' || r === 'b' || r === 'c' || r === 'd' || r === 'activityMass')
            addUV(LABELS.target.text, m.target, m.targetUnit);
        if (r === 'b') {
            add(LABELS.formulaWeight.text, m.formulaWeight);
            add(LABELS.formula.text, m.formula);
            add(LABELS.formulaSource.text, m.formulaSource);
        }
        if (r === 'c' || r === 'd')
            addUV(LABELS.stock.text, m.stock, m.stockUnit);
        if (r === 'e')
            add(LABELS.fold.text, m.fold);
        if (r === 'f') {
            add(LABELS.percent.text, m.percent);
            add(LABELS.basis.text, m.basis);
        }
        add(LABELS.displayUnit.text, unitToDisplay(m.displayUnit));
        if (SA_ROUTES.includes(r) && m.sa && m.sa.form !== '') {
            const sa = m.sa;
            add(LABELS.saForm.text, SA_FORM_WORDS[sa.form] || '');
            if (sa.form === 'single')
                addUV(LABELS.saValue.text, sa.single, sa.unit);
            if (sa.form === 'minimum' || sa.form === 'range') {
                add(LABELS.saLowerStrictness.text, sa.lowerWord);
                addUV(LABELS.saLower.text, sa.lower, sa.unit);
            }
            if (sa.form === 'maximum' || sa.form === 'range') {
                add(LABELS.saUpperStrictness.text, sa.upperWord);
                addUV(LABELS.saUpper.text, sa.upper, sa.unit);
            }
            add(LABELS.saLot.text, sa.lot);
            add(LABELS.saSource.text, sa.source);
            add(LABELS.saDocNumber.text, sa.docNumber);
            add(LABELS.saStatementUnit.text, unitToDisplay(m.statementUnit));
        }
    }
    return p;
}
export function workingLines(result, model, i) {
    const l = result.lines[i];
    const m = model.lines[i];
    const out = [];
    if (l.kindWords)
        out.push(l.kindWords);
    if (l.phrase)
        out.push(l.phrase);
    for (const [label, text] of typedPairs(m, l.kind, model.recipe))
        out.push(rowCopy(label, text));
    for (let j = 0; j < l.intermediates.length; j++)
        out.push(l.intermediates[j].display);
    if (l.factor)
        out.push(TIMES + ' ' + l.factor.display);
    if (l.kind === 3 && m.route === 'f' && l.target && l.target.display && result.recipe.finalVolume.asTyped !== null) {
        const b = result.recipe.finalVolume.asTyped;
        if (m.basis === 'w/v')
            out.push(WORKING.wv(m.percent, b, l.target.display));
        else if (m.basis === 'v/v')
            out.push(WORKING.vvFinal(m.percent, b, l.target.display));
    }
    if (l.target && l.target.display && !l.noAmount)
        out.push(rowCopy(RULED['MBP-DT-12-label-target'], l.target.display));
    if (l.statement)
        out.push(l.statement);
    if (l.target && l.target.statement)
        out.push(l.target.statement);
    for (let j = 0; j < l.roundingStatements.length; j++)
        out.push(l.roundingStatements[j]);
    if (l.sci3Shown)
        out.push(TEXTS['MBP-FL-09']);
    out.push(TEXTS['MBP-FL-07']);
    return out;
}
export function percentWorkingLines(ps) {
    const out = [];
    if (ps.working)
        out.push(ps.working);
    if (ps.sci3Shown)
        out.push(TEXTS['MBP-FL-09']);
    out.push(TEXTS['MBP-FL-07']);
    return out;
}
export function renderWorking(doc, summaryText, lines) {
    const d = el(doc, 'details', { class: 'working-item' });
    d.appendChild(el(doc, 'summary', null, summaryText));
    for (let i = 0; i < lines.length; i++)
        d.appendChild(el(doc, 'p', null, lines[i]));
    return d;
}
export const workingSummary = (n) => fill(PAGE.workingLine, { n: String(n) });
