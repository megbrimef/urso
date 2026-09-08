# Urso engine — remaining work

Open items only. Everything fixed on `fix/engine-audit-0.9` has been removed — see `git log a1c85db..HEAD`.

Every item below was re-checked against the current source before being kept. Line numbers are current as of the branch tip; API claims are verified against the installed PixiJS **8.10.2** in `node_modules/pixi.js`.

## Read this before acting on anything here

Three findings in earlier revisions of this file turned out to be **wrong**, each from reading code statically without tracing the whole path. They are recorded in §7 rather than deleted, because in every case the "fix" would have broken working code:

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
6. [Follow-ups created by this branch](#6-follow-ups-created-by-this-branch)
7. [Corrections — do not "fix" these](#7-corrections--do-not-fix-these)
8. [Docs, tests, tooling](#8-docs-tests-tooling)
9. [Suggested order](#9-suggested-order)

---

## 1. Asset and cache layer

### 1.1 Atlas frame keys still collide — `assets/service.js:272, 289`
Frames are keyed by basename, so `icon.png` in two atlases both resolve to `icon`. A **decision was taken** to keep the flat key format (existing templates depend on it) and instead make the collision loud, which is done: it now errors naming the frame and both atlases. The overwrite itself is unchanged, so the last atlas loaded still wins.

The namespacing fix, `addFolderPathInAtlasTextureKey`, is still read from config at `:272` and never applied — the code that would prefix a frame key with its folder path is commented out at `:289`. It cannot simply be uncommented: it references an undefined `folderPath`, calls `addFile` rather than `addTexture`, and iterates a mistyped `imageData.texture`. Implementing it changes the key format for every frame in a subfolder, so it needs the same kind of decision the collision reporting got.

### 1.2 Global atlas rebuild is O(N²) — `lib/cache.js:23-31, 157`
`addAtlas` calls `clearGlobalAtlas()` on every atlas, and the `globalAtlas` getter rebuilds the whole `spine.TextureAtlas` on next access, re-walking every spine skin and attachment via `_getMeshFrameNames()`. Loading N atlases while reading the global atlas between them rebuilds N times. Add a rebuild-once-after-batch flag.

### 1.3 Texture resolution is never applied — `assets/service.js:403`
`//TODO change resolution of base texture`. The `qualityFactors` in `assets/config.js` decide *which file* is fetched but not how it renders, so HD assets draw at the wrong size.

### 1.4 Other pipeline gaps
- `lib/loader.js:157` — the `ATLAS`-sourced-from-`JSONATLAS` branch is still commented out, so such an atlas is skipped entirely.
- `assets/service.js` `_processLoadedAssets` — no longer post-processes `IMAGE` (resolution), `BITMAPFONT` or `FONT`; only `SPINEATLAS` survives. v8's `Assets` handles web fonts and bitmap fonts natively, so verify and delete the dead branches, or reimplement.
- `assets/service.js` `preloadAllImagesInGPU()` — empty body. Implement with v8's `renderer.prepare` (needs `import 'pixi.js/prepare'`) or remove it and its controller passthrough.
- `noAtlasSpine` — eight references across `assets/service.js` and `lib/loader.js`, half-disabled and self-labelled `FIXME remove noAtlasSpine`.

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
`maxResolutionFactor` limits the backing store to `ResolutionsConfig.maxSize()` (default 1920), so a 4K or high-DPI display renders at reduced density to protect fill rate. There is also a commented-out `if (devicePixelRatio > 2) devicePixelRatio = 2` in the `Resolutions` constructor showing the same intent. This is deliberate and correct (see §7), but it is a side effect of whatever `maxSize()` happens to return rather than a documented knob. Surface it as explicit config. Ergonomics, not correctness.

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

## 6. Follow-ups created by this branch

- **`Urso.scenes.getRenderer()` is a breaking change.** It returned the `Application`; it now returns `app.renderer` as its JSDoc always promised, with `getApp()` added for callers that want the Application. Needs a README note and a changelog migration line.
- **`build/js/index.js` is no longer loadable via a plain `<script>` tag.** Externalising `pixi.js`, `gsap`, `howler` and the spine runtime was correct for an npm library (3.2 MB → ~350 KB, no duplicate Pixi), but the output now carries bare imports and needs a resolver. Document the supported consumption path, and decide whether a second self-contained IIFE/UMD build is worth shipping.
- **Production mode silences the host page's `console.log`.** `lib/logger.js:19` does `window.log = console.log = () => {}` when the LOG level is off. That has always been there, but the default level included LOG so it never fired; now that `config.mode === 'production'` defaults to ERROR-only, a production build overwrites the global `console.log` for the whole page, not just the engine. Aggressive for a library — either keep it and document it loudly, or scope the suppression to `window.log`.
- **`_fpsCheckAllowUpdate()` always returns `true`** (verified: no `return false` remains). Removing the duplicate manual gate left it a pure side-effect call — update the FPS counter, set `ticker.maxFPS` — so the `if (!this._fpsCheckAllowUpdate()) return false;` guard in `_loop` is dead. Rename it `_updateFpsLimit()` and drop the guard, or give it a real return contract.
- **The `@urso/revolt-fx` build warning is noise.** See §7; it is benign but misleading enough that someone will try to "fix" it. Either silence it with a Rollup `onwarn` filter in `vite.config.js` matching that specific code and module, or leave a pointer comment. Separately, revolt-fx is the one runtime dependency still bundled rather than externalised — a consistency question, not a bug.

---

## 7. Corrections — do not "fix" these

Recorded because each was reported as a defect in an earlier revision of this file, and acting on any of them would break working code.

### 7.1 `@urso/revolt-fx` is v8-native
Its `package.json` declares `peerDependencies: { "pixi.js": "^8.x" }`, and the `PIXI['BLEND_MODES']` reference at `FX.js:521` is deliberate v8 feature detection:
```js
if (PIXI['BLEND_MODES'] === undefined && typeof value == 'number')
    return this.useBlendModes ? FX._blendModes[value] : 'normal';
```
with `FX._blendModes = ['normal', 'add', 'multiply', 'screen']`. The **absence** of `BLEND_MODES` is how it detects v8, and it then maps a legacy numeric blend mode onto the v8 string form. The `IMPORT_IS_UNDEFINED` line on every build is Rollup correctly reporting the import resolves to undefined — exactly what the code tests for.

### 7.2 The engine is already DPI-correct; `resolution: 1` is right
`scenes/resolutions.js` `_getWindowSize()` multiplies `innerWidth`/`innerHeight` by `devicePixelRatio`, so every resolution figure downstream is in **physical pixels**. `_applyResolutionToPixi` passes those to `renderer.resize()` (the backing store) and sets `canvas.style` to `resolution / devicePixelRatio` (the CSS size). Traced on a 2× display with an 800×600 viewport: a 1600×1200 backing store at 800×600 CSS — an effective density of exactly **2.00×**. That *is* `resolution: devicePixelRatio` + `autoDensity`, hand-rolled. Passing `resolution: 1` to `app.init()` is therefore correct, and enabling Pixi's `autoDensity` would double-apply the scaling.

### 7.3 `refreshStyles` was never 13 ms at 100 objects
An early benchmark reported 13 ms per refresh at 100 objects and 1.4 s at 2000. Those numbers came from the harness's own `findAll` doing a linear scan of the world. The real `Find.do()` resolves the last selector rule through the objects cache, so `findAll` is O(matching). Corrected figures with an index-backed stub: ~2 ms at 100 objects, ~10 ms at 500, ~33 ms at 2000.

---

## 8. Docs, tests, tooling

- **Test coverage is a starting point.** `npm test` runs six Node smoke suites (102 assertions): type selectors, lazy-load groups, the loader's success/error/retry contract, texture-cache keys, asset placeholders, and styles. Uncovered: the template→assets→objects→components pipeline, the instance factory's mode/mixin resolution, and the property proxy. Two real bugs this branch caught late — a call to a non-existent `Urso.events.on`, and a `require()` in an ES module — both lived in paths no test executed. That is the argument for widening coverage, not a general plea for more tests.
- **No linter or formatter.** Indentation is inconsistent (2-space in components, 4-space in modules).
- **`README.bak.md` is still checked in.**
- README needs updating for the §6 behaviour changes, the removed object types, and the assets runtime API (`loadGroup` / `unloadGroup` / `isGroupLoaded` / `isGroupLoading` / `getPlaceholderKey`, the `placeHolder` swap).

---

## 9. Suggested order

1. **§6** — document the breaking changes before this branch goes anywhere. `getRenderer()`, the non-script-tag build, and the `console.log` override all affect consumers and none is discoverable from the code.
2. **§1.1** — atlas frame collisions. Now loud rather than silent, but still last-write-wins; the namespacing fix needs a key-format decision.
3. **§2.1 / §2.2** — culling and render groups, once you can profile a real scene on target hardware. The knobs exist; what is missing is evidence.
4. **§1.2 – §1.4** — the remaining asset-pipeline gaps.
5. **§3.2** — transport, if any game actually uses it; it is currently unreachable through config.
6. **§4** — the correctness questions, starting with the alignment-math `atan` and negative `scaleY`, both of which want a test rather than an opinion.
7. **§8** — widen coverage toward the pipeline and the property proxy, where the two late bugs hid.
