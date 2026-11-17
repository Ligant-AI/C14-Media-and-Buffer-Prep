import { PAGE, LINE_KIND_WORDS, fill } from './texts.js';
import { unitToDisplay } from './scanner.js';
import { el } from './dom.js';
const SA_ROUTES = ['a', 'c', 'activityMass'];
function saPart(sa) {
    const unit = unitToDisplay(sa.unit);
    let text = null;
    if (sa.form === 'single')
        text = fill(PAGE.saSingle, { v: sa.single, unit });
    else if (sa.form === 'minimum')
        text = fill(PAGE.saBound, { strictness: sa.lowerWord, v: sa.lower, unit });
    else if (sa.form === 'maximum')
        text = fill(PAGE.saBound, { strictness: sa.upperWord, v: sa.upper, unit });
    else if (sa.form === 'range') {
        text = fill(PAGE.saRange, { 'lower strictness': sa.lowerWord, low: sa.lower, 'upper strictness': sa.upperWord, high: sa.upper, unit });
    }
    if (text === null)
        return '';
    return fill(PAGE.partSa, { sa: text, lot: sa.lot, source: sa.source, doc: sa.docNumber });
}
function lineParts(m, kind, rec) {
    let s = '';
    if (kind === 1) {
        const own = m.sourceVolume !== '' || m.sourceUnit !== '';
        const v = own ? m.sourceVolume : rec.sourceVolume;
        const u = own ? m.sourceUnit : rec.sourceUnit;
        s += fill(PAGE.partSource, { v, unit: unitToDisplay(u) });
    }
    else if (kind === 3) {
        const r = m.route;
        if (r === 'b')
            s += fill(PAGE.partFw, { fw: m.formulaWeight, formula: m.formula, source: m.formulaSource });
        else if (r === 'c' || r === 'd')
            s += fill(PAGE.partStock, { v: m.stock, unit: unitToDisplay(m.stockUnit) });
        else if (r === 'e')
            s += fill(PAGE.partFold, { fold: m.fold });
        else if (r === 'f')
            s += fill(PAGE.partBasis, { basis: m.basis });
        if (SA_ROUTES.includes(r) && m.sa && m.sa.form !== '')
            s += saPart(m.sa);
    }
    return s;
}
export function stripLines(result, model) {
    const rec = result.recipe;
    const out = [];
    out.push(fill(PAGE.stripFinal, { v: rec.finalVolume.text, unit: rec.finalVolume.unitDisplay }));
    out.push(fill(PAGE.stripBase, { text: rec.baseLiquid }));
    for (let i = 0; i < result.lines.length; i++) {
        const l = result.lines[i];
        const head = fill(PAGE.stripLine, { n: String(l.ordinal), 'kind word': LINE_KIND_WORDS[l.kind] });
        out.push(head + lineParts(model.lines[i], l.kind, model.recipe));
    }
    const r = rec.rounding;
    if (!r.declared || r.refused)
        out.push(PAGE.roundingNone);
    else if (r.places === '1')
        out.push(fill(PAGE.roundingDeclaredOne, { rule: r.rule }));
    else
        out.push(fill(PAGE.roundingDeclared, { rule: r.rule, places: r.places }));
    return out;
}
export function renderStrip(doc, parent, lines) {
    const ul = el(doc, 'ul', { class: 'strip' });
    for (let i = 0; i < lines.length; i++)
        ul.appendChild(el(doc, 'li', null, lines[i]));
    parent.appendChild(ul);
    return ul;
}
