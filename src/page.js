import { PAGE, LABELS, RULED, TEXTS, LINE_KIND_WORDS, ROUTE_WORDS, SA_FORM_WORDS, LOWER_STRICTNESS_WORDS, UPPER_STRICTNESS_WORDS, fill, } from './texts.js';
import { basesOffered, PERCENT_MODES } from './percent.js';
import { buildCard, copyText } from './card.js';
import { renderCard } from './card-render.js';
import { barSpec } from './bar.js';
import { stripLines, renderStrip } from './strip.js';
import { workingLines, percentWorkingLines, renderWorking, workingSummary } from './working.js';
import { renderAbout } from './about.js';
import { engineLine } from './engine-info.js';
import { buildExport, toNotebook, toCsv, toJson, fileName, FILE_TYPES, downloadText } from './export.js';
import { el, append, unitOptions, setHidden } from './dom.js';
import { makeControl, wordOptions } from './form.js';
const W = (k) => TEXTS['MBP-IN-14-W' + k];
const AMOUNT_DIMS = ['mass', 'volume', 'amount', 'activity'];
const CONC_DIMS = ['massConcentration', 'molarConcentration'];
const KINDS = [1, 2, 3, 4];
const ROUNDING_WORDS = { none: 'none', 'half-up': 'half-up', 'half-even': 'half-even' };
const BASIS_OPTIONS = (list) => list.map((b) => ({ value: b, text: b }));
const WORD_LIST = (list) => list.map((w) => ({ value: w, text: w }));
function getPath(m, key) {
    const p = key.split('.');
    let o = m;
    for (let i = 0; i < p.length - 1; i++)
        o = o[p[i]];
    return o[p[p.length - 1]];
}
function setPath(m, key, v) {
    const p = key.split('.');
    let o = m;
    for (let i = 0; i < p.length - 1; i++)
        o = o[p[i]];
    o[p[p.length - 1]] = v;
}
const hasOption = (opts, v) => opts.some((o) => o.value === v);
const unitLabel = (base) => fill(PAGE.unitPicker, { 'field label': base });
function emptyLine() {
    return {
        name: '', kind: undefined, route: '', sourceVolume: '', sourceUnit: '', amount: '', amountUnit: '',
        target: '', targetUnit: '', stock: '', stockUnit: '', formulaWeight: '', formula: '', formulaSource: '',
        fold: '', percent: '', basis: '', displayUnit: '', instruction: '', actual: '', statementUnit: '',
        sa: { form: '', single: '', lower: '', upper: '', unit: '', lowerWord: '', upperWord: '', lot: '', source: '', docNumber: '' },
    };
}
export function mountPage(doc, root, { calculate, engineInfo, clipboard, exporter }) {
    const ex = exporter || {};
    const doDownload = ex.download || ((text, name, mime) => { downloadText(root, doc, text, name, mime, ex); });
    const doPrint = ex.print || (() => { if (typeof window !== 'undefined' && typeof window.print === 'function')
        window.print(); });
    let lastResult = null;
    let exportOpen = false;
    const idCount = [];
    const ctx = { doc, nextId: (base) => base + '-' + idCount.push(0) };
    let model = null;
    let pct = null;
    let recipeOwner = null;
    let lineStates = [];
    let pctOwner = null;
    function resetState() {
        const recipe = {
            finalVolume: '', finalUnit: '', baseLiquid: '', sourceVolume: '', sourceUnit: '',
            rounding: { rule: 'none', places: '' },
        };
        model = { recipe, lines: [], percent: null };
        pct = { mode: '', basis: '', percent: '', b: '', bUnit: '', displayUnit: '', solvent: '', rounding: recipe.rounding };
        recipeOwner = { m: recipe, ex: new Set(), parts: { main: [] } };
        pctOwner = { m: pct, ex: new Set(), parts: { main: [] } };
        lineStates = [];
    }
    const bannerSlot = el(doc, 'div', { id: 'banner-slot' });
    const layout = el(doc, 'div', { class: 'layout' });
    const formPanel = el(doc, 'section', { class: 'panel', id: 'form-panel' });
    const panelHead = (n, title) => {
        const head = el(doc, 'div', { class: 'panel-head' });
        const titles = el(doc, 'div', { class: 'titles' });
        append(titles, [el(doc, 'span', { class: 'step', 'aria-hidden': 'true' }, String(n)), el(doc, 'h2', null, title)]);
        head.appendChild(titles);
        return head;
    };
    const formHead = panelHead(1, PAGE.headingRecipe);
    const formBody = el(doc, 'div', { class: 'panel-body', id: 'form-body' });
    formPanel.appendChild(formHead);
    formPanel.appendChild(formBody);
    const cardPanel = el(doc, 'section', { class: 'panel', id: 'card-panel' });
    const cardHead = panelHead(2, PAGE.panelCard);
    const cardBody = el(doc, 'div', { class: 'panel-body' });
    const cardRegion = el(doc, 'div', { id: 'card-region' });
    const barArea = el(doc, 'div', { id: 'bar-area' });
    const strip = el(doc, 'div', { id: 'strip' });
    const working = el(doc, 'div', { id: 'working' });
    append(cardBody, [cardRegion, barArea, strip, working]);
    cardPanel.appendChild(cardHead);
    cardPanel.appendChild(cardBody);
    append(layout, [formPanel, cardPanel]);
    const about = el(doc, 'section', { id: 'about' });
    append(root, [bannerSlot, layout, about]);
    const live = el(doc, 'div', { id: 'live', class: 'live', 'aria-live': 'polite' });
    const bannerEl = el(doc, 'p', { class: 'banner', role: 'status' }, PAGE.banner);
    const recipeMsg = el(doc, 'p', { class: 'msg', id: 'msg-recipe' }, '');
    const roundingMsg = el(doc, 'p', { class: 'msg', id: 'msg-rounding' }, '');
    const percentMsg = el(doc, 'p', { class: 'msg', id: 'msg-percent' }, '');
    const percentResult = el(doc, 'div', { id: 'percent-result' });
    function bind(owner, partName, key, spec) {
        const f = makeControl(ctx, Object.assign({}, spec, {
            value: spec.fromModel ? spec.fromModel(getPath(owner.m, key)) : getPath(owner.m, key),
            isExample: () => owner.ex.has(key),
            onValue: (v) => {
                setPath(owner.m, key, spec.toModel ? spec.toModel(v) : v);
                owner.ex.delete(key);
                f.refreshMark();
                if (spec.after)
                    spec.after(v);
                changed();
            },
        }));
        owner.parts[partName].push({ key, label: spec.label, field: f });
        return f;
    }
    const numSpec = (label, extra) => Object.assign({ type: 'text', label, inputmode: 'decimal' }, extra || {});
    const textSpec = (label, extra) => Object.assign({ type: 'text', label }, extra || {});
    function pair(owner, part, valueKey, unitKey, labelText, dims, extra) {
        const div = el(doc, 'div', { class: 'pair' });
        const v = bind(owner, part, valueKey, numSpec(labelText, extra));
        const u = bind(owner, part, unitKey, { type: 'select', label: unitLabel(labelText), options: unitOptions(dims) });
        append(div, [v.wrap, u.wrap]);
        return { div, v, u };
    }
    function buildRecipe() {
        const sec = el(doc, 'section', { class: 'recipe' });
        const o = recipeOwner;
        const fv = pair(o, 'main', 'finalVolume', 'finalUnit', LABELS.finalVolume.text, ['volume'], { why: W(1), describedBy: ['msg-recipe'] });
        sec.appendChild(fv.div);
        sec.appendChild(recipeMsg);
        sec.appendChild(bind(o, 'main', 'baseLiquid', textSpec(LABELS.baseLiquid.text)).wrap);
        sec.appendChild(pair(o, 'main', 'sourceVolume', 'sourceUnit', LABELS.sourceVolume.text, ['volume']).div);
        const placesBox = el(doc, 'div', { class: 'places', id: 'places-box' });
        const rule = bind(o, 'main', 'rounding.rule', {
            type: 'select', label: LABELS.rounding.text, options: wordOptions(ROUNDING_WORDS), noEmpty: true,
            after: (v) => { setHidden(placesBox, v === 'none' || v === ''); },
        });
        sec.appendChild(rule.wrap);
        const places = bind(o, 'main', 'rounding.places', numSpec(LABELS.roundingPlaces.text, { inputmode: 'numeric', describedBy: ['msg-rounding'] }));
        append(placesBox, [places.wrap, roundingMsg]);
        setHidden(placesBox, o.m.rounding.rule === 'none' || o.m.rounding.rule === '');
        sec.appendChild(placesBox);
        return sec;
    }
    const ordinalOf = (L) => String(lineStates.indexOf(L) + 1);
    const kindToModel = (v) => { for (let i = 0; i < KINDS.length; i++)
        if (String(KINDS[i]) === v)
            return KINDS[i]; return undefined; };
    function saBoxBuild(L, withStatementUnit) {
        L.parts.sa = [];
        const sa = L.m.sa;
        const kids = [];
        const form = sa.form;
        const lowerOn = form === 'minimum' || form === 'range';
        const upperOn = form === 'maximum' || form === 'range';
        if (form === 'single')
            kids.push(bind(L, 'sa', 'sa.single', numSpec(LABELS.saValue.text, { why: W(5) })).wrap);
        if (lowerOn) {
            kids.push(bind(L, 'sa', 'sa.lowerWord', { type: 'select', label: LABELS.saLowerStrictness.text, options: WORD_LIST(LOWER_STRICTNESS_WORDS) }).wrap);
            kids.push(bind(L, 'sa', 'sa.lower', numSpec(LABELS.saLower.text, { why: W(5) })).wrap);
        }
        if (upperOn) {
            kids.push(bind(L, 'sa', 'sa.upperWord', { type: 'select', label: LABELS.saUpperStrictness.text, options: WORD_LIST(UPPER_STRICTNESS_WORDS) }).wrap);
            kids.push(bind(L, 'sa', 'sa.upper', numSpec(LABELS.saUpper.text, form === 'maximum' ? { why: W(5) } : {})).wrap);
        }
        if (form !== '') {
            kids.push(bind(L, 'sa', 'sa.unit', { type: 'select', label: LABELS.saUnit.text, options: unitOptions(['specificActivity']) }).wrap);
            kids.push(bind(L, 'sa', 'sa.lot', textSpec(LABELS.saLot.text)).wrap);
            kids.push(bind(L, 'sa', 'sa.source', textSpec(LABELS.saSource.text)).wrap);
            kids.push(bind(L, 'sa', 'sa.docNumber', textSpec(LABELS.saDocNumber.text)).wrap);
            if (withStatementUnit) {
                kids.push(bind(L, 'sa', 'statementUnit', { type: 'select', label: LABELS.saStatementUnit.text, options: unitOptions(['activityConcentration']) }).wrap);
            }
        }
        L.saBox.replaceChildren(...kids);
    }
    function saSection(L, withStatementUnit) {
        L.saBox = el(doc, 'div', { class: 'sa-box' });
        const formField = bind(L, 'route', 'sa.form', {
            type: 'select', label: LABELS.saForm.text, options: wordOptions(SA_FORM_WORDS),
            after: () => { saBoxBuild(L, withStatementUnit); },
        });
        saBoxBuild(L, withStatementUnit);
        return [formField.wrap, L.saBox];
    }
    function displayField(L, dims) {
        return bind(L, 'route', 'displayUnit', { type: 'select', label: LABELS.displayUnit.text, options: unitOptions(dims) });
    }
    function routeBuild(L) {
        L.parts.route = [];
        L.parts.sa = [];
        const route = L.m.route;
        const kids = [];
        const T = LABELS.target.text;
        const S = LABELS.stock.text;
        if (route === 'a') {
            kids.push(pair(L, 'route', 'target', 'targetUnit', T, ['massConcentration']).div);
            kids.push(displayField(L, ['mass']).wrap);
            kids.push(...saSection(L, true));
        }
        else if (route === 'b') {
            kids.push(pair(L, 'route', 'target', 'targetUnit', T, ['molarConcentration']).div);
            kids.push(bind(L, 'route', 'formulaWeight', numSpec(LABELS.formulaWeight.text)).wrap);
            kids.push(bind(L, 'route', 'formula', textSpec(LABELS.formula.text)).wrap);
            kids.push(bind(L, 'route', 'formulaSource', textSpec(LABELS.formulaSource.text, { why: W(4) })).wrap);
            kids.push(displayField(L, ['mass']).wrap);
        }
        else if (route === 'c') {
            kids.push(pair(L, 'route', 'target', 'targetUnit', T, CONC_DIMS).div);
            kids.push(pair(L, 'route', 'stock', 'stockUnit', S, CONC_DIMS).div);
            kids.push(displayField(L, ['volume']).wrap);
            kids.push(...saSection(L, true));
        }
        else if (route === 'd') {
            kids.push(pair(L, 'route', 'target', 'targetUnit', T, ['activityConcentration']).div);
            kids.push(pair(L, 'route', 'stock', 'stockUnit', S, ['activityConcentration']).div);
            kids.push(displayField(L, ['volume']).wrap);
        }
        else if (route === 'e') {
            kids.push(bind(L, 'route', 'fold', numSpec(LABELS.fold.text)).wrap);
            kids.push(displayField(L, ['volume']).wrap);
        }
        else if (route === 'f') {
            kids.push(bind(L, 'route', 'percent', numSpec(LABELS.percent.text)).wrap);
            let disp = null;
            const dimsOf = (b) => (b === 'v/v' ? ['volume'] : ['mass']);
            const basis = bind(L, 'route', 'basis', {
                type: 'select', label: LABELS.basis.text, options: BASIS_OPTIONS(['w/v', 'v/v']), why: W(3),
                after: (v) => {
                    const opts = unitOptions(dimsOf(v));
                    if (!hasOption(opts, L.m.displayUnit)) {
                        L.m.displayUnit = '';
                        L.ex.delete('displayUnit');
                    }
                    disp.setOptions(opts, L.m.displayUnit);
                    disp.refreshMark();
                },
            });
            kids.push(basis.wrap);
            disp = displayField(L, dimsOf(L.m.basis));
            kids.push(disp.wrap);
        }
        else if (route === 'activityMass') {
            kids.push(pair(L, 'route', 'target', 'targetUnit', T, ['activityConcentration']).div);
            kids.push(displayField(L, ['massConcentration']).wrap);
            kids.push(...saSection(L, false));
        }
        L.routeBox.replaceChildren(...kids);
    }
    function kindBuild(L) {
        L.parts.kind = [];
        L.parts.route = [];
        L.parts.sa = [];
        const kind = L.m.kind;
        const kids = [];
        if (kind === 1) {
            kids.push(pair(L, 'kind', 'sourceVolume', 'sourceUnit', LABELS.sourceVolume.text, ['volume']).div);
            kids.push(pair(L, 'kind', 'amount', 'amountUnit', LABELS.amount.text, AMOUNT_DIMS).div);
            kids.push(bind(L, 'kind', 'displayUnit', { type: 'select', label: LABELS.displayUnit.text, options: unitOptions(AMOUNT_DIMS) }).wrap);
        }
        else if (kind === 2) {
            kids.push(pair(L, 'kind', 'amount', 'amountUnit', LABELS.amount.text, AMOUNT_DIMS).div);
        }
        else if (kind === 3) {
            kids.push(bind(L, 'kind', 'route', {
                type: 'select', label: LABELS.route.text, options: wordOptions(ROUTE_WORDS),
                after: () => { routeBuild(L); },
            }).wrap);
            L.routeBox = el(doc, 'div', { class: 'route-box' });
            kids.push(L.routeBox);
            routeBuild(L);
        }
        else if (kind === 4) {
            kids.push(bind(L, 'kind', 'instruction', textSpec(LABELS.instruction.text)).wrap);
        }
        L.kindBox.replaceChildren(...kids);
    }
    function numberLine(L) {
        const n = ordinalOf(L);
        L.legend.textContent = RULED['MBP-CD-01-number'] + ' ' + n;
        L.removeBtn.textContent = fill(PAGE.removeLine, { n });
        L.actualField.control.setAttribute('aria-label', fill(PAGE.actualName, { n }));
    }
    function lineBuild(L) {
        L.fieldset = el(doc, 'fieldset', { class: 'line', 'aria-describedby': L.msgId });
        L.legend = el(doc, 'legend', null, '');
        L.fieldset.appendChild(L.legend);
        L.parts = { head: [], kind: [], route: [], sa: [], tail: [] };
        L.fieldset.appendChild(bind(L, 'head', 'name', textSpec(PAGE.component)).wrap);
        L.fieldset.appendChild(bind(L, 'head', 'kind', {
            type: 'select', label: LABELS.lineKind.text, options: wordOptions(LINE_KIND_WORDS), why: W(2),
            fromModel: (x) => (x === undefined ? '' : String(x)), toModel: kindToModel,
            after: () => { kindBuild(L); },
        }).wrap);
        L.kindBox = el(doc, 'div', { class: 'kind-box' });
        L.fieldset.appendChild(L.kindBox);
        kindBuild(L);
        L.actualField = bind(L, 'tail', 'actual', textSpec(PAGE.actual, { why: W(6), ariaLabel: fill(PAGE.actualName, { n: '' }) }));
        L.fieldset.appendChild(L.actualField.wrap);
        L.msgEl = el(doc, 'p', { class: 'msg', id: L.msgId }, '');
        L.fieldset.appendChild(L.msgEl);
        L.removeBtn = el(doc, 'button', { type: 'button', class: 'remove-line' }, '');
        L.removeBtn.addEventListener('click', () => { removeLine(L); });
        L.fieldset.appendChild(L.removeBtn);
        numberLine(L);
    }
    function newLineState(m, exampleKeys) {
        return { m, ex: new Set(exampleKeys || []), msgId: ctx.nextId('msg-line'), parts: null };
    }
    function addLine(m, exampleKeys) {
        const L = newLineState(m || emptyLine(), exampleKeys);
        model.lines.push(L.m);
        lineStates.push(L);
        lineBuild(L);
        linesEl.appendChild(L.fieldset);
        return L;
    }
    function removeLine(L) {
        const at = lineStates.indexOf(L);
        if (at < 0)
            return;
        lineStates.splice(at, 1);
        model.lines.splice(at, 1);
        linesEl.removeChild(L.fieldset);
        for (let i = 0; i < lineStates.length; i++)
            numberLine(lineStates[i]);
        changed();
    }
    let linesEl = null;
    function buildPercent() {
        const o = pctOwner;
        const sec = el(doc, 'section', { class: 'percent', id: 'percent-section', 'aria-describedby': 'msg-percent' });
        sec.appendChild(el(doc, 'h3', null, PAGE.headingPercent));
        const q = el(doc, 'fieldset', { class: 'question' });
        q.appendChild(el(doc, 'legend', null, LABELS.question.text));
        const radios = [];
        for (let i = 0; i < PERCENT_MODES.length; i++) {
            const mode = PERCENT_MODES[i];
            const id = ctx.nextId('q');
            const row = el(doc, 'div', { class: 'radio' });
            const input = el(doc, 'input', { type: 'radio', name: 'percent-question', id, value: mode });
            input.checked = o.m.mode === mode;
            const lab = el(doc, 'label', { for: id }, TEXTS['MBP-IN-12-' + mode]);
            const h = () => {
                if (!input.checked)
                    return;
                o.m.mode = mode;
                refreshPercent();
                changed();
            };
            input.addEventListener('input', h);
            input.addEventListener('change', h);
            append(row, [input, lab]);
            q.appendChild(row);
            radios.push(input);
        }
        sec.appendChild(q);
        const basis = bind(o, 'main', 'basis', { type: 'select', label: LABELS.basis.text, options: [], why: W(3), after: () => { refreshPercent(); } });
        sec.appendChild(basis.wrap);
        sec.appendChild(bind(o, 'main', 'percent', numSpec(LABELS.percent.text)).wrap);
        const b = pair(o, 'main', 'b', 'bUnit', LABELS.bFinal.text, ['volume']);
        sec.appendChild(b.div);
        const disp = bind(o, 'main', 'displayUnit', { type: 'select', label: LABELS.displayUnit.text, options: [] });
        sec.appendChild(disp.wrap);
        sec.appendChild(bind(o, 'main', 'solvent', textSpec(LABELS.baseLiquid.text)).wrap);
        sec.appendChild(percentMsg);
        sec.appendChild(percentResult);
        function refreshPercent() {
            const m = o.m;
            const bKey = m.basis === 'w/w' ? 'bMass' : (m.mode === 'added' || m.mode === 'reach') ? 'bAdded' : 'bFinal';
            const lab = LABELS[bKey].text;
            b.v.labelEl.textContent = lab;
            b.u.labelEl.textContent = unitLabel(lab);
            const bases = BASIS_OPTIONS(basesOffered(m.mode));
            if (!hasOption(bases, m.basis))
                m.basis = '';
            basis.setOptions(bases, m.basis);
            const bOpts = unitOptions([m.basis === 'w/w' ? 'mass' : 'volume']);
            if (!hasOption(bOpts, m.bUnit))
                m.bUnit = '';
            b.u.setOptions(bOpts, m.bUnit);
            const dOpts = unitOptions([m.basis === 'v/v' ? 'volume' : 'mass']);
            if (!hasOption(dOpts, m.displayUnit))
                m.displayUnit = '';
            disp.setOptions(dOpts, m.displayUnit);
        }
        refreshPercent();
        return sec;
    }
    function buildForm() {
        const bar = el(doc, 'div', { class: 'toolbar' });
        const loadBtn = el(doc, 'button', { type: 'button', id: 'load-example' }, PAGE.loadExample);
        loadBtn.addEventListener('click', () => { loadExample(); });
        const clearBtn = el(doc, 'button', { type: 'button', id: 'clear' }, PAGE.clear);
        clearBtn.addEventListener('click', () => { clear(); });
        append(bar, [loadBtn, clearBtn]);
        linesEl = el(doc, 'div', { id: 'lines' });
        const addBtn = el(doc, 'button', { type: 'button', id: 'add-line' }, PAGE.addLine);
        addBtn.addEventListener('click', () => { addLine(); changed(); });
        formBody.replaceChildren(live, bar, buildRecipe(), linesEl, addBtn, buildPercent());
    }
    function loadExample() {
        resetState();
        const R = model.recipe;
        R.finalVolume = '500';
        R.finalUnit = 'mL';
        R.baseLiquid = 'RPMI';
        for (const k of ['finalVolume', 'finalUnit', 'baseLiquid'])
            recipeOwner.ex.add(k);
        buildForm();
        const one = Object.assign(emptyLine(), { name: 'serum', kind: 3, route: 'f', percent: '10', basis: 'v/v', displayUnit: 'mL' });
        addLine(one, ['name', 'kind', 'route', 'percent', 'basis', 'displayUnit']);
        const two = Object.assign(emptyLine(), {
            name: 'glutamine', kind: 3, route: 'c', target: '2', targetUnit: 'mM', stock: '200', stockUnit: 'mM', displayUnit: 'mL',
        });
        addLine(two, ['name', 'kind', 'route', 'target', 'targetUnit', 'stock', 'stockUnit', 'displayUnit']);
        const three = Object.assign(emptyLine(), {
            name: 'a cytokine', kind: 3, route: 'd', target: '100', targetUnit: 'IU/mL', stock: '100000', stockUnit: 'IU/mL', displayUnit: 'uL',
        });
        addLine(three, ['name', 'kind', 'route', 'target', 'targetUnit', 'stock', 'stockUnit', 'displayUnit']);
        for (let i = 0; i < lineStates.length; i++)
            refreshMarks(lineStates[i]);
        changed();
    }
    function clear() {
        resetState();
        buildForm();
        changed();
    }
    function refreshMarks(L) {
        const names = ['head', 'kind', 'route', 'sa', 'tail'];
        for (let i = 0; i < names.length; i++)
            for (const p of L.parts[names[i]])
                p.field.refreshMark();
    }
    function exampleFieldsInUse() {
        const out = [];
        for (const p of recipeOwner.parts.main)
            if (recipeOwner.ex.has(p.key))
                out.push(p.label);
        for (let i = 0; i < lineStates.length; i++) {
            const L = lineStates[i];
            const names = ['head', 'kind', 'route', 'sa', 'tail'];
            for (let j = 0; j < names.length; j++) {
                for (const p of L.parts[names[j]]) {
                    if (L.ex.has(p.key))
                        out.push(fill(PAGE.exampleField, { n: ordinalOf(L), label: p.label }));
                }
            }
        }
        return out;
    }
    function changed() {
        model.percent = pctAny() ? pct : null;
        update();
        bannerSlot.replaceChildren(...(exampleFieldsInUse().length > 0 ? [bannerEl] : []));
    }
    function pctAny() {
        return pct.mode !== '' || pct.basis !== '' || pct.percent !== '' || pct.b !== '' || pct.bUnit !== '' || pct.displayUnit !== '' || pct.solvent !== '';
    }
    function update() {
        const result = calculate(model, engineInfo);
        lastResult = result;
        const card = buildCard(result);
        const lines = card.state === 'result' ? stripLines(result, model) : null;
        const how = lines !== null && result.sci3Shown === true ? [TEXTS['MBP-FL-09']] : [];
        cardRegion.replaceChildren(...cardNodes(result, card, lines === null ? null : lines.concat(how)));
        showBar(result);
        showStrip(lines, how);
        showWorking(result);
        showMessages(result);
        renderPercent(result.percentSolution);
    }
    function showBar(result) {
        const state = barSpec(result).state;
        const text = state === 'overFull' ? PAGE.barOverFull : state === 'notDrawn' ? PAGE.barNotDrawn : null;
        barArea.replaceChildren(...(text === null ? [] : [el(doc, 'p', { class: 'bar-text' }, text)]));
    }
    function showStrip(lines, how) {
        strip.replaceChildren();
        if (lines === null)
            return;
        renderStrip(doc, strip, lines);
        for (let i = 0; i < how.length; i++)
            strip.appendChild(el(doc, 'p', { class: 'how-to-read' }, how[i]));
    }
    function showWorking(result) {
        const kids = [];
        for (let i = 0; i < result.lines.length; i++) {
            const l = result.lines[i];
            if (l.state !== 'result' && l.state !== 'statementOnly')
                continue;
            kids.push(renderWorking(doc, workingSummary(l.ordinal), workingLines(result, model, i)));
        }
        working.replaceChildren(...kids);
    }
    function cardNodes(result, card, copyStrip) {
        const nodes = [renderCard(doc, card)];
        const actions = el(doc, 'div', { class: 'card-actions' });
        const exportBtn = el(doc, 'button', { type: 'button', id: 'export-recipe', 'aria-expanded': 'false', 'aria-controls': 'export-group' }, PAGE.export);
        if (copyStrip === null) {
            exportBtn.setAttribute('disabled', '');
            actions.appendChild(exportBtn);
            nodes.push(actions);
            return nodes;
        }
        const copyBtn = el(doc, 'button', { type: 'button', id: 'copy-recipe' }, PAGE.copy);
        const group = exportGroup();
        const showGroup = () => { setHidden(group, !exportOpen); exportBtn.setAttribute('aria-expanded', exportOpen ? 'true' : 'false'); };
        showGroup();
        exportBtn.addEventListener('click', () => { exportOpen = !exportOpen; showGroup(); });
        const status = el(doc, 'span', { role: 'status', class: 'copy-status' }, '');
        copyBtn.addEventListener('click', () => {
            const text = copyText(card, { stripLines: copyStrip, engineLine: engineLine(engineInfo) });
            const clip = clipboard || (typeof navigator !== 'undefined' ? navigator.clipboard : undefined);
            const say = (s) => { status.textContent = s; };
            if (!clip || typeof clip.writeText !== 'function') {
                say(PAGE.copyFailed);
                return;
            }
            try {
                Promise.resolve(clip.writeText(text)).then(() => say(PAGE.copied), () => say(PAGE.copyFailed));
            }
            catch (e) {
                say(PAGE.copyFailed);
            }
        });
        append(actions, [copyBtn, exportBtn, status]);
        nodes.push(actions);
        nodes.push(group);
        nodes.push(el(doc, 'p', { class: 'print-engine' }, engineLine(engineInfo)));
        return nodes;
    }
    function exportGroup() {
        const group = el(doc, 'div', { id: 'export-group', class: 'export-group', role: 'group', 'aria-label': PAGE.export });
        const one = (id, text, run) => {
            const b = el(doc, 'button', { type: 'button', id }, text);
            b.addEventListener('click', run);
            return b;
        };
        const file = (ext, make) => () => {
            const rec = buildExport(lastResult, model, engineInfo, exampleFieldsInUse());
            if (rec === null)
                return;
            doDownload(make(rec), fileName(ext), FILE_TYPES[ext]);
        };
        append(group, [
            one('export-notebook', PAGE.exportNotebook, file('txt', toNotebook)),
            one('export-csv', PAGE.exportCsv, file('csv', toCsv)),
            one('export-json', PAGE.exportJson, file('json', toJson)),
            one('export-print', PAGE.exportPrint, () => { doPrint(); }),
        ]);
        return group;
    }
    function showMessages(result) {
        const all = [];
        const put = (node, text) => { node.textContent = text; if (text !== '')
            all.push(text); };
        put(recipeMsg, result.recipe.reason === null ? '' : result.recipe.reason);
        put(roundingMsg, result.recipe.rounding.message === null ? '' : result.recipe.rounding.message);
        for (let i = 0; i < lineStates.length; i++) {
            const r = result.lines[i].reason;
            put(lineStates[i].msgEl, r === null ? '' : r);
        }
        const ps = result.percentSolution;
        put(percentMsg, ps && ps.reason ? ps.reason : '');
        live.replaceChildren(...all.map((s) => el(doc, 'p', null, s)));
    }
    function renderPercent(ps) {
        const kids = [];
        if (ps && ps.state === 'result') {
            const ul = el(doc, 'ul', { class: 'percent-rows' });
            const li = (s) => ul.appendChild(el(doc, 'li', null, s));
            for (let i = 0; i < ps.rows.length; i++)
                li(ps.rows[i].copy);
            if (ps.makeUp)
                li(ps.makeUp);
            if (ps.caption)
                li(ps.caption);
            for (let i = 0; i < ps.flags.length; i++)
                li(ps.flags[i]);
            for (let i = 0; i < ps.roundingStatements.length; i++)
                li(ps.roundingStatements[i]);
            kids.push(ul);
            kids.push(renderWorking(doc, PAGE.workingPercent, percentWorkingLines(ps)));
        }
        percentResult.replaceChildren(...kids);
    }
    renderAbout(doc, about, engineInfo);
    resetState();
    buildForm();
    changed();
    return { exampleFieldsInUse, loadExample, clear, getModel: () => model };
}
