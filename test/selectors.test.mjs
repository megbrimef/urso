// Smoke test for the new type-selector feature + objects cache, run against the real source files.
import Selector from '../src/js/modules/objects/selector.js';
import ObjCache from '../src/js/modules/objects/cache.js';
import Types from '../src/js/modules/template/types.js';

const errors = [];
global.Urso = {
  logger: { error: (...a) => errors.push(a.join(' ')) },
  helper: {
    objectFlip: o => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k])),
    stringReplace: (find, rep, str) => str.split(find).join(rep),
    mergeArrays: (a, b) => [...a, ...b],
    capitaliseFirstLetter: s => s.charAt(0).toUpperCase() + s.slice(1),
  },
};
global.Urso.types = new Types().list;

const sel = new Selector();
const cache = new ObjCache();

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? (pass++, console.log('  PASS', name)) : (fail++, console.log('  FAIL', name)); };

console.log('\n[1] selector parsing');
check("'#id' parses as id",     JSON.stringify(sel.parse('#hero')) === JSON.stringify([[{type:'id',value:'hero'}]]));
check("'^name' parses as name", JSON.stringify(sel.parse('^hero')) === JSON.stringify([[{type:'name',value:'hero'}]]));
check("'.cls' parses as class", JSON.stringify(sel.parse('.hero')) === JSON.stringify([[{type:'class',value:'hero'}]]));
check("bare word parses as type", JSON.stringify(sel.parse('button')) === JSON.stringify([[{type:'type',value:'button'}]]));
check("combined '^box button' parses to 2 parts", (sel.parse('^box button')||[]).length === 2);

console.log('\n[2] type matching against numeric object.type');
const button = { type: Urso.types.objects.BUTTON, _uid: 'u1' };
const text   = { type: Urso.types.objects.TEXT,   _uid: 'u2' };
check("BUTTON object matches 'button'", sel.testObject(button, 'button') === true);
check("TEXT object does NOT match 'button'", sel.testObject(text, 'button') === false);
check("TEXT object matches 'text'", sel.testObject(text, 'text') === true);

console.log('\n[3] objects cache type index');
cache.addType('button', button);
cache.addType('button', { type: Urso.types.objects.BUTTON, _uid: 'u3' });
check("getType returns an array of 2", Array.isArray(cache.getType('button')) && cache.getType('button').length === 2);
cache.removeType('button', button);
check("removeType drops one", cache.getType('button').length === 1);
cache.removeType('button', { _uid: 'u3' });
check("empty bucket is deleted", cache.getType('button') === false);
check("unknown type returns false", cache.getType('nope') === false);

console.log('\n[4] find.do() array-wrapping guard (the double-wrap bug)');
// Reproduce the exact guard from find.js for a 'type' rule.
const wrap = (ruleType, objs) => (ruleType !== 'class' && ruleType !== 'type' && objs) ? [objs] : objs;
cache.addType('button', button);
const got = wrap('type', cache.getType('button'));
check("type results are NOT double-wrapped", Array.isArray(got) && got[0] === button);

console.log('\n[5] malformed selector fails cleanly (no throw, no false pushed)');
let threw = false, res;
try { res = sel.parse('!!!'); } catch (e) { threw = true; }
check("parse('!!!') does not throw", !threw);
check("parse('!!!') returns false", res === false);

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
