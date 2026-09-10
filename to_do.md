# Urso engine — remaining work

Open items only. Everything fixed on `fix/engine-audit-0.9` has been removed — see `git log a1c85db..HEAD`.

Every item below was re-checked against the current source before being kept. Line numbers are current as of the branch tip; API claims are verified against the installed PixiJS **8.10.2** in `node_modules/pixi.js`.

## Read this before acting on anything here

Three findings in earlier revisions of this file turned out to be **wrong**, each from reading code statically without tracing the whole path. They are recorded in §6 rather than deleted, because in every case the "fix" would have broken working code:

- `@urso/revolt-fx` is **not** a v7-era dependency; its `PIXI.BLEND_MODES` reference is deliberate v8 feature detection.
- The engine is **already DPI-correct**; `resolution: 1` is right and `autoDensity` would double-apply.
- A benchmark that reported `refreshStyles` at 13 ms / 1.4 s was measuring the harness's own linear scan, not the engine.

Treat the un-actioned items below as leads to verify, not as confirmed defects.

**Contents**

1. [Asset and cache layer](#1-asset-and-cache-layer)
2. [Performance](#2-performance)
3. [Unfinished features](#3-unfinished-features)
4. [Correctness and design issues](#4-correctness-and-design-issues)
5. [Configuration and integration](#5-configuration-and-integration)
6. [Corrections — do not "fix" these](#6-corrections--do-not-fix-these)
7. [Docs, tests, tooling](#7-docs-tests-tooling)
8. [Suggested order](#8-suggested-order)

---

## 1. Asset and cache layer

### 1.1 Atlas frame keys collide, and always will
Frames are keyed by basename, so `icon.png` in two atlases both resolve to `icon`. The chosen
resolution was to keep the flat key format and make the collision loud, which is done: LibCache
errors naming the frame and both atlases, and last-write-wins is preserved.

The `addFolderPathInAtlasTextureKey` option that once implied namespacing has been REMOVED rather
than implemented. It could never have run as written (undefined `folderPath`, wrong cache method,
mistyped property), and its two documented meanings contradicted each other — the config comment
said `true` adds a folder path while `models/atlas.js` documented basename-only as the norm. No
default preserved existing behaviour for both bare and path-carrying frame names, so there was no
safe way to make it real without a decision, and the decision was to drop it.

What remains open is only the underlying limitation: two atlases with a same-named frame cannot
both be cached. Anyone hitting the collision error today renames a frame. Genuine namespacing would
mean choosing a key format (folder-prefixed, or atlas-key-prefixed) and migrating every template
that references a frame, which is a deliberate breaking change rather than a bug fix.

### 1.2 Every new atlas invalidates the whole global spine atlas — `lib/cache.js`
CORRECTION to an earlier entry, which called this O(N²). Traced: the only live reader of
`getGlobalAtlas()` is `objects/models/spine.js` when a SPINE object is created (the two other
references are commented out), and `addAtlas` is only called from `lib/loader.js` during loading.
So in the normal flow every atlas loads first and the first spine object then triggers exactly ONE
rebuild — not N.

The real cost appears with lazy loading, which now works: any group carrying an atlas calls
`addAtlas` → `clearGlobalAtlas()`, so the next spine creation rebuilds the entire
`spine.TextureAtlas` from scratch, re-walking every loaded atlas AND every skin and attachment of
every loaded spine via `_getMeshFrameNames()`. That is one full rebuild per lazy group containing
an atlas, mid-game. Bounded, but it lands at exactly the wrong moment.

Worth doing: rebuild incrementally by appending the new atlas's pages rather than discarding
everything, or defer the rebuild to an idle frame. Measure first — the cost scales with total
spine attachment count, which this repo has no fixture for.

### 1.3 Texture resolution is never applied — `assets/service.js:403`
`//TODO change resolution of base texture`. The `qualityFactors` in `assets/config.js` decide *which file* is fetched but not how it renders, so HD assets draw at the wrong size.

### 1.4 The noAtlasSpine path is half-disabled — `assets/service.js`
Eight references, self-labelled `FIXME remove noAtlasSpine`. Spine assets flagged `noAtlas` are
routed into a separate load pass whose metadata handling is commented out. Either finish it or
delete the branch — but it needs a spine fixture to exercise, which this repo does not have.

The other gaps once listed here are closed: the dead `_processLoadedImage` / `_processLoadedFont` /
`_processLoadedBitmapFont` post-processing is deleted, `preloadAllImagesInGPU` is removed, and an
`ATLAS` sourced from a `JSONATLAS` now logs an error naming the asset instead of vanishing.

---

## 2. Performance

The measured hot-path allocations, the Text construction storm and the per-object style refresh are all fixed. What is left needs profiling on target hardware, not static reasoning.

### 2.1 Culling is available but unproven
`CullerPlugin` now registers behind `config.renderer.culling` (default `false`), and `cullable` / `cullArea` / `cullableChildren` are exposed as object properties. Nothing enables them. Culling trades CPU (per-object bounds checks) for GPU savings, so it is a **loss** on a CPU-bound app. Profile a real scene on target hardware before turning it on, and consider `cullableChildren = false` on static UI subtrees so the culler does not recurse.

### 2.2 Render groups and batching are unused
- `objects/config.js:5` — `objectsToCache` is empty, so the object pool is off. Defensible, but nothing documents when to turn it on.
- Nothing calls `enableRenderGroup`. `cacheAsTexture` is now reachable via the `cacheAsBitmap` property but no engine code or template uses it, so static UI panels and complex `Graphics` still re-render every frame.
- The scene graph is built in template order with no type grouping, so an interleaved `IMAGE / GRAPHICS / IMAGE / GRAPHICS` template produces four draw calls where two would do. Worth documenting at minimum.

### 2.3 Per-fire string allocation in the observer — `observer/controller.js:31-32`
```js
this._fireLocal(eventName, params);
this._fireLocal(eventName + this._getLocalSuffix(), params);
```
Every `fire()` concatenates a new string for the scene-scoped dispatch and walks two listener lists. `MODULES_SCENES_UPDATE` fires every frame, so that is at least 60 string allocations a second. Cache the suffixed name per event, or key local listeners by a nested map instead of a concatenated string.

### 2.4 The DPI cap is implicit — `scenes/resolutions.js`
`maxResolutionFactor` limits the backing store to `ResolutionsConfig.maxSize()` (default 1920), so a 4K or high-DPI display renders at reduced density to protect fill rate. There is also a commented-out `if (devicePixelRatio > 2) devicePixelRatio = 2` in the `Resolutions` constructor showing the same intent. This is deliberate and correct (see §6), but it is a side effect of whatever `maxSize()` happens to return rather than a documented knob. Surface it as explicit config. Ergonomics, not correctness.

---

## 3. Unfinished features

### 3.1 Editor component — `components/editor/api.js:9, 79`
`addStyle()` and `editObject(id, key, value)` are empty. `_assetsKeys` is missing `AUDIOSPRITE`, `HTML`, `JSONATLAS`, `SOUND`, `SPINEATLAS`; `_objectsKeys` covers a fraction of the object types. Finish, or mark the component experimental.

### 3.2 Transport is unreachable through config — `modules/transport/*`
- `config.useTransport` is declared in `config/main.js` and documented in README §19.2, but appears **nowhere else in `src/`** (verified: one occurrence total). `Urso.transport.init()` is never called by the engine and nothing tells a game it must call it.
- `transport/controller.js` — `_service` is `null` until `init()`, so every handler setter throws if called first.
- The controller has no `singleton = true`, unlike every other module controller.
- `transport/config.js` — `host` comes only from a `wsHost` URL query param; there is no static config path and an absent param yields `undefined`.
- `transport/service.js` — `// TODO : SET VALIDATION MODELS`; messages are unvalidated.
- `transport/connectionTypes/websocket.js` — reconnect uses a raw `setTimeout` instead of `Urso.setTimeout`, so it ignores `timeScale`.

### 3.3 Smaller unfinished items
- `objects/baseModel.js:61` — `append: false` ("object will not created") is parsed but never checked anywhere.
- `objects/baseModel.js:104` — `addChildAt(childObject, zIndex, …)` ignores `zIndex` and just calls `addChild`. Honour it (`zIndex` + `sortableChildren`) or drop the parameter.
- `objects/models/button.js`, `objects/models/toggle.js` — `pixelPerfectOver` / `pixelPerfectClick` parse into empty `//todo` blocks; both are silently ignored.
- `components/debug/controller.js:8` — `renderStats` and `resolution` debug panels are commented out of the list.
- `components/base/controller.js` — `loadUpdate()` is an empty `//todo` on the base component, yet it is called for every component on every progress tick.
- `scenes/service.js` — `addObject` returns `null` for objects created before assets resolve. Callers cannot distinguish success from "not yet". Now that the deferred path forces its own style refresh, returning a promise would make this coherent.
- `components/deviceRotate/controller.js` — builds a div with classes `fullscreen`, `device-rotate`, `fullscreen-info` and loads `assets/images/fullscreen/rotate.png`. Neither the stylesheet nor the image exists in this repo, so the overlay is invisible unless the game supplies both. Document the contract or ship a minimal injected style.
- `observer/events.js:29-30` — `MODULES_OBJECTS_TEXTINPUT_BLUR` and `..._INPUT` are unreachable now that the `TEXTINPUT` object type is gone. Left in place deliberately in case external code references them; remove on the next breaking release.

### 3.4 Replace `@urso/revolt-fx` with `@pixi/particle-emitter`
**This is a dependency choice, not a bug fix.** `@urso/revolt-fx` is not broken — see §6.1, it is
v8-native and its build warning is benign. The case for moving is maintenance and ecosystem: the
particle system is currently a single-maintainer fork pinned at `0.2.0`, whose authoring tool is a
third-party site (`editor.revoltfx.electronauts.net`), whereas `@pixi/particle-emitter` is the
mainstream PixiJS particle library. Note `@pixi/particle-emitter` is a *supplemental* package, not
one of the deprecated v7 `@pixi/*` core sub-packages, so the scope name is not itself a red flag.

**Verify this FIRST — it gates everything else.** Confirm which release of
`@pixi/particle-emitter` actually supports PixiJS v8 and whether it is current. I have not verified
this and it is the whole premise of the task: the 5.x line targeted Pixi v7, and v8 support was an
open question for some time. If there is no v8-capable release, this item is dead and revolt-fx
should simply stay.

**Code surface is small.** Exactly one file imports it — `objects/models/emitterFx.js:2` — and it
uses a narrow API:
```js
this._bundle = new particlesFx.FX();
this._bundle.initBundle(fx_settings_data);
this._emitter = this._bundle.getParticleEmitter(emitterName);
this._emitter.init(this._baseObject, true, 1);
this._emitter.start();  this._emitter.stop(false);
this._emitter.on.completed.add(cb);
this._bundle.update();          // driven from MODULES_SCENES_UPDATE
```
The revolt-fx side of that list is verified against the source in this repo. The
`@pixi/particle-emitter` side below is from its documented API and is **not** verified here —
confirm it alongside the version check above, do not take it as given: it has no bundle concept,
you construct an `Emitter(container, config)` directly and drive it with
`emitter.update(deltaSeconds)`. If that holds, the model's `_createBundle` / `_bundle` layer
disappears rather than being ported, and `update()` must pass elapsed **seconds** where the
current code passes nothing at all.

**The real cost is the config format, not the code.** revolt-fx bundles are authored in its own
editor and carry emitter definitions plus a texture/spritesheet mapping; `@pixi/particle-emitter`
uses a completely different JSON schema authored at `pixijs.io/particle-emitter/editor/`. Any game
with existing effects has those bundles as data files. Decide up front whether to write a converter
or re-author the effects, and expect that to dominate the work.

**Also affects the public template surface.** The `EMITTERFX` object type takes `cfg`,
`spritesheetFilter` and `autostart` (`emitterFx.js` `setupParams`), and `spritesheetFilter` exists
specifically to resolve revolt-fx's `mc_commonPart_01` movieclip naming convention out of
`Urso.cache`. That convention has no equivalent in `@pixi/particle-emitter`, so either the
parameter goes or it needs redefining — a breaking change for templates either way. Consider
whether the type should be renamed (it is `EMITTERFX` after the fx library) and note that
`EMITTER: 10` was removed as a phantom type, so that numeric slot is free but deliberately unreused.

Doing this would also close the loose end in §6: revolt-fx is the one runtime dependency still
bundled rather than externalised.


---

## 4. Correctness and design issues

- `objects/propertyAdapter.js:269` — `Math.atan(xCatet / yCatet)` carries `//todo or yCatet/xCatet ?`. An unresolved question in the alignment math; worth a test rather than a comment.
- `objects/propertyAdapter.js:307` — `// TODO: CHECK SCALE CAN BE NEGATIVE`; negative `scaleY` is rejected, which breaks flipped sprites.
- `objects/styles.js:34` — style resolution ignores the parent (`//todo consider parent`), so the CSS-like inheritance the docs imply is not implemented.
- `objects/styles.js:6-7` — the `Styles` singleton constructs a real `Models.Text` (and so a `PIXI.Text`) at startup purely to read defaults, and holds it forever.
- `lib/tween.js` — completed tweens are reclaimed, but a tween that never completes (looping, or started and abandoned) is never freed, and `_update` iterates the map with `for...in` every frame.
- `scenes/resolutions.js:13` — `//TODO optimization (performance)` on the resize path.
- Orientation helpers (`_isPortrait`, `_showOnLandscape`, `_showOnPortrait`) are duplicated across `fullscreen/controller.js`, `fullscreen/ios.js`, `fullscreen/android.js` and `deviceRotate/controller.js`, and read from two different sources — one uses `ResolutionsConfig.contents`, another `ResolutionsConfig._orientations`, a private field accessed from outside the class. Consolidate.

---

## 5. Configuration and integration

- **`init()` ordering** — `_root` and `_createWorld()` run at `pixiWrapper.js:38` but `app.init()` is not awaited until `:79`. It works, but the world is built against a renderer that does not exist yet; moving them after `init()` would make failure modes clearer.
- **Globals** — `extra/main.js` assigns `window.PIXI`, `window.gsap` and `window.UrsoUtils`. Every engine file depends on the `PIXI` global rather than importing, which is why `extra/main.js` must load first; `soundManager/controller.js` reaches for `UrsoUtils.Howler` the same way. Document the load-order contract, or move to real imports.

---

## 6. Corrections — do not "fix" these

Recorded because each was reported as a defect in an earlier revision of this file, and acting on any of them would break working code.

### 6.1 `@urso/revolt-fx` is v8-native
Its `package.json` declares `peerDependencies: { "pixi.js": "^8.x" }`, and the `PIXI['BLEND_MODES']` reference at `FX.js:521` is deliberate v8 feature detection:
```js
if (PIXI['BLEND_MODES'] === undefined && typeof value == 'number')
    return this.useBlendModes ? FX._blendModes[value] : 'normal';
```
with `FX._blendModes = ['normal', 'add', 'multiply', 'screen']`. The **absence** of `BLEND_MODES` is how it detects v8, and it then maps a legacy numeric blend mode onto the v8 string form. The `IMPORT_IS_UNDEFINED` line on every build is Rollup correctly reporting the import resolves to undefined — exactly what the code tests for.

### 6.2 The engine is already DPI-correct; `resolution: 1` is right
`scenes/resolutions.js` `_getWindowSize()` multiplies `innerWidth`/`innerHeight` by `devicePixelRatio`, so every resolution figure downstream is in **physical pixels**. `_applyResolutionToPixi` passes those to `renderer.resize()` (the backing store) and sets `canvas.style` to `resolution / devicePixelRatio` (the CSS size). Traced on a 2× display with an 800×600 viewport: a 1600×1200 backing store at 800×600 CSS — an effective density of exactly **2.00×**. That *is* `resolution: devicePixelRatio` + `autoDensity`, hand-rolled. Passing `resolution: 1` to `app.init()` is therefore correct, and enabling Pixi's `autoDensity` would double-apply the scaling.

### 6.3 `refreshStyles` was never 13 ms at 100 objects
An early benchmark reported 13 ms per refresh at 100 objects and 1.4 s at 2000. Those numbers came from the harness's own `findAll` doing a linear scan of the world. The real `Find.do()` resolves the last selector rule through the objects cache, so `findAll` is O(matching). Corrected figures with an index-backed stub: ~2 ms at 100 objects, ~10 ms at 500, ~33 ms at 2000.

---

## 7. Docs, tests, tooling

- **Test coverage is a starting point.** `npm test` runs six Node smoke suites (102 assertions): type selectors, lazy-load groups, the loader's success/error/retry contract, texture-cache keys, asset placeholders, and styles. Uncovered: the template→assets→objects→components pipeline, the instance factory's mode/mixin resolution, and the property proxy. Two real bugs this branch caught late — a call to a non-existent `Urso.events.on`, and a `require()` in an ES module — both lived in paths no test executed. That is the argument for widening coverage, not a general plea for more tests.
- **No linter or formatter.** Indentation is inconsistent (2-space in components, 4-space in modules).
- **`README.bak.md` is still checked in.**
- README needs updating for the §6 behaviour changes, the removed object types, and the assets runtime API (`loadGroup` / `unloadGroup` / `isGroupLoaded` / `isGroupLoading` / `getPlaceholderKey`, the `placeHolder` swap).

---

## 8. Suggested order

Everything blocking a review or merge is done: the breaking changes are documented in MIGRATION.md,
the build is warning-free, and there are six test suites where there were none.

1. **§2.1 / §2.2** — culling and render groups, once you can profile a real scene on target
   hardware. The knobs exist and default to today's behaviour; what is missing is evidence.
2. **§3.2** — transport, if any game actually uses it. It is currently unreachable through config.
3. **§4** — the correctness questions, starting with the alignment-math `atan` and negative
   `scaleY`. Both want a test rather than an opinion.
4. **§2.3** — the observer's per-fire string allocation; small and self-contained.
5. **§3.4** — replacing revolt-fx, gated on confirming a v8-capable `@pixi/particle-emitter` exists.
6. **§7** — widen coverage toward the template pipeline and the property proxy, where the two late
   bugs this branch caught were both hiding.
7. **§1.2 – §1.4, §3.1, §3.3, §5** — the remainder, none of it urgent. Several need fixtures this
   repo lacks (spine, `bin` assets, a JSONATLAS).
