const COLUMNS = ['number', 'component', 'target', 'actual'];
function cell(doc, tag, text) {
    const el = doc.createElement(tag);
    el.textContent = text;
    return el;
}
function noteRow(doc, text, klass) {
    const tr = doc.createElement('tr');
    tr.setAttribute('class', klass);
    const td = cell(doc, 'td', text);
    td.setAttribute('colspan', String(COLUMNS.length));
    tr.appendChild(td);
    return tr;
}
function dataRow(doc, row) {
    const tr = doc.createElement('tr');
    tr.setAttribute('class', row.isMakeUp ? 'row makeup' : 'row');
    for (let i = 0; i < COLUMNS.length; i++) {
        const td = cell(doc, 'td', row.cells[COLUMNS[i]]);
        td.setAttribute('class', COLUMNS[i]);
        if (COLUMNS[i] === 'component' && row.cells.component !== '')
            td.setAttribute('title', row.cells.component);
        tr.appendChild(td);
    }
    return tr;
}
export function renderCard(doc, card) {
    if (card.state === 'empty' || card.state === 'loading') {
        const p = cell(doc, 'p', card.prompt);
        p.setAttribute('class', 'card-' + card.state);
        return p;
    }
    const table = doc.createElement('table');
    table.setAttribute('class', 'card card-' + card.state);
    table.appendChild(cell(doc, 'caption', card.caption));
    const thead = doc.createElement('thead');
    const head = doc.createElement('tr');
    for (let i = 0; i < COLUMNS.length; i++) {
        const th = cell(doc, 'th', card.headers[COLUMNS[i]]);
        th.setAttribute('scope', 'col');
        head.appendChild(th);
    }
    thead.appendChild(head);
    table.appendChild(thead);
    const tbody = doc.createElement('tbody');
    if (card.reason !== null)
        tbody.appendChild(noteRow(doc, card.reason, 'note recipe'));
    for (let i = 0; i < card.rows.length; i++) {
        const row = card.rows[i];
        tbody.appendChild(dataRow(doc, row));
        for (let j = 0; j < row.notes.length; j++)
            tbody.appendChild(noteRow(doc, row.notes[j].text, 'note'));
    }
    if (card.makeUp)
        tbody.appendChild(dataRow(doc, card.makeUp));
    table.appendChild(tbody);
    if (card.roundingStatements.length > 0) {
        const tfoot = doc.createElement('tfoot');
        for (let i = 0; i < card.roundingStatements.length; i++)
            tfoot.appendChild(noteRow(doc, card.roundingStatements[i], 'note rounding'));
        table.appendChild(tfoot);
    }
    return table;
}
