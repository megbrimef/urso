// Smoke test for the asset loader's success/error/retry contract, against the real source file.
import Loader from '../src/js/lib/loader.js';

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? (pass++, console.log('  PASS', name)) : (fail++, console.log('  FAIL', name)); };

const timeouts = [];
let resetCalls = 0;
let loadBehaviour = () => ({});

global.PIXI = {
  Assets: {
    resolver: { hasKey: () => false },
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

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
