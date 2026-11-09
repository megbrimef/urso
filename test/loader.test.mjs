// Smoke test for the asset loader's success/error/retry contract, against the real source file.
import Loader from '../src/js/lib/loader.js';

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? (pass++, console.log('  PASS', name)) : (fail++, console.log('  FAIL', name)); };

const timeouts = [];
let resetCalls = 0;
let loadBehaviour = () => ({});
let setDefaultSearchParamsCallCount = 0;
let setDefaultSearchParamsLastArg = null;

global.PIXI = {
  Assets: {
    resolver: {
      hasKey: () => false,
      setDefaultSearchParams: (params) => { setDefaultSearchParamsCallCount++; setDefaultSearchParamsLastArg = params; }
    },
    add: () => {},
    load: async (aliases, onProgress) => { onProgress?.(0.5); return loadBehaviour(aliases); },
    reset: () => { resetCalls++; },
  },
};
global.Urso = {
  logger: { warn: () => {}, error: () => {} },
  config: { appVersion: 0, gamePath: '', useBinPath: false, mode: 'development' },
  types: { assets: { JSON: 7, ATLAS: 1, JSONATLAS: 8, SPINE: 10, IMAGE: 6 } },
  cache: { getJsonAtlases: () => ({}), addJson: () => {}, addTexture: () => {}, addAtlas: () => {} },
  // run scheduled retries synchronously-ish so the test can drive them
  setTimeout: (cb) => { timeouts.push(cb); return { kill: () => {} }; },
};

const flushRetries = async (max = 10) => {
  for (let i = 0; i < max && timeouts.length; i++) { const cb = timeouts.shift(); await cb(); }
};
const makeLoader = () => {
  const l = new Loader();
  l._getLoadPath = (asset) => asset.path;
  l._storeAsset = () => {};
  return l;
};

console.log('\n[1] success path invokes the callback exactly once and resets state');
{
  loadBehaviour = () => ({ a: {} });
  const l = makeLoader();
  let calls = 0;
  l.addAsset({ type: 6, key: 'a', path: 'a.png' });
  await l.start(() => { calls++; });
  check('callback called exactly once', calls === 1);
  check('_isRunning reset to false', l.isRunning() === false);
  check('_assetsQuery emptied', l._assetsQuery.length === 0);
}

console.log('\n[2] REGRESSION: an exception thrown by the callback is not treated as a load failure');
{
  loadBehaviour = () => ({ a: {} });
  timeouts.length = 0;
  const l = makeLoader();
  l.addAsset({ type: 6, key: 'a', path: 'a.png' });
  let threw = false;
  try { await l.start(() => { throw new Error('scene build blew up'); }); } catch { threw = true; }
  check('the callback error propagates to the caller', threw);
  check('no asset reload was scheduled', timeouts.length === 0);
}

console.log('\n[3] REGRESSION: a load failure must not wipe the global Pixi asset cache');
{
  resetCalls = 0; timeouts.length = 0;
  loadBehaviour = () => { throw new Error('404'); };
  const l = makeLoader();
  l.addAsset({ type: 6, key: 'a', path: 'a.png' });
  await l.start(() => {});
  check('PIXI.Assets.reset() was NOT called', resetCalls === 0);
  check('a retry was scheduled', timeouts.length === 1);
  check('_assetsQuery preserved for the retry', l._assetsQuery.length === 1);
}

console.log('\n[4] REGRESSION: retries are capped and then the engine proceeds');
{
  timeouts.length = 0;
  loadBehaviour = () => { throw new Error('404'); };
  const l = makeLoader();
  let calls = 0;
  l.addAsset({ type: 6, key: 'a', path: 'a.png' });
  await l.start(() => { calls++; });
  await flushRetries();
  check(`retried at most MAX_RELOAD_ATTEMPTS (${l.MAX_RELOAD_ATTEMPTS}) times`, l._reloadAttempts === 0);
  check('callback eventually invoked so the game does not hang', calls === 1);
  check('no retry left pending', timeouts.length === 0);
}

console.log('\n[5] progress is reported on the 0-100 scale consumers expect');
{
  loadBehaviour = () => ({ a: {} });
  const l = makeLoader();
  const seen = [];
  l.setOnLoadUpdate(p => seen.push(p.progress));
  l.addAsset({ type: 6, key: 'a', path: 'a.png' });
  await l.start(() => {});
  check('mid-load 0.5 reported as 50', seen.includes(50));
  check('completion reported as 100', seen.includes(100));
}

console.log('\n[6] with appVersion at its default (0), setDefaultSearchParams is never called');
{
  loadBehaviour = () => ({ a: {} });
  setDefaultSearchParamsCallCount = 0;
  setDefaultSearchParamsLastArg = null;
  global.Urso.config.appVersion = 0;
  const l = makeLoader();
  l.addAsset({ type: 6, key: 'a', path: 'a.png' });
  await l.start(() => {});
  check('setDefaultSearchParams not called', setDefaultSearchParamsCallCount === 0);
}

console.log('\n[7] with appVersion set to a truthy value, it is passed through as a search param');
{
  loadBehaviour = () => ({ a: {} });
  setDefaultSearchParamsCallCount = 0;
  setDefaultSearchParamsLastArg = null;
  global.Urso.config.appVersion = '1.2.3';
  const l = makeLoader();
  l.addAsset({ type: 6, key: 'a', path: 'a.png' });
  await l.start(() => {});
  check('setDefaultSearchParams called exactly once', setDefaultSearchParamsCallCount === 1);
  check('called with appVersion as search param', setDefaultSearchParamsLastArg?.appVersion === '1.2.3');

  // This is the reason the applied-once flag is module-level rather than per-instance:
  // Lib.Loader is NOT a singleton, a fresh instance is built for every asset group, and the
  // value lands on the shared PIXI.Assets.resolver. A second group must not re-set it.
  const l2 = makeLoader();
  l2.addAsset({ type: 6, key: 'b', path: 'b.png' });
  await l2.start(() => {});
  check('a second loader instance does not re-apply it', setDefaultSearchParamsCallCount === 1);
}

console.log('\n[8] load paths: gamePath with or without a trailing slash, no doubled slashes');
{
  global.Urso.config.appVersion = 0;
  global.Urso.getInstance = () => ({ getQuality: () => 'high' });
  const l = new Loader();
  const path = (gamePath, useBinPath, asset) => {
    global.Urso.config.gamePath = gamePath;
    global.Urso.config.useBinPath = useBinPath;
    return l._getLoadPath(asset);
  };
  const img = { type: 6, path: 'images/a.png' };
  const atlas = { type: 1, path: 'images/atlas.json' };

  check('assets/: empty gamePath stays relative', path('', false, img) === 'assets/images/a.png');
  check('assets/: gamePath without a slash gets one', path('https://cdn.x/v1', false, img) === 'https://cdn.x/v1/assets/images/a.png');
  check('assets/: gamePath with a slash unchanged', path('https://cdn.x/v1/', false, img) === 'https://cdn.x/v1/assets/images/a.png');
  check('bin/: no double slash after a trailing-slash gamePath', path('https://cdn.x/v1/', true, img) === 'https://cdn.x/v1/bin/images/high/a.png');
  check('bin/: empty gamePath stays root-relative as before', path('', true, img) === '/bin/images/high/a.png');
  check('bin/: atlas without AVIF opt-in has no avif/ folder', path('https://cdn.x/v1', true, atlas) === 'https://cdn.x/v1/bin/images/high/atlas.json');
  check('absolute asset path untouched', path('x/', true, { type: 6, path: 'https://other/a.png' }) === 'https://other/a.png');
}

console.log('\n[9] AVIF atlases are opt-in and asked once');
{
  let tests = 0;
  global.PIXI.detectAvif = { test: async () => { tests++; return true; } };
  global.Urso.config.useBinPath = true;
  global.Urso.config.gamePath = 'g/';
  global.Urso.config.useAvifAtlases = true;
  global.Urso.helper = { parseGetParams: () => ({}) };
  // a fresh module: the AVIF answer is module-level (once per game), and the tests above already settled it
  const { default: FreshLoader } = await import('../src/js/lib/loader.js?avif');
  const l = new FreshLoader();
  check('detected as supported', (await l._detectAvif()) === true);
  await new FreshLoader()._detectAvif();
  check('the detector ran once per game', tests === 1);
  check('atlas goes to avif/', l._getLoadPath({ type: 1, path: 'images/atlas.json' }) === 'g/bin/images/high/avif/atlas.json');
  check('an image does not', l._getLoadPath({ type: 6, path: 'images/a.png' }) === 'g/bin/images/high/a.png');
}

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
