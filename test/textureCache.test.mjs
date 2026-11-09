// Test for texture cache collision detection and frame source tracking.
import LibCache from '../src/js/lib/cache.js';

const errors = [];
const warnings = [];

global.Urso = {
  logger: {
    error: (...args) => errors.push(args.join(' ')),
    warn: (...args) => warnings.push(args.join(' ')),
  },
};

const cache = new LibCache();

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? (pass++, console.log('  PASS', name)) : (fail++, console.log('  FAIL', name)); };

console.log('\n[1] extension stripping behavior');
const testData = { test: 'data' };

cache.addTexture('hero.png', testData);
check("'hero.png' strips to 'hero'", cache.getTexture('hero') === testData);
check("'hero.png' original key does not exist", cache.getTexture('hero.png') === undefined);

cache.assetsList.texture = {}; // reset
cache._textureSources = {};
cache.addTexture('ui.button.normal', testData);
check("'ui.button.normal' does NOT strip (no extension)", cache.getTexture('ui.button.normal') === testData);
check("'ui.button.normal' stripped key does not exist", cache.getTexture('ui.button') === undefined);

cache.assetsList.texture = {}; // reset
cache._textureSources = {};
cache.addTexture('ui.button.normal.png', testData);
check("'ui.button.normal.png' strips to 'ui.button.normal'", cache.getTexture('ui.button.normal') === testData);

cache.assetsList.texture = {}; // reset
cache._textureSources = {};
cache.addTexture('hero.PNG', testData);
check("'hero.PNG' (uppercase) strips to 'hero' (case-insensitive)", cache.getTexture('hero') === testData);

cache.assetsList.texture = {}; // reset
cache._textureSources = {};
cache.addTexture('hero', testData);
check("'hero' (no extension) stays as 'hero'", cache.getTexture('hero') === testData);

cache.assetsList.texture = {}; // reset
cache._textureSources = {};
cache.addTexture('folder.name/hero.png', testData);
check("'folder.name/hero.png' strips extension but keeps path", cache.getTexture('folder.name/hero') === testData);

console.log('\n[2] non-colliding registrations log no error');
errors.length = 0;
warnings.length = 0;
cache.assetsList.texture = {}; // reset
cache._textureSources = {};

cache.addTexture('icon', { a: 1 }, 'atlas1');
cache.addTexture('button', { b: 2 }, 'atlas1');
cache.addTexture('icon', { c: 3 }, 'atlas2');
// Note: the last registration collides with the first, so we expect 1 error from this block
const nonCollidingErrors = errors.filter(e => e.includes('collision')).length;
check("only the 'icon' collision generates an error", nonCollidingErrors === 1);

console.log('\n[3] registering the same key twice logs an error');
errors.length = 0;
cache.assetsList.texture = {}; // reset
cache._textureSources = {};

cache.addTexture('background.png', { x: 1 }, 'atlas_a');
const errorsBefore = errors.length;
cache.addTexture('background.png', { x: 2 }, 'atlas_b');
const errorsAfter = errors.length;
check("collision generates exactly 1 error", errorsAfter - errorsBefore === 1);

console.log('\n[4] collision error message contains key, original source, and new source');
errors.length = 0;
cache.assetsList.texture = {}; // reset
cache._textureSources = {};

cache.addTexture('wood.png', { frame: 1 }, 'terrain_atlas');
cache.addTexture('wood.png', { frame: 2 }, 'nature_atlas');

const collisionError = errors[errors.length - 1] || '';
check("error message contains the colliding key 'wood'", collisionError.includes('wood'));
check("error message mentions 'terrain_atlas'", collisionError.includes('terrain_atlas'));
check("error message mentions 'nature_atlas'", collisionError.includes('nature_atlas'));

console.log('\n[5] last-write-wins is preserved');
errors.length = 0;
cache.assetsList.texture = {}; // reset
cache._textureSources = {};

const firstValue = { source: 'first' };
const secondValue = { source: 'second' };

cache.addTexture('sprite.png', firstValue, 'atlas1');
const afterFirst = cache.getTexture('sprite');
cache.addTexture('sprite.png', secondValue, 'atlas2');
const afterSecond = cache.getTexture('sprite');

check("after first registration, cache returns first value", afterFirst === firstValue);
check("after second registration (collision), cache returns second value", afterSecond === secondValue);

// NOTE: the normalisation asserted in [1] is shared with _createGlobalAtlas, which names the
// spine atlas regions. They used to be two separate copies and drifted apart: addTexture was
// corrected to strip only real image extensions while _createGlobalAtlas still stripped the last
// dot-segment of any name, so `ui.button.normal` became `ui.button` as a spine region but stayed
// intact as a texture key, and spine attachments on such frames could not resolve. Both now call
// one helper. If [1] is ever changed, the spine region names change with it.

console.log('\n[6] re-registering from the SAME atlas is not a collision');
errors.length = 0;
cache.assetsList.texture = {}; // reset
cache._textureSources = {};

// An atlas can legitimately be processed twice — a loader retry, or a scene re-display
// re-running _processLoadedAtlases over an already-cached atlas. That must stay silent.
cache.addTexture('icon.png', { v: 1 }, 'ui_atlas');
cache.addTexture('icon.png', { v: 2 }, 'ui_atlas');
check('same-source re-registration logs no error', errors.length === 0);
check('same-source re-registration still overwrites', cache.getTexture('icon').v === 2);

// but a genuinely different atlas still reports
cache.addTexture('icon.png', { v: 3 }, 'game_atlas');
check('a different atlas still reports the collision', errors.length === 1);

console.log('\n[hires] meta.hires frames get half-size orig/trim');
{
  global.PIXI = {
    Rectangle: class { constructor(x, y, width, height) { Object.assign(this, { x, y, width, height }); } },
    Texture: class { constructor(o) { Object.assign(this, o); } },
  };
  const t = (w) => ({ source: 's', frame: { w }, orig: { x: 0, y: 0, width: w, height: w }, trim: null, label: 'l' });
  const sheet = { data: { meta: { hires: ['big'] } }, textures: { 'big.png': t(200), 'small.png': t(100) } };
  const small = sheet.textures['small.png'];
  cache._applyHiresFrames(sheet);
  check('hires frame orig halved', sheet.textures['big.png'].orig.width === 100);
  check('hires frame keeps its source frame', sheet.textures['big.png'].frame.w === 200);
  check('other frames untouched', sheet.textures['small.png'] === small);
  const plain = { data: { meta: {} }, textures: { 'a.png': t(10) } };
  const before = plain.textures['a.png'];
  cache._applyHiresFrames(plain);
  check('atlas without meta.hires untouched', plain.textures['a.png'] === before);
}

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
