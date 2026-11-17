import { TEXTS, RULED, linePrefix } from './texts.js';
import { stateOf } from './states.js';
function targetCell(l) {
    if (l.noAmount)
        return l.noAmountText;
    if (l.state !== 'result')
        return '';
    return l.target.display;
}
function notesOf(l) {
    const notes = [];
    const add = (text, prefixed) => { notes.push({ text, prefixed: prefixed === true }); };
    const showsResult = l.state === 'result' || l.state === 'statementOnly';
    if (showsResult && l.kindWords)
        add(l.kindWords);
    if (l.state === 'result' && l.phrase)
        add(l.phrase);
    if (l.state === 'result' && l.note)
        add(l.note);
    if (l.noAmount && (l.state === 'statementOnly' || l.state === 'incomplete'))
        add(TEXTS['MBP-FL-04-route']);
    if (showsResult && l.statement)
        add(l.statement);
    if (showsResult) {
        for (let i = 0; i < l.flags.length; i++)
            add(l.flags[i], l.flags[i] === TEXTS['MBP-FL-10']);
    }
    if (!showsResult && l.reason)
        add(l.reason);
    return notes;
}
function roundingStatementsOf(lines) {
    const out = [];
    for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (l.state !== 'result' && l.state !== 'statementOnly')
            continue;
        if (l.target && l.target.statement)
            out.push(linePrefix(l.ordinal) + l.target.statement);
        for (let j = 0; j < l.roundingStatements.length; j++)
            out.push(linePrefix(l.ordinal) + l.roundingStatements[j]);
    }
    return out;
}
const headers = () => ({
    number: RULED['MBP-CD-01-number'],
    component: TEXTS['MBP-CD-01-component'],
    target: TEXTS['MBP-CD-01-target'],
    actual: TEXTS['MBP-CD-01-actual'],
});
export function loadingCard() {
    return { state: 'loading', prompt: RULED['MBP-CD-12-loading'], caption: null, headers: null, reason: null, rows: [], makeUp: null, roundingStatements: [] };
}
export function buildCard(result) {
    const st = stateOf(result);
    if (st.empty) {
        return { state: 'empty', prompt: RULED['MBP-CD-12-empty'], caption: null, headers: null, reason: null, rows: [], makeUp: null, roundingStatements: [] };
    }
    let state = 'result';
    if (st.lineRefused || st.recipeRefused)
        state = 'refused';
    else if (st.incomplete)
        state = 'partial';
    const rows = [];
    for (let i = 0; i < result.lines.length; i++) {
        const l = result.lines[i];
        rows.push({
            ordinal: l.ordinal,
            lineState: l.state,
            isMakeUp: false,
            cells: { number: String(l.ordinal), component: l.name, target: targetCell(l), actual: l.actual },
            notes: notesOf(l),
        });
    }
    const makeUp = result.recipe.makeUp === null ? null : {
        ordinal: null,
        lineState: 'result',
        isMakeUp: true,
        cells: { number: '', component: '', target: result.recipe.makeUp, actual: result.recipe.makeUpActual },
        notes: [],
    };
    return {
        state,
        prompt: null,
        caption: RULED['MBP-CD-17-caption'],
        headers: headers(),
        reason: result.recipe.reason,
        rows,
        makeUp,
        roundingStatements: roundingStatementsOf(result.lines),
    };
}
export function rowLine(row) {
    const sep = RULED['MBP-CD-14-separator'];
    const c = row.cells;
    return c.number + sep + c.component + sep + c.target + sep + c.actual;
}
export function copyText(card, extras) {
    if (card.state !== 'result')
        return null;
    const out = [];
    for (let i = 0; i < card.rows.length; i++) {
        const row = card.rows[i];
        out.push(rowLine(row));
        for (let j = 0; j < row.notes.length; j++) {
            const n = row.notes[j];
            out.push(n.prefixed ? linePrefix(row.ordinal) + n.text : n.text);
        }
    }
    if (extras && extras.stripLines)
        for (let i = 0; i < extras.stripLines.length; i++)
            out.push(extras.stripLines[i]);
    for (let i = 0; i < card.roundingStatements.length; i++)
        out.push(card.roundingStatements[i]);
    if (extras && extras.engineLine)
        out.push(extras.engineLine);
    if (card.makeUp)
        out.push(rowLine(card.makeUp));
    return out.join('\n');
}
