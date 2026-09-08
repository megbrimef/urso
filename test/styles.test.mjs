// Characterisation tests for ModulesObjectsStyles.
// Written BEFORE optimising refreshStyles, so the optimisation can be shown to
// preserve behaviour rather than assumed to. These assert what the engine does
// today; if a change makes one fail, that is a behaviour change, not a bad test.
import Styles from '../src/js/modules/objects/styles.js';
import Selector from '../src/js/modules/objects/selector.js';
import Types from '../src/js/modules/template/types.js';

let TEMPLATE = { styles: {} };
let WORLD = [];
let CLASS_INDEX = {};

global.Urso = {
  logger: { error: (...a) => { throw new Error('unexpected logger.error: ' + a.join(' ')); } },
  helper: {
    objectFlip: o => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k])),
    stringReplace: (f, r, s) => s.split(f).join(r),
    mergeArrays: (a, b) => [...a, ...b],
    capitaliseFirstLetter: s => s.charAt(0).toUpperCase() + s.slice(1),
  },
  template: { get: () => TEMPLATE },
  objects: { _safeSetValueToTarget: (o, k, v) => { o[k] = v; } },
};
global.Urso.types = new Types().list;

const sel = new Selector();

// The real Find.do() resolves the last selector rule through the objects cache,
// so findAll is O(matching), not O(world). Model that here.
const findAll = (selector) => {
  const cls = selector.startsWith('.') ? selector.slice(1) : null;
  const candidates = cls ? (CLASS_INDEX[cls] || []) : WORLD;
  return candidates.filter(o => sel.testObject(o, selector));
};

Styles.prototype.getInstance = function (name) {
  if (name === 'Selector') return sel;
  if (name === 'Controller') return { findAll, getWorld: () => ({}) };
  // stand-ins for the default-value probes the styles module builds at startup
  if (name === 'BaseModel' || name === 'Models.Text') return { alpha: 1, x: 0, visible: true, fontSize: 12 };
  return {};
};

const DEFAULTS = { alpha: 1, x: 0, visible: true, fontSize: 12 };
const mkObj = (n, cls, original = {}) => ({
  _uid: 'u' + n, name: 'o' + n, class: cls, type: Urso.types.objects.IMAGE,
  _styles: {}, _originalModel: original, ...DEFAULTS,
});
const setWorld = (objs) => {
  WORLD = objs;
  CLASS_INDEX = {};
  for (const o of objs)
    for (const c of String(o.class || '').split(' ').filter(Boolean)) (CLASS_INDEX[c] ||= []).push(o);
};

let pass = 0, fail = 0;
const check = (n, c) => { c ? (pass++, console.log('  PASS', n)) : (fail++, console.log('  FAIL', n)); };

console.log('\n[1] a style reaches its matching objects and only those');
{
  const styles = new Styles();
  const a = mkObj(1, 'red'), b = mkObj(2, 'blue'), c = mkObj(3, 'red');
  setWorld([a, b, c]);
  TEMPLATE = { styles: { '.red': { alpha: 0.5 }, '.blue': { alpha: 0.25 } } };
  styles.refresh({});
  check('applies to every matching object', a.alpha === 0.5 && c.alpha === 0.5);
  check('does not leak across selectors', b.alpha === 0.25);
}

console.log('\n[2] an explicit template value outranks a style');
{
  const styles = new Styles();
  const a = mkObj(1, 'red', { alpha: 0.9 });  // author set alpha in the template
  setWorld([a]);
  TEMPLATE = { styles: { '.red': { alpha: 0.5 } } };
  styles.refresh({});
  check('the style does not overwrite an authored value', a.alpha === 1);
}

console.log('\n[3] a style is reverted when its object stops matching');
{
  const styles = new Styles();
  const a = mkObj(1, 'red');
  setWorld([a]);
  TEMPLATE = { styles: { '.red': { alpha: 0.5 } } };
  styles.refresh({});
  check('style applied first', a.alpha === 0.5);

  a.class = 'green';
  setWorld([a]);
  styles.refresh({});
  check('reverted to the default once it no longer matches', a.alpha === 1);
}

console.log('\n[4] refresh is idempotent');
{
  const styles = new Styles();
  const a = mkObj(1, 'red');
  setWorld([a]);
  TEMPLATE = { styles: { '.red': { alpha: 0.5, x: 40 } } };
  styles.refresh({});
  const after1 = { alpha: a.alpha, x: a.x };
  styles.refresh({});
  styles.refresh({});
  check('repeated refreshes converge on the same result',
        a.alpha === after1.alpha && a.x === after1.x && a.alpha === 0.5 && a.x === 40);
}

console.log('\n[5] batching: one refresh over N objects equals N refreshes');
{
  // This is the property the refreshStyles optimisation depends on. If a batched
  // build (create everything, refresh once) diverges from the current
  // refresh-per-object behaviour, this fails.
  const perObject = new Styles();
  const objsA = [mkObj(1, 'red'), mkObj(2, 'blue'), mkObj(3, 'red')];
  setWorld(objsA);
  TEMPLATE = { styles: { '.red': { alpha: 0.5 }, '.blue': { x: 10 } } };
  for (let i = 0; i < objsA.length; i++) perObject.refresh({});   // today: once per created object

  const batched = new Styles();
  const objsB = [mkObj(1, 'red'), mkObj(2, 'blue'), mkObj(3, 'red')];
  setWorld(objsB);
  batched.refresh({});                                            // batched: once at the end

  const same = objsA.every((o, i) =>
    o.alpha === objsB[i].alpha && o.x === objsB[i].x && o.visible === objsB[i].visible);
  check('batched refresh produces identical state to per-object refresh', same);
}

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
