import { readFileSync, writeFileSync } from 'node:fs';
const parsed = JSON.parse(readFileSync(new URL('../vendor/VENDORED.json', import.meta.url), 'utf8'));
const rec = Object.values(parsed)[0];
for (const k of ['package', 'version', 'source_commit']) {
    if (!rec || typeof rec[k] !== 'string' || rec[k].length === 0) {
        throw new Error('vendor/VENDORED.json: ' + k + ' is not a non-empty string');
    }
}
const obj = {
    package: rec.package,
    version: rec.version,
    e10: rec.modules && typeof rec.modules.E10 === 'string' ? rec.modules.E10 : null,
    commit: rec.source_commit,
};
writeFileSync(new URL('./engine-meta.json', import.meta.url), JSON.stringify(obj, null, 2) + '\n');
