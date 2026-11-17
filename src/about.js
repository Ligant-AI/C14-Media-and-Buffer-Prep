import { ABOUT } from './texts.js';
import { enginePageLine } from './engine-info.js';
import { el } from './dom.js';
function list(doc, tag, items) {
    const l = el(doc, tag, null);
    for (let i = 0; i < items.length; i++)
        l.appendChild(el(doc, 'li', null, items[i]));
    return l;
}
export function renderAbout(doc, parent, engineInfo) {
    const H = ABOUT.headings;
    const kids = [
        el(doc, 'h3', null, H[0]),
        el(doc, 'p', null, ABOUT.whatItDoes),
        el(doc, 'h3', null, H[1]),
        list(doc, 'ol', ABOUT.howToUseSteps),
        el(doc, 'p', null, ABOUT.howToUseAfter),
        el(doc, 'h3', null, H[2]),
        el(doc, 'p', null, ABOUT.howItWorksIntro),
        list(doc, 'ul', ABOUT.howItWorksRelations),
        el(doc, 'p', null, ABOUT.howItWorksConstants),
        el(doc, 'p', null, ABOUT.howItWorksRounding),
        el(doc, 'p', null, enginePageLine(engineInfo)),
        el(doc, 'h3', null, H[3]),
        el(doc, 'p', null, ABOUT.whyNot),
        el(doc, 'h3', null, H[4]),
        list(doc, 'ul', ABOUT.notDo),
    ];
    for (let i = 0; i < kids.length; i++)
        parent.appendChild(kids[i]);
}
