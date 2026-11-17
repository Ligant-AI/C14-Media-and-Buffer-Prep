import { unitsOfDimension, unitToDisplay } from './scanner.js';
export function el(doc, tag, attrs, text) {
    const e = doc.createElement(tag);
    if (attrs) {
        const keys = Object.keys(attrs);
        for (let i = 0; i < keys.length; i++)
            e.setAttribute(keys[i], attrs[keys[i]]);
    }
    if (text !== undefined && text !== null)
        e.textContent = text;
    return e;
}
export function append(parent, children) {
    for (let i = 0; i < children.length; i++)
        parent.appendChild(children[i]);
    return parent;
}
export function unitOptions(dims) {
    const out = [];
    for (let d = 0; d < dims.length; d++) {
        const list = unitsOfDimension(dims[d]);
        for (let i = 0; i < list.length; i++)
            out.push({ value: list[i], text: unitToDisplay(list[i]) });
    }
    return out;
}
export function fillOptions(doc, select, options, withEmpty) {
    const kids = [];
    if (withEmpty !== false) {
        const empty = doc.createElement('option');
        empty.setAttribute('value', '');
        empty.value = '';
        empty.textContent = '';
        kids.push(empty);
    }
    for (let i = 0; i < options.length; i++) {
        const o = doc.createElement('option');
        o.setAttribute('value', options[i].value);
        o.value = options[i].value;
        o.textContent = options[i].text;
        kids.push(o);
    }
    select.replaceChildren(...kids);
}
export function setHidden(node, hidden) {
    if (hidden)
        node.setAttribute('hidden', '');
    else
        node.removeAttribute('hidden');
}
