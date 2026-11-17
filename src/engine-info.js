import meta from './engine-meta.json' with { type: 'json' };
import { PAGE, fill } from './texts.js';
const commit = meta.commit;
export const ENGINE_INFO = Object.freeze({
    package: meta.package,
    version: meta.version,
    e10: meta.e10,
    commit,
    commitShort: commit.slice(0, 7),
});
function engineText(template, info) {
    let t = template;
    if (info.e10 === null || info.e10 === undefined)
        t = t.split(' (module E10 {e10})').join('');
    return fill(t, { e10: info.e10, version: info.version, commit: info.commitShort });
}
export function engineLine(info) {
    return engineText(PAGE.engineCopy, info);
}
export function enginePageLine(info) {
    return engineText(PAGE.enginePage, info);
}
