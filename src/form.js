import { el, fillOptions } from './dom.js';
import { PAGE } from './texts.js';
export function makeControl(ctx, spec) {
    const doc = ctx.doc;
    const id = ctx.nextId(spec.idBase || 'f');
    const wrap = el(doc, 'div', { class: 'field' });
    const labelEl = el(doc, 'label', { for: id }, spec.label);
    let control;
    if (spec.type === 'select') {
        control = el(doc, 'select', { id });
        fillOptions(doc, control, spec.options, spec.noEmpty ? false : true);
    }
    else {
        control = el(doc, 'input', { id, type: 'text', autocomplete: 'off' });
        if (spec.inputmode)
            control.setAttribute('inputmode', spec.inputmode);
    }
    control.value = spec.value;
    if (spec.ariaLabel)
        control.setAttribute('aria-label', spec.ariaLabel);
    const markEl = el(doc, 'span', { class: 'example-mark' }, '');
    wrap.appendChild(labelEl);
    wrap.appendChild(control);
    wrap.appendChild(markEl);
    const ids = [];
    let whyEl = null;
    if (spec.why) {
        whyEl = el(doc, 'p', { class: 'why', id: id + '-why' }, spec.why);
        wrap.appendChild(whyEl);
        ids.push(id + '-why');
    }
    const extra = spec.describedBy || [];
    for (let i = 0; i < extra.length; i++)
        ids.push(extra[i]);
    if (ids.length > 0)
        control.setAttribute('aria-describedby', ids.join(' '));
    const handler = () => { spec.onValue(control.value); };
    control.addEventListener('input', handler);
    control.addEventListener('change', handler);
    const field = {
        id, wrap, control, labelEl, markEl, whyEl,
        refreshMark() { markEl.textContent = spec.isExample && spec.isExample() ? PAGE.exampleMark : ''; },
        setOptions(options, value) {
            fillOptions(doc, control, options, spec.noEmpty ? false : true);
            control.value = value;
        },
    };
    field.refreshMark();
    return field;
}
export function wordOptions(words) {
    const keys = Object.keys(words);
    const out = [];
    for (let i = 0; i < keys.length; i++)
        out.push({ value: keys[i], text: words[keys[i]] });
    return out;
}
