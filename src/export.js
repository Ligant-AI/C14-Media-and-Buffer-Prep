import { buildCard, copyText } from './card.js';
import { stripLines } from './strip.js';
import { engineLine } from './engine-info.js';
import { unitToDisplay } from './scanner.js';
import { CONFIG, TOOL_VERSION } from './config.js';
import { PAGE, LABELS, RULED, TEXTS, CSV_COLUMNS, LINE_KIND_WORDS, ROUTE_WORDS, SA_FORM_WORDS, fill, linePrefix, } from './texts.js';
import { csvCell } from './csv-guard.js';
const str = (x) => (typeof x === 'string' ? x : '');
const unitOf = (x) => unitToDisplay(str(x));
const typed = (label, value, unit) => ({ label, value: str(value), unit: unit === undefined ? '' : unitOf(unit) });
const picked = (label, text) => ({ label, value: str(text), unit: '' });
function saInputs(sa, out) {
    if (!sa || sa.form === '' || sa.form === undefined)
        return;
    out.push(picked(LABELS.saForm.text, SA_FORM_WORDS[sa.form]));
    if (sa.form === 'single')
        out.push(typed(LABELS.saValue.text, sa.single, sa.unit));
    if (sa.form === 'minimum' || sa.form === 'range') {
        out.push(picked(LABELS.saLowerStrictness.text, sa.lowerWord), typed(LABELS.saLower.text, sa.lower, sa.unit));
    }
    if (sa.form === 'maximum' || sa.form === 'range') {
        out.push(picked(LABELS.saUpperStrictness.text, sa.upperWord), typed(LABELS.saUpper.text, sa.upper, sa.unit));
    }
    out.push(typed(LABELS.saLot.text, sa.lot), typed(LABELS.saSource.text, sa.source), typed(LABELS.saDocNumber.text, sa.docNumber));
}
function lineInputs(m, kind, recipe) {
    const out = [typed(PAGE.component, m.name), picked(LABELS.lineKind.text, LINE_KIND_WORDS[kind])];
    if (kind === 1) {
        const own = str(m.sourceVolume) !== '' || str(m.sourceUnit) !== '';
        out.push(typed(LABELS.sourceVolume.text, own ? m.sourceVolume : recipe.sourceVolume, own ? m.sourceUnit : recipe.sourceUnit));
        out.push(typed(LABELS.amount.text, m.amount, m.amountUnit), picked(LABELS.displayUnit.text, unitOf(m.displayUnit)));
    }
    else if (kind === 2) {
        out.push(typed(LABELS.amount.text, m.amount, m.amountUnit));
    }
    else if (kind === 4) {
        out.push(typed(LABELS.instruction.text, m.instruction));
    }
    else if (kind === 3) {
        const r = m.route;
        out.push(picked(LABELS.route.text, ROUTE_WORDS[r] === undefined ? r : ROUTE_WORDS[r]));
        const display = () => out.push(picked(LABELS.displayUnit.text, unitOf(m.displayUnit)));
        if (r === 'a') {
            out.push(typed(LABELS.target.text, m.target, m.targetUnit));
            display();
            saInputs(m.sa, out);
            if (m.sa && m.sa.form !== '')
                out.push(picked(LABELS.saStatementUnit.text, unitOf(m.statementUnit)));
        }
        else if (r === 'b') {
            out.push(typed(LABELS.target.text, m.target, m.targetUnit), typed(LABELS.formulaWeight.text, m.formulaWeight), typed(LABELS.formula.text, m.formula), typed(LABELS.formulaSource.text, m.formulaSource));
            display();
        }
        else if (r === 'c') {
            out.push(typed(LABELS.target.text, m.target, m.targetUnit), typed(LABELS.stock.text, m.stock, m.stockUnit));
            display();
            saInputs(m.sa, out);
            if (m.sa && m.sa.form !== '')
                out.push(picked(LABELS.saStatementUnit.text, unitOf(m.statementUnit)));
        }
        else if (r === 'd') {
            out.push(typed(LABELS.target.text, m.target, m.targetUnit), typed(LABELS.stock.text, m.stock, m.stockUnit));
            display();
        }
        else if (r === 'e') {
            out.push(typed(LABELS.fold.text, m.fold));
            display();
        }
        else if (r === 'f') {
            out.push(typed(LABELS.percent.text, m.percent), picked(LABELS.basis.text, m.basis));
            display();
        }
        else if (r === 'activityMass') {
            out.push(typed(LABELS.target.text, m.target, m.targetUnit));
            display();
            saInputs(m.sa, out);
        }
    }
    return out;
}
function percentInputs(p) {
    const bKey = p.basis === 'w/w' ? 'bMass' : (p.mode === 'added' || p.mode === 'reach') ? 'bAdded' : 'bFinal';
    return [
        picked(LABELS.question.text, TEXTS['MBP-IN-12-' + p.mode] === undefined ? p.mode : TEXTS['MBP-IN-12-' + p.mode]),
        picked(LABELS.basis.text, p.basis), typed(LABELS.percent.text, p.percent), typed(LABELS[bKey].text, p.b, p.bUnit),
        picked(LABELS.displayUnit.text, unitOf(p.displayUnit)), typed(LABELS.baseLiquid.text, p.solvent),
    ];
}
function figureOf(f) {
    if (!f || f.type !== 'figure')
        return { display: '', unit: '', decimal: '', num: '', den: '', isFigure: false };
    return {
        display: f.display, unit: f.unitDisplay, decimal: f.terminates === true ? str(f.decimal) : '',
        num: f.exact ? str(f.exact.num) : '', den: f.exact ? str(f.exact.den) : '', isFigure: true,
    };
}
export function copyStripLines(result, model) {
    const lines = stripLines(result, model);
    return result.sci3Shown === true ? lines.concat([TEXTS['MBP-FL-09']]) : lines;
}
export function buildExport(result, model, engineInfo, exampleFields) {
    if (!result || !model)
        return null;
    const card = buildCard(result);
    if (card.state !== 'result')
        return null;
    const strip = copyStripLines(result, model);
    const eng = engineLine(engineInfo);
    const examples = Array.isArray(exampleFields) ? exampleFields : [];
    const lines = [];
    for (let i = 0; i < result.lines.length; i++) {
        const l = result.lines[i];
        const row = card.rows[i];
        const fig = figureOf(l.target);
        const notes = [];
        for (let j = 0; j < row.notes.length; j++)
            notes.push(row.notes[j].prefixed ? linePrefix(row.ordinal) + row.notes[j].text : row.notes[j].text);
        const rounding = [];
        if (l.target && l.target.statement)
            rounding.push(l.target.statement);
        for (let j = 0; j < l.roundingStatements.length; j++)
            rounding.push(l.roundingStatements[j]);
        lines.push({
            number: String(l.ordinal),
            name: l.name,
            kind: LINE_KIND_WORDS[l.kind],
            inputs: lineInputs(model.lines[i], l.kind, model.recipe),
            target: { display: row.cells.target, unit: fig.unit, unrounded: fig.decimal, exact: fig.isFigure ? { num: fig.num, den: fig.den } : null, isFigure: fig.isFigure },
            actual: l.actual,
            notes,
            statement: l.statement === null || l.statement === undefined ? '' : l.statement,
            roundingStatements: rounding,
        });
    }
    const ps = result.percentSolution;
    let percent = null;
    if (ps && ps.state === 'result' && model.percent) {
        const rows = [];
        for (let i = 0; i < ps.rows.length; i++) {
            const r = ps.rows[i];
            const fig = figureOf(r.figure);
            rows.push({
                label: r.label === null || r.label === undefined ? '' : r.label, shown: r.shown, copy: r.copy,
                target: { display: fig.display, unit: fig.unit, unrounded: fig.decimal, exact: fig.isFigure ? { num: fig.num, den: fig.den } : null, isFigure: fig.isFigure },
            });
        }
        percent = {
            inputs: percentInputs(model.percent), rows, makeUp: ps.makeUp ? ps.makeUp : '', caption: ps.caption ? ps.caption : '',
            flags: ps.flags.slice(), roundingStatements: ps.roundingStatements.slice(),
        };
    }
    return {
        toolName: 'Ligant · ' + CONFIG.toolTitle,
        toolVersion: TOOL_VERSION,
        engineLine: eng,
        engineCommit: engineInfo.commit,
        exampleLine: examples.length > 0 ? fill(PAGE.exampleInUse, { list: examples.join(', ') }) : null,
        copyText: copyText(card, { stripLines: strip, engineLine: eng }),
        recipe: {
            finalVolume: { value: result.recipe.finalVolume.text, unit: result.recipe.finalVolume.unitDisplay },
            baseLiquid: result.recipe.baseLiquid,
            rounding: { rule: result.recipe.rounding.rule, places: result.recipe.rounding.places },
        },
        lines,
        makeUp: result.recipe.makeUp === null ? null : { target: result.recipe.makeUp, actual: result.recipe.makeUpActual },
        strip,
        roundingStatements: card.roundingStatements.slice(),
        percent,
    };
}
const inputText = (x) => x.label + ': ' + x.value + (x.unit === '' ? '' : ' ' + x.unit);
export function toNotebook(rec) {
    const T = '\t';
    const out = [rec.copyText, ''];
    if (rec.exampleLine !== null)
        out.push(rec.exampleLine);
    out.push(rec.toolName, CSV_COLUMNS.toolVersion + ': ' + rec.toolVersion, CSV_COLUMNS.engineCommit + ': ' + rec.engineCommit);
    out.push('', CSV_COLUMNS.typedInputs);
    for (let i = 0; i < rec.lines.length; i++) {
        const l = rec.lines[i];
        for (let j = 0; j < l.inputs.length; j++)
            out.push(RULED['MBP-CD-01-number'] + ' ' + l.number + ': ' + inputText(l.inputs[j]));
    }
    out.push('', CSV_COLUMNS.exactValues);
    out.push([RULED['MBP-CD-01-number'], PAGE.component, TEXTS['MBP-CD-01-target'], CSV_COLUMNS.unit, CSV_COLUMNS.decimal, CSV_COLUMNS.exactNum, CSV_COLUMNS.exactDen].join(T));
    for (let i = 0; i < rec.lines.length; i++) {
        const l = rec.lines[i];
        const e = l.target.exact;
        out.push([l.number, l.name, l.target.display, l.target.unit, l.target.unrounded, e ? e.num : '', e ? e.den : ''].join(T));
    }
    if (rec.percent) {
        const p = rec.percent;
        out.push('', PAGE.headingPercent);
        for (let j = 0; j < p.inputs.length; j++)
            out.push(inputText(p.inputs[j]));
        for (let j = 0; j < p.rows.length; j++) {
            const r = p.rows[j];
            out.push(r.copy);
            if (r.target.exact)
                out.push([r.label, r.target.display, r.target.unit, r.target.unrounded, r.target.exact.num, r.target.exact.den].join(T));
        }
        if (p.makeUp !== '')
            out.push(p.makeUp);
        if (p.caption !== '')
            out.push(p.caption);
        for (let j = 0; j < p.flags.length; j++)
            out.push(p.flags[j]);
        for (let j = 0; j < p.roundingStatements.length; j++)
            out.push(p.roundingStatements[j]);
    }
    return out.join('\n') + '\n';
}
const COLUMNS = Object.freeze([
    { key: 'line', head: RULED['MBP-CD-01-number'] },
    { key: 'component', head: PAGE.component },
    { key: 'kind', head: LABELS.lineKind.text },
    { key: 'target', head: TEXTS['MBP-CD-01-target'] },
    { key: 'unit', head: CSV_COLUMNS.unit },
    { key: 'decimal', head: CSV_COLUMNS.decimal },
    { key: 'exactNum', head: CSV_COLUMNS.exactNum },
    { key: 'exactDen', head: CSV_COLUMNS.exactDen },
    { key: 'actual', head: TEXTS['MBP-CD-01-actual'] },
    { key: 'notes', head: CSV_COLUMNS.notes },
    { key: 'inputs', head: CSV_COLUMNS.inputs },
    { key: 'toolVersion', head: CSV_COLUMNS.toolVersion },
    { key: 'engine', head: CSV_COLUMNS.engine },
    { key: 'engineCommit', head: CSV_COLUMNS.engineCommit },
    { key: 'exampleValues', head: CSV_COLUMNS.exampleValues },
]);
const NUMBER_COLUMNS = Object.freeze(new Set(['target', 'decimal', 'exactNum', 'exactDen']));
function csvRows(rec) {
    const rows = [];
    const base = (fields, isFigure) => ({
        isFigure: isFigure === true,
        cells: Object.assign({
            line: '', component: '', kind: '', target: '', unit: '', decimal: '', exactNum: '', exactDen: '', actual: '', notes: '', inputs: '',
            toolVersion: rec.toolVersion, engine: rec.engineLine, engineCommit: rec.engineCommit,
            exampleValues: rec.exampleLine === null ? '' : rec.exampleLine,
        }, fields),
    });
    for (let i = 0; i < rec.lines.length; i++) {
        const l = rec.lines[i];
        const e = l.target.exact;
        const notes = l.notes.concat(l.roundingStatements);
        rows.push(base({
            line: l.number, component: l.name, kind: l.kind, target: l.target.display, unit: l.target.unit, decimal: l.target.unrounded,
            exactNum: e ? e.num : '', exactDen: e ? e.den : '', actual: l.actual, notes: notes.join('\n'),
            inputs: l.inputs.map(inputText).join('\n'),
        }, l.target.isFigure));
    }
    if (rec.makeUp)
        rows.push(base({ target: rec.makeUp.target, actual: rec.makeUp.actual }, false));
    for (let i = 0; i < rec.strip.length; i++)
        rows.push(base({ notes: rec.strip[i] }, false));
    for (let i = 0; i < rec.roundingStatements.length; i++)
        rows.push(base({ notes: rec.roundingStatements[i] }, false));
    if (rec.percent) {
        const p = rec.percent;
        const inputs = p.inputs.map(inputText).join('\n');
        for (let i = 0; i < p.rows.length; i++) {
            const r = p.rows[i];
            const e = r.target.exact;
            rows.push(base({
                component: PAGE.headingPercent, kind: r.label, target: r.target.display, unit: r.target.unit, decimal: r.target.unrounded,
                exactNum: e ? e.num : '', exactDen: e ? e.den : '', notes: r.copy, inputs: i === 0 ? inputs : '',
            }, r.target.isFigure));
        }
        if (p.makeUp !== '')
            rows.push(base({ component: PAGE.headingPercent, target: p.makeUp }, false));
        const more = [p.caption].concat(p.flags, p.roundingStatements);
        for (let i = 0; i < more.length; i++)
            if (more[i] !== '')
                rows.push(base({ component: PAGE.headingPercent, notes: more[i] }, false));
    }
    return rows;
}
export function toCsv(rec) {
    const out = [csvCell(PAGE.csvLine1), csvCell(PAGE.csvLine2), COLUMNS.map((c) => csvCell(c.head)).join(',')];
    const rows = csvRows(rec);
    for (let i = 0; i < rows.length; i++) {
        out.push(COLUMNS.map((c) => csvCell(rows[i].cells[c.key], NUMBER_COLUMNS.has(c.key) && (c.key !== 'target' || rows[i].isFigure))).join(','));
    }
    return out.join('\r\n') + '\r\n';
}
export const SCHEMA_ID = 'ligant-media-and-buffer-prep-record';
export const SCHEMA_VERSION = 1;
const STRING = Object.freeze({ type: 'string' });
const EXACT = Object.freeze({
    type: 'object', required: ['num', 'den'], additionalProperties: false, properties: Object.freeze({ num: STRING, den: STRING }),
});
const INPUT = Object.freeze({
    type: 'object', required: ['label', 'value', 'unit'], additionalProperties: false,
    properties: Object.freeze({ label: STRING, value: STRING, unit: STRING }),
});
const TARGET = Object.freeze({
    type: 'object', required: ['display', 'unit', 'unrounded', 'exact'], additionalProperties: false,
    properties: Object.freeze({
        display: STRING, unit: STRING, unrounded: STRING, exact: Object.freeze({ anyOf: Object.freeze([EXACT, Object.freeze({ type: 'null' })]) }),
    }),
});
const STRINGS = Object.freeze({ type: 'array', items: STRING });
export const RECORD_SCHEMA = Object.freeze({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Media and buffer prep: recipe record',
    type: 'object',
    required: ['schema', 'schemaVersion', 'tool', 'engine', 'exampleValuesInUse', 'recipe', 'strip', 'lines', 'makeUp', 'roundingStatements', 'percentSolution', 'copyText'],
    additionalProperties: false,
    properties: Object.freeze({
        schema: Object.freeze({ const: SCHEMA_ID }),
        schemaVersion: Object.freeze({ const: SCHEMA_VERSION }),
        tool: Object.freeze({
            type: 'object', required: ['name', 'version'], additionalProperties: false, properties: Object.freeze({ name: STRING, version: STRING }),
        }),
        engine: Object.freeze({
            type: 'object', required: ['line', 'commit'], additionalProperties: false, properties: Object.freeze({ line: STRING, commit: STRING }),
        }),
        exampleValuesInUse: Object.freeze({ type: ['string', 'null'] }),
        recipe: Object.freeze({
            type: 'object', required: ['finalVolume', 'baseLiquid', 'rounding'], additionalProperties: false,
            properties: Object.freeze({
                finalVolume: Object.freeze({ type: 'object', required: ['value', 'unit'], additionalProperties: false, properties: Object.freeze({ value: STRING, unit: STRING }) }),
                baseLiquid: STRING,
                rounding: Object.freeze({ type: 'object', required: ['rule', 'places'], additionalProperties: false, properties: Object.freeze({ rule: STRING, places: STRING }) }),
            }),
        }),
        strip: STRINGS,
        lines: Object.freeze({
            type: 'array',
            items: Object.freeze({
                type: 'object',
                required: ['number', 'name', 'kind', 'inputs', 'target', 'actual', 'notes', 'statement', 'roundingStatements'],
                additionalProperties: false,
                properties: Object.freeze({
                    number: STRING, name: STRING, kind: STRING, inputs: Object.freeze({ type: 'array', items: INPUT }), target: TARGET,
                    actual: STRING, notes: STRINGS, statement: STRING, roundingStatements: STRINGS,
                }),
            }),
        }),
        makeUp: Object.freeze({
            anyOf: Object.freeze([
                Object.freeze({ type: 'object', required: ['target', 'actual'], additionalProperties: false, properties: Object.freeze({ target: STRING, actual: STRING }) }),
                Object.freeze({ type: 'null' }),
            ]),
        }),
        roundingStatements: STRINGS,
        percentSolution: Object.freeze({
            anyOf: Object.freeze([
                Object.freeze({
                    type: 'object', required: ['inputs', 'rows', 'makeUp', 'caption', 'flags', 'roundingStatements'], additionalProperties: false,
                    properties: Object.freeze({
                        inputs: Object.freeze({ type: 'array', items: INPUT }),
                        rows: Object.freeze({
                            type: 'array',
                            items: Object.freeze({
                                type: 'object', required: ['label', 'shown', 'copy', 'target'], additionalProperties: false,
                                properties: Object.freeze({ label: STRING, shown: STRING, copy: STRING, target: TARGET }),
                            }),
                        }),
                        makeUp: STRING, caption: STRING, flags: STRINGS, roundingStatements: STRINGS,
                    }),
                }),
                Object.freeze({ type: 'null' }),
            ]),
        }),
        copyText: STRING,
    }),
});
const jsonTarget = (t) => ({ display: t.display, unit: t.unit, unrounded: t.unrounded, exact: t.exact });
export function jsonBody(rec) {
    return {
        schema: SCHEMA_ID,
        schemaVersion: SCHEMA_VERSION,
        tool: { name: rec.toolName, version: rec.toolVersion },
        engine: { line: rec.engineLine, commit: rec.engineCommit },
        exampleValuesInUse: rec.exampleLine,
        recipe: rec.recipe,
        strip: rec.strip,
        lines: rec.lines.map((l) => ({
            number: l.number, name: l.name, kind: l.kind, inputs: l.inputs, target: jsonTarget(l.target), actual: l.actual,
            notes: l.notes, statement: l.statement, roundingStatements: l.roundingStatements,
        })),
        makeUp: rec.makeUp,
        roundingStatements: rec.roundingStatements,
        percentSolution: rec.percent === null ? null : {
            inputs: rec.percent.inputs,
            rows: rec.percent.rows.map((r) => ({ label: r.label, shown: r.shown, copy: r.copy, target: jsonTarget(r.target) })),
            makeUp: rec.percent.makeUp, caption: rec.percent.caption, flags: rec.percent.flags, roundingStatements: rec.percent.roundingStatements,
        },
        copyText: rec.copyText,
    };
}
export function toJson(rec) {
    return JSON.stringify(jsonBody(rec), null, 2) + '\n';
}
export const FILE_STEM = 'media-and-buffer-prep-recipe';
export const FILE_TYPES = Object.freeze({
    txt: 'text/plain;charset=utf-8',
    csv: 'text/csv;charset=utf-8',
    json: 'application/json;charset=utf-8',
});
export const fileName = (ext) => FILE_STEM + '.' + ext;
export function downloadText(host, doc, text, name, mime, api) {
    const urlApi = api && api.URL ? api.URL : URL;
    const BlobCtor = api && api.Blob ? api.Blob : Blob;
    const url = urlApi.createObjectURL(new BlobCtor([text], { type: mime }));
    const a = doc.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', name);
    host.appendChild(a);
    try {
        a.click();
    }
    finally {
        host.removeChild(a);
        urlApi.revokeObjectURL(url);
    }
}
