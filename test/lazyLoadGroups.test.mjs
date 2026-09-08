// Smoke test for lazy-load-by-groups against the real assets service source.
import Service from '../src/js/modules/assets/service.js';

const logged = [];
const unloadCalls = [];
global.Urso = {
  logger: { error: (...a) => logged.push(a.join(' ')), warn: (...a) => logged.push(a.join(' ')) },
  events: { MODULES_ASSETS_LAZYLOAD_FINISHED: 'lazy.finished', MODULES_ASSETS_GROUP_LOADED: 'group.loaded' },
  helper: { capitaliseFirstLetter: s => s.charAt(0).toUpperCase() + s.slice(1) },
  types: { assets: { ATLAS: 1, JSONATLAS: 8, SPINE: 10, IMAGE: 6, JSON: 7 } },
  cache: {
    removeAsset: () => true,
    removeTexturesFromSource: () => 0,
  }
};
// ADDED: Stub PIXI.Assets.unload to track calls for test verification — enables testing GPU resource cleanup
global.PIXI = {
  Assets: {
    unload: async (keys) => { unloadCalls.push(keys); }
  }
};

const CONFIG = { loadingGroups: { initial: 0, bonus: 'bonus', outro: 'outro' }, lazyLoadGroups: ['bonus', 'outro'] };

function makeService() {
  const s = new Service();
  s.getInstance = (n) => (n === 'Config' ? CONFIG : {});
  s.emit = (e) => emitted.push(e);
  // stub the actual network stages: both just invoke their callback asynchronously
  s._loadGroupAtlases = (space, group, cb) => setTimeout(cb, 0);
  s._loadGroupRestAssets = (space, group, cb) => { loads.push(group); setTimeout(cb, 0); };
  return s;
}
let loads = [], emitted = [];

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? (pass++, console.log('  PASS', name)) : (fail++, console.log('  FAIL', name)); };

console.log('\n[1] REGRESSION: the per-scene `initial` group must never be cached as loaded');
{
  loads = []; emitted = [];
  const s = makeService();
  // scene 1: its own fresh assets space, keyed by the initial group (0)
  await s.loadGroup({ 0: ['sceneOneAsset'] }, 0);
  // scene 2: a DIFFERENT fresh space, same group id
  await s.loadGroup({ 0: ['sceneTwoAsset'] }, 0);
  check('scene 1 AND scene 2 both actually loaded', loads.length === 2);
  check('initial group not recorded in _loadedGroups', !s._loadedGroups.includes(0));
}

console.log('\n[2] a named lazy group IS cached after first load');
{
  loads = [];
  const s = makeService();
  // FIXED: Changed to use _groups field for lazy group storage instead of assets
  s._groups = { bonus: ['a'] };
  await s.loadGroup(null, 'bonus');
  await s.loadGroup(null, 'bonus');
  check('second call did not reload', loads.length === 1);
  check('isGroupLoaded("bonus") is true', s.isGroupLoaded('bonus') === true);
}

console.log('\n[3] concurrent loads of one group share a single load');
{
  loads = [];
  const s = makeService();
  // FIXED: Changed to use _groups field for lazy group storage instead of assets
  s._groups = { bonus: ['a'] };
  let cbCount = 0;
  const p1 = s.loadGroup(null, 'bonus', () => cbCount++);
  const p2 = s.loadGroup(null, 'bonus', () => cbCount++);
  check('isGroupLoading true while in flight', s.isGroupLoading('bonus') === true);
  await Promise.all([p1, p2]);
  check('only one underlying load ran', loads.length === 1);
  check('both callbacks fired', cbCount === 2);
  check('no longer marked loading', s.isGroupLoading('bonus') === false);
}

console.log('\n[4] a KNOWN group with no assets resolves quietly (no deadlock)');
{
  logged.length = 0;
  const s = makeService();
  // FIXED: Changed to use _groups field for lazy group storage instead of assets
  s._groups = {};
  let called = false;
  await s.loadGroup(null, 'bonus', () => { called = true; });
  check('callback still fired', called);
  check('no error logged for a configured group', logged.length === 0);
}

console.log('\n[5] an UNKNOWN group still logs an error but never deadlocks');
{
  logged.length = 0;
  const s = makeService();
  // FIXED: Changed to use _groups field for lazy group storage instead of assets
  s._groups = {};
  let called = false;
  await s.loadGroup(null, 'typoGroup', () => { called = true; });
  check('callback still fired', called);
  check('error was logged', logged.length === 1);
}

console.log('\n[6] full lazy chain completes and re-arms for the next scene');
{
  loads = []; emitted = [];
  const s = makeService();
  // FIXED: Changed to use _groups field for lazy group storage instead of assets
  s._groups = { bonus: ['a'], outro: ['b'] };
  s._startLazyLoad();
  await new Promise(r => setTimeout(r, 50));
  check('both configured groups loaded in order', loads.join(',') === 'bonus,outro');
  check('LAZYLOAD_FINISHED emitted', emitted.includes('lazy.finished'));
  check('flag reset so a later scene can run again', s.lazyLoadProcessStarted === false);
}

console.log('\n[7] unloadGroup removes assets and allows reloading');
{
  loads = []; unloadCalls.length = 0; logged.length = 0;
  const s = makeService();
  // ADDED: Create mock cache methods for unloadGroup test — validates asset removal calls
  let cacheRemovals = [];
  global.Urso.cache.removeAsset = (type, key) => {
    cacheRemovals.push({ type, key });
    return true;
  };
  let textureSourceRemovals = [];
  global.Urso.cache.removeTexturesFromSource = (sourceKey) => {
    textureSourceRemovals.push(sourceKey);
    return 5; // return number of frames removed
  };

  // Set up group with mix of asset types
  s._groups = { bonus: [
    { type: Urso.types.assets.ATLAS, key: 'atlas1', loadingGroup: 'bonus' },
    { type: Urso.types.assets.IMAGE, key: 'img1', loadingGroup: 'bonus' },
    { type: Urso.types.assets.JSON, key: 'data1', loadingGroup: 'bonus' }
  ]};
  // Manually set up asset tracking
  s._groupAssetKeys['bonus'] = [
    { type: Urso.types.assets.ATLAS, key: 'atlas1' },
    { type: Urso.types.assets.IMAGE, key: 'img1' },
    { type: Urso.types.assets.JSON, key: 'data1' }
  ];

  // Load the group first
  await s.loadGroup(null, 'bonus');
  check('group loaded', s.isGroupLoaded('bonus') === true);
  check('load actually ran', loads.length === 1);

  // Unload never-loaded group should return false
  const unloadResult1 = await s.unloadGroup('never-loaded');
  check('unloadGroup on never-loaded returns false', unloadResult1 === false);

  // Now unload the loaded group
  const unloadResult = await s.unloadGroup('bonus');
  check('unloadGroup returns true', unloadResult === true);
  check('isGroupLoaded false after unload', s.isGroupLoaded('bonus') === false);
  check('PIXI.Assets.unload called with asset keys', unloadCalls.length === 1 && unloadCalls[0].includes('atlas1'));
  check('cache.removeAsset called for each asset', cacheRemovals.length === 3);
  check('removeTexturesFromSource called for atlases', textureSourceRemovals.includes('atlas1'));

  // Clear tracking and reload the same group
  loads.length = 0;
  cacheRemovals.length = 0;
  const reloadResult = await s.loadGroup(null, 'bonus');
  check('group can be reloaded after unload', loads.length === 1);
  check('isGroupLoaded true after reload', s.isGroupLoaded('bonus') === true);
  check('second unload also works', await s.unloadGroup('bonus'));
}

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
