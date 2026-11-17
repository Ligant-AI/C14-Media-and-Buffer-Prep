import { TEXTS, RULED } from './texts.js';
import { stateOf } from './states.js';
export function barSpec(result) {
    const st = stateOf(result);
    const spec = {
        state: 'none', sentence: null, caption: null, note: null, finalVolume: null,
        unit: result.bar.unit, segments: [], makeUp: null,
    };
    if (st.empty)
        return spec;
    if (st.recipeRefused) {
        spec.state = 'refused';
        spec.sentence = RULED['MBP-CD-09-refusedFinal'];
        return spec;
    }
    if (st.lineRefused) {
        spec.state = 'refused';
        spec.sentence = TEXTS['MBP-CD-09-refused'];
        return spec;
    }
    if (st.incomplete) {
        spec.state = 'partial';
        spec.sentence = st.lineIncomplete ? TEXTS['MBP-CD-09-partial'] : RULED['MBP-CD-09-recipeIncomplete'];
        return spec;
    }
    if (result.bar.outcome === 'overFull') {
        spec.state = 'overFull';
        spec.sentence = TEXTS['MBP-CD-09-overFull'];
        return spec;
    }
    if (result.bar.outcome === 'notDrawn') {
        spec.state = 'notDrawn';
        spec.sentence = RULED['MBP-CD-09-notDrawn'];
        return spec;
    }
    spec.state = 'drawn';
    const { values } = result.bar;
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        const line = result.lines.find((l) => l.ordinal === v.ordinal);
        spec.segments.push({
            ordinal: v.ordinal,
            label: line.name === '' ? String(v.ordinal) : v.ordinal + ' ' + line.name,
            exact: v.exact,
            unit: v.unit,
            noRectangle: v.exact.num === '0',
        });
    }
    spec.makeUp = { open: true, label: result.recipe.makeUp, noNumber: true, noWidth: result.bar.fill === 'full' };
    spec.caption = TEXTS['MBP-CD-08-caption'];
    spec.finalVolume = result.recipe.finalVolume.asTyped;
    let undrawn = false;
    let amount = false;
    for (let i = 0; i < result.lines.length; i++) {
        const l = result.lines[i];
        if ((l.state === 'result' || l.state === 'statementOnly') && l.kind !== 4 && l.bar === null) {
            undrawn = true;
            if (l.amountOfSubstance === true)
                amount = true;
        }
    }
    if (undrawn)
        spec.note = amount ? RULED['MBP-CD-08-noteAmount'] : TEXTS['MBP-CD-08-note'];
    return spec;
}
