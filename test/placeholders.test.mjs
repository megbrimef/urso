// Covers the asset-placeholder path on the shared object base model.
// This path had NO coverage when it was written, which is how a call to a
// non-existent `Urso.events.on()` passed a fully green test suite.
import BaseModel from '../src/js/modules/objects/baseModel.js';

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? (pass++, console.log('  PASS', name)) : (fail++, console.log('  FAIL', name)); };

const textures = {};
let placeholderMap = {};
const listeners = [];   // records addListener calls
const removed = [];     // records removeListener calls

global.Urso = {
  helper: { recursiveGet: (k, o, d) => (o && o[k] !== undefined ? o[k] : d) },
  logger: { error: () => {}, warn: () => {} },
  cache: { getTexture: (k) => textures[k] },
  assets: { getPlaceholderKey: (k) => placeholderMap[k] || false },
  events: { MODULES_ASSETS_GROUP_LOADED: 'modules.assets.group.loaded' },
  objects: { destroy: () => {} },
};

// The instance factory injects these onto every class prototype at runtime.
// Reproducing that here is the point: it is the API the base model must use.
BaseModel.prototype.addListener = function (e, cb, global) { listeners.push({ e, cb, global }); };
BaseModel.prototype.removeListener = function (e, cb, global) { removed.push({ e, cb, global }); };

const makeModel = (assetKey) => {
  const m = new BaseModel({});
  m._resolved = m._resolveTextureWithPlaceholder(assetKey);
  return m;
};
const reset = () => { listeners.length = 0; removed.length = 0; placeholderMap = {}; for (const k in textures) delete textures[k]; };

console.log('\n[1] resolution order');
{
  reset();
  textures['hero'] = { id: 'real' };
  const m = makeModel('hero');
  check('returns the real texture when it is cached', m._resolved.id === 'real');
  check('does not mark itself as showing a placeholder', m._placeholderAssetKey === false);
}
{
  reset();
  textures['tile'] = { id: 'placeholder' };
  placeholderMap['boss'] = 'tile';
  const m = makeModel('boss');
  check('falls back to the placeholder when the real texture is missing', m._resolved.id === 'placeholder');
  check('records which asset it is standing in for', m._placeholderAssetKey === 'boss');
}
{
  reset();
  const m = makeModel('missing');
  check('returns undefined when neither exists (unchanged behaviour)', m._resolved === undefined);
  check('does not mark itself as showing a placeholder', m._placeholderAssetKey === false);
}

console.log('\n[2] it subscribes only when a placeholder is actually in use');
{
  reset();
  textures['hero'] = { id: 'real' };
  const m = makeModel('hero');
  m._subscribeOnce();
  check('a resolved object adds no listener', listeners.length === 0);
}
{
  reset();
  textures['tile'] = { id: 'placeholder' };
  placeholderMap['boss'] = 'tile';
  const m = makeModel('boss');
  m._subscribeOnce();
  check('a placeholder object adds exactly one listener', listeners.length === 1);
  check('it listens for MODULES_ASSETS_GROUP_LOADED', listeners[0].e === 'modules.assets.group.loaded');
  check('it subscribes globally, so it survives a scene change', listeners[0].global === true);
}

console.log('\n[3] REGRESSION: it uses addListener/removeListener, not Urso.events.on/off');
{
  reset();
  textures['tile'] = { id: 'placeholder' };
  placeholderMap['boss'] = 'tile';
  const m = makeModel('boss');
  // Urso.events is a plain map of name constants with no on/off. If the base model
  // reached for them it would throw here rather than record a listener.
  let threw = false;
  try { m._subscribeOnce(); } catch { threw = true; }
  check('subscribing does not throw', !threw);
  check('the injected addListener was the API used', listeners.length === 1);
}

console.log('\n[4] swap on group load');
{
  reset();
  textures['tile'] = { id: 'placeholder' };
  placeholderMap['boss'] = 'tile';
  const m = makeModel('boss');
  let refreshed = 0;
  m._refreshTexture = () => { refreshed++; };
  m._subscribeOnce();

  // a group lands that still does not carry the asset
  m._onAssetGroupLoaded('unrelated');
  check('does not refresh while the real texture is still absent', refreshed === 0);
  check('stays subscribed for a later group', removed.length === 0);

  // the real texture arrives
  textures['boss'] = { id: 'real' };
  m._onAssetGroupLoaded('bonus');
  check('refreshes once the real texture is present', refreshed === 1);
  check('clears its placeholder marker', m._placeholderAssetKey === false);
  check('unsubscribes after swapping', removed.length === 1);
}

console.log('\n[5] destroy releases a still-pending subscription');
{
  reset();
  textures['tile'] = { id: 'placeholder' };
  placeholderMap['boss'] = 'tile';
  const m = makeModel('boss');
  m._subscribeOnce();
  m._customDestroy();
  check('a never-swapped object removes its listener on destroy', removed.length === 1);
  check('the listener reference is cleared', m._assetGroupLoadedListener === null);
}

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
