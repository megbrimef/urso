# Urso engine — remaining work

Open items only. Everything fixed on `fix/engine-audit-0.9` has been removed — see `git log a1c85db..HEAD` for what was done and why.

Already shipped and therefore absent from this list: the v8 migration of the object models, the dead public API in the Pixi wrapper, the lazy-load group state machine, bare type selectors, the asset-loader progress/error/retry path, the object-property hot-path allocations, the Text construction storm, texture-key mangling, and the Core config decoupling.

Line numbers are current as of the tip of that branch. API claims verified against the installed PixiJS **8.10.2** in `node_modules/pixi.js`.

**Contents**

1. [Lazy load by groups — remaining pieces](#1-lazy-load-by-groups--remaining-pieces)
2. [Asset and cache layer](#2-asset-and-cache-layer)
3. [Performance](#3-performance)
4. [Remaining PixiJS v8 debt](#4-remaining-pixijs-v8-debt)
5. [Unfinished features](#5-unfinished-features)
6. [Correctness and design issues](#6-correctness-and-design-issues)
7. [Configuration and integration](#7-configuration-and-integration)
8. [Follow-ups created by this branch](#8-follow-ups-created-by-this-branch)
9. [Docs, tests, tooling](#9-docs-tests-tooling)
10. [Suggested order](#10-suggested-order)

---

## 1. Lazy load by groups — remaining pieces

The core mechanism works now: per-scene passes, no deadlocks on unregistered groups, `isGroupLoaded`/`isGroupLoading`, and a promise API alongside the callbacks. Four things are still missing.

### 1.1 `this.assets` mixes two incompatible shapes and leaks — `assets/service.js:48, 177`
`_createNewAssetsSpace()` stores a per-preload space at a numeric key:
```js
this.assets[this._loadCounter] = {};   // { 0: [ ...initial models... ] }
```
while `_addAsset` stores lazy groups as flat arrays at string keys:
```js
this.assets[model.loadingGroup].push(model);   // [ ...models... ]
```
So `this.assets` is simultaneously a map of preload-spaces and a map of group-arrays, told apart only by key type. `_processLoadedAssets` deletes the inner group but leaves the numeric space `{}` behind — one empty object leaked per `preload()` call, forever.

Fix: split into `this._preloadSpaces` and `this._groups`, or drop the numeric spaces entirely and key everything by group name. This is also what removes the `initial: 0` numeric/string ambiguity that `loadGroup` currently has to special-case.

### 1.2 Groups cannot be unloaded
There is no `unloadGroup(name)`. Once loaded, a group's textures stay in `Urso.cache.assetsList` for the process lifetime, and `_addedAssetsCache` (`assets/service.js:10`) permanently records the key so the asset can never be re-registered. A game that lazy-loads a bonus round and returns to base game only grows.

Needs: `Urso.assets.unloadGroup(name)` that calls `PIXI.Assets.unload(...)`, drops the entries from `Urso.cache`, removes the keys from `_addedAssetsCache`, and removes the group from `_loadedGroups` so it can be loaded again.

### 1.3 `placeHolder` is parsed and ignored — `assets/baseModel.js:17`
```js
this.placeHolder = Urso.helper.recursiveGet('placeHolder', params, false); //placeHolder assets model //TODO
```
The whole point of lazy loading is that an object can exist before its texture arrives. Nothing reads this field, so an `IMAGE` whose asset sits in a lazy group still fails at creation with `no image with key` (`objects/models/image.js:27`). Implement it: resolve to the placeholder texture at create time, then swap when `MODULES_ASSETS_GROUP_LOADED` fires for that group.

### 1.4 No worked example — `src/app/`
`assets/config.js` documents the contract now, but `src/app/` still contains only `config/load.js` and `templates/scenes/play.js`. Add a commented `src/app/modules/assets/config.js` stub plus a scene template that tags an asset with a `loadingGroup`, so the override-through-`extendingChain` path is demonstrated once end to end.

---

## 2. Asset and cache layer

### 2.1 Atlas frame keys still collide — `assets/service.js:268, 284`
`addTexture` no longer mangles keys (only real image extensions are stripped now), but two frames with the same basename in different atlases still overwrite each other — `_setDataToAssetsList` logs a warning and writes anyway. The intended namespacing fix, `addFolderPathInAtlasTextureKey`, is read from config at `:268` and then never applied; the code that would prefix a frame key with its folder path is commented out at `:284`.

Note that the commented code cannot simply be uncommented: it references an undefined `folderPath`, calls `addFile` rather than `addTexture`, and iterates a mistyped `imageData.texture`. Deriving the folder from `assetModel.path` is also a breaking change to key format for existing games, so this needs a decision before implementation.

### 2.2 Global atlas rebuild is O(N²) — `lib/cache.js:23-31, 157`
`addAtlas` calls `clearGlobalAtlas()` on every atlas, and the `globalAtlas` getter rebuilds the entire `spine.TextureAtlas` from scratch on next access, re-walking every spine skin and attachment via `_getMeshFrameNames()`. Loading N atlases while reading the global atlas between them rebuilds N times. Given the recent commit history (`global atlas update`, `fixed uv for spine issue`) this area is already fragile — add a rebuild-once-after-batch flag.

### 2.3 Texture resolution is never applied — `assets/service.js:398`
`//TODO change resolution of base texture`. The `qualityFactors` in `assets/config.js:11-15` decide *which file* is fetched but not how it renders, so HD assets draw at the wrong size.

### 2.4 Other pipeline gaps
- `lib/loader.js:141-145` — the `ATLAS`-sourced-from-`JSONATLAS` branch is commented out, so such an atlas is skipped entirely (the loop `continue`s without queueing it).
- `assets/service.js:299` — `_processLoadedAssets` no longer post-processes `IMAGE` (resolution), `BITMAPFONT` or `FONT`; only `SPINEATLAS` survives. v8's `Assets` handles web fonts and bitmap fonts natively — verify and delete the dead branches, or reimplement.
- `assets/service.js:153` — `preloadAllImagesInGPU()` has an empty body. Implement with v8's `renderer.prepare` (needs `import 'pixi.js/prepare'`) or remove it and its controller passthrough.
- `assets/service.js:225`, `lib/loader.js:151-162` — the `noAtlasSpine` / global-atlas metadata path is half-disabled and self-labelled `FIXME remove noAtlasSpine`.

---

## 3. Performance

The measured hot-path allocations are fixed. What remains is structural: work the engine does per scene build or per frame that no micro-optimisation addresses.

### 3.1 `refreshStyles()` re-runs every style selector on every add/remove/destroy — `objects/service.js:173, 186, 222`, `objects/styles.js:22, 96-97`
`Urso.objects.create()` and every add/remove/destroy call `refreshStyles()` with no argument. That runs `_resetInactualStyles()` (walks the whole style cache, calling `testObject` on each cached object) and then `_apply()` for **every selector in the template**, each of which performs a full `findAll(selector)` search.

Building a scene of N objects with S style selectors is therefore O(N × S) selector searches plus a full cache re-validation per object. `//todo optimization` is already on all three call sites. With the per-access proxy allocations gone, this is now the largest remaining CPU cost on scene build.

Fix: batch the refresh — create the whole tree with `doNotRefreshStylesFlag`, then refresh once — and scope `_apply` to the subtree being added rather than the world. Needs care: narrowing the scope can change which styles end up applied.

### 3.2 Culling is never enabled anywhere
`CullerPlugin` is never registered, and `cullable` / `cullArea` / `cullableChildren` appear nowhere in `src/` (the only hit is inside the disabled `extra/pixiPatch.js`). Every object is submitted to the renderer every frame regardless of whether it is on screen.

Fix: register `CullerPlugin` before `app.init()`, expose `cullable`/`cullArea` as object-model properties through the proxy alias map, and set `cullableChildren = false` on static UI subtrees so the culler does not recurse into them. Profile first — culling trades CPU (per-object bounds checks) for GPU, so it is a loss when the app is CPU-bound.

### 3.3 No render groups, no `cacheAsTexture`, no batching guidance
- `objects/config.js:5` — `objectsToCache` is an empty array, so the object pool is off by default. Defensible, but nothing documents when to turn it on.
- Nothing in the engine ever calls `cacheAsTexture` or `enableRenderGroup`, and the proxy mapping for it was removed (see §8). Static UI panels and complex `Graphics` re-render from scratch every frame.
- `interactiveChildren` is never set to `false` on any container, so hit-testing recurses through every subtree on every pointer event.
- The scene graph is built in template order with no type grouping, so an interleaved `IMAGE / GRAPHICS / IMAGE / GRAPHICS` template produces four draw calls where two would do. Worth a note in the docs at minimum.

### 3.4 Renderer init leaves performance options unset — `scenes/pixiWrapper.js:43-47`
```js
await app.init({ background: "0x222222", resolution: 1 });
```
No `antialias`, `powerPreference`, `preference` (webgl/webgpu), no `gcActive`/`gcMaxUnusedTime`/`gcFrequency`, and no `PrepareSystem` upload before a scene is shown — so the first frame after every scene load hitches while textures upload. See §7 for `resolution: 1`, which is a correctness issue on high-DPI displays as well as a performance knob.

### 3.5 Per-fire string allocation in the observer — `observer/controller.js:31-32`
```js
this._fireLocal(eventName, params);
this._fireLocal(eventName + this._getLocalSuffix(), params);
```
Every `fire()` concatenates a new string for the scene-scoped dispatch and walks two listener lists. `MODULES_SCENES_UPDATE` fires every frame, so this is at least 60 string allocations a second, more with per-frame game events. Cache the suffixed name per event, or key local listeners by a nested map instead of a concatenated string.

---

## 4. Remaining PixiJS v8 debt

### 4.1 `fillCustomColors` is advertised but dead — `extra/pixiPatch.js`, `objects/models/text.js:27`, `objects/proxy.js:53`
`pixiPatch.js` targets v6/v7 internals (`PIXI.Text.prototype.drawLetterSpacing`, `PIXI.Container.prototype.renderAdvanced`, `PIXI.MeshMaterial`), none of which exist in v8. It is correctly disabled at `config/load.js:27` and `:186` — but the per-character text colouring it provided is still parsed, still assigned to the base object, and still mapped in the proxy alias table, so the option is a silent no-op. Either reimplement on v8 (`SplitText`, or per-character `Text` objects) or remove the parameter, its proxy mapping, and its documentation.

### 4.2 `config.appVersion` anticache is dead — `lib/loader.js:129`
`defaultQueryString` is commented out, so the documented anticache mechanism does nothing. v8 equivalent: `Assets.init({ defaultSearchParams: { appVersion } })`.

### 4.3 `@urso/revolt-fx` is a v7-era dependency
It references `PIXI.BLEND_MODES`, which does not exist in v8 — every build prints `IMPORT_IS_UNDEFINED ... FX.js:521`. The `EMITTERFX` object type depends on it. Either upgrade/fork the package for v8 or confirm the affected code path is unreachable. It is also the one runtime dependency still bundled rather than externalised.

---

## 5. Unfinished features

### 5.1 Object types with no model — `modules/template/types.js`
Exported in `Urso.types.objects` and dispatched in `objects/service.js`, but the model classes do not exist. `getInstance` returns `false`, so creation fails with `ModulesObjectsCreate model type error` (`objects/service.js:126`):

| Type | Dispatch | Status |
|---|---|---|
| `ATLASIMAGE` | `objects/service.js:92-94` | case commented out; `Models.AtlasImage` missing |
| `DRAGCONTAINER` | `objects/service.js:98` | `Models.DragContainer` missing |
| `EMITTER` | no case → `default` → `Models.Emitter` | missing; only `EMITTERFX` exists |
| `SCROLLBOX` | no case → `default` → `Models.Scrollbox` | missing |
| `TEXTINPUT` | `objects/service.js:113` | `Models.TextInput` missing |

`propertyAdapter.js` already references `DRAGCONTAINER`, `EMITTER`, `SCROLLBOX` and `TEXTINPUT`, so these were intended to ship. Decide per type: implement, or remove from `types.js` so a template fails at parse time with a clear message instead of at creation. Now that bare type selectors work, these names are also reachable as selectors, which makes the phantom entries more visible.

### 5.2 Editor component — `components/editor/api.js`
`addStyle()` (`:9-11`) and `editObject(id, key, value)` (`:75`) are empty. `_assetsKeys` is missing `AUDIOSPRITE`, `HTML`, `JSONATLAS`, `SOUND`, `SPINEATLAS`; `_objectsKeys` covers 6 of 25 object types. Finish, or mark the component experimental.

### 5.3 Transport is unreachable through config — `modules/transport/*`
- `config.useTransport` (`config/main.js:10`) is declared and documented in README §19.2 but referenced nowhere else in `src/`. `Urso.transport.init()` is never called by the engine, and nothing tells a game it must call it.
- `transport/controller.js:2-9` — `_service` is `null` until `init()`, so every handler setter (`setOnConnectionHandler`, `setResponseHandler`, …) throws if called first.
- The controller has no `singleton = true`, unlike every other module controller.
- `transport/config.js:9` — `host: Urso.helper.parseGetParams('wsHost')`. The host can only come from a URL query param; there is no static config path, and an absent param yields `undefined`.
- `transport/service.js:125` — `// TODO : SET VALIDATION MODELS`; messages are unvalidated.
- `transport/connectionTypes/websocket.js:24` — reconnect uses a raw `setTimeout` instead of `Urso.setTimeout`, so it ignores `timeScale`.

### 5.4 Smaller unfinished items
- `objects/baseModel.js:57` — `append: false` ("object will not created") is parsed but never checked anywhere.
- `objects/baseModel.js:93` — `addChildAt(childObject, zIndex, …)` ignores `zIndex` and just calls `addChild`. Honour it (`zIndex` + `sortableChildren`) or drop the parameter.
- `objects/models/toggle.js:84-88`, `objects/models/button.js:100-104` — `pixelPerfectOver` / `pixelPerfectClick` parse into empty `//todo` blocks; both options are silently ignored.
- `components/debug/controller.js:8` — `renderStats` and `resolution` debug panels are commented out of the list.
- `components/base/controller.js:43` — `loadUpdate()` is an empty `//todo` on the base component, yet it is called for every component on every progress tick.
- `scenes/service.js:60` — `addObject` returns `null` for objects created before assets resolve (`//todo Maybe we can return a promise`). Callers cannot distinguish success from "not yet".
- `components/deviceRotate/controller.js:26-44` — builds a div with classes `fullscreen`, `device-rotate`, `fullscreen-info` and loads `assets/images/fullscreen/rotate.png`. Neither the stylesheet nor the image exists in this repo, so the overlay is invisible unless the game supplies both. Document the contract or ship a minimal injected style.

---

## 6. Correctness and design issues

- `objects/propertyAdapter.js:268` — `Math.atan(xCatet / yCatet)` carries `//todo or yCatet/xCatet ?`. An unresolved correctness question in the alignment math; worth a test rather than a comment.
- `objects/propertyAdapter.js:306` — `// TODO: CHECK SCALE CAN BE NEGATIVE`; negative `scaleY` is currently rejected, which breaks flipped sprites.
- `objects/styles.js:34` — style resolution ignores the parent (`//todo consider parent`), so the CSS-like inheritance the docs imply is not implemented.
- `objects/styles.js:6-7` — the `Styles` singleton constructs a real `Models.Text` (and so a `PIXI.Text`) at startup purely to read defaults, and holds it forever.
- `lib/tween.js:248-251` — completed tweens are reclaimed, but a tween that never completes (looping, or started and abandoned) is never freed, and `_update` iterates the map with `for...in` every frame.
- `scenes/resolutions.js:13` — `//TODO optimization (performance)` on the resize path.
- Orientation helpers (`_isPortrait`, `_showOnLandscape`, `_showOnPortrait`) are duplicated across `fullscreen/controller.js`, `fullscreen/ios.js`, `fullscreen/android.js` and `deviceRotate/controller.js`, and read from two different sources — `fullscreen/controller.js:41-46` uses `ResolutionsConfig.contents` while `fullscreen/ios.js:82-87` uses `ResolutionsConfig._orientations`, a private field accessed from outside the class. Consolidate into one helper.

---

## 7. Configuration and integration

- **Resolution is hardcoded to 1** — `pixiWrapper.js:43-47` passes `resolution: 1` and never sets `autoDensity`, so the canvas renders at 1× on high-DPI displays. This cannot be fixed by flipping the option: `scenes/resolutions.js` already hand-rolls the same scheme, multiplying the backing size by `devicePixelRatio` (`:76-78`) and dividing the CSS size by it (`:165-166`). Enabling Pixi's `autoDensity` would double-apply it and break canvas sizing. Needs a coordinated redesign of `resolutions.js` and `pixiWrapper` together, which also unblocks the commented-out `resizeTo: parent`.
- **`init()` ordering** — `_root` and `_createWorld()` run before `await app.init()` (`pixiWrapper.js:38-43`). It works, but the world is built against a renderer that does not exist yet; moving them after `init()` makes failure modes clearer.
- **Globals** — `extra/main.js` assigns `window.PIXI`, `window.gsap` and `window.UrsoUtils`. Every engine file depends on the `PIXI` global rather than importing, which is why `extra/main.js` must load first; `soundManager/controller.js:18` reaches for `UrsoUtils.Howler` the same way. Document the load-order contract, or move to real imports.

---

## 8. Follow-ups created by this branch

- **`cacheAsBitmap` is now unsupported.** The proxy mapping was removed because v8's `cacheAsTexture` is a method, not a property, and assigning to it destroyed the method. Re-enabling the feature needs a method-call mapping in `objects/proxy.js` (the existing `function.` convention only calls methods without arguments). Until then, setting `cacheAsBitmap` on an object silently does nothing.
- **`Urso.scenes.getRenderer()` is a breaking change.** It returned the `Application`; it now returns `app.renderer` as its JSDoc always promised, with `getApp()` added for callers that want the Application. Needs a README note and a changelog migration line.
- **`build/js/index.js` is no longer loadable via a plain `<script>` tag.** Externalising `pixi.js`, `gsap`, `howler` and the spine runtime was correct for an npm library (3.2 MB → 340 KB, no duplicate Pixi), but the output now carries bare imports and needs a resolver. Document the supported consumption path, and decide whether a second self-contained IIFE/UMD build is worth shipping for script-tag users.
- **Production mode now silences the host page's `console.log`.** `lib/logger.js` has always done `window.log = console.log = () => {}` when the LOG level is off, but the default level included LOG so it never fired. Now that `config.mode === 'production'` defaults to ERROR-only, a production build overwrites the global `console.log` for the whole page, not just the engine. That is aggressive for a library. Decide whether to keep it (and document it loudly) or scope the suppression to `window.log` only.
- **`_fpsCheckAllowUpdate()` always returns `true`.** Removing the duplicate manual gate left it a pure side-effect call (update the FPS counter, set `ticker.maxFPS`), so the `if (!this._fpsCheckAllowUpdate()) return false;` guard in `_loop` is dead. Rename it to `_updateFpsLimit()` and drop the guard, or reinstate a real return contract.

---

## 9. Docs, tests, tooling

- **Test coverage is a starting point, not a suite.** `npm test` runs three smoke suites — type selectors, the lazy-load group state machine, and the loader's success/error/retry contract (43 assertions, all verified to fail against the pre-fix code). Nothing covers the template→assets→objects→components pipeline, the instance factory's mode/mixin resolution, or the property proxy. A test that instantiates every path registered in `config/load.js` would catch §5.1 automatically.
- **No linter or formatter.** Indentation is inconsistent across the codebase (2-space in components, 4-space in modules).
- **`README.bak.md` is still checked in.**
- README needs updating for the behaviour changes in §8, plus the newly working bare type selectors and the `isGroupLoaded` / `isGroupLoading` / promise additions to `Urso.assets`.

---

## 10. Suggested order

1. **§1.1** — the `this.assets` split. Precondition for `unloadGroup` (§1.2), and it removes the `initial`-group special-casing `loadGroup` currently carries.
2. **§2.1** — atlas frame collisions. Still silent data loss; the intended namespacing fix exists but needs a decision on key format first.
3. **§1.2, §1.3, §1.4** — finish lazy loading: unload, placeholders, worked example.
4. **§3.1** — the `refreshStyles()` storm, now the largest remaining CPU cost on scene build.
5. **§5.1** — decide implement-vs-remove for the five phantom object types before anyone writes a template against them.
6. **§4** — remaining v8 debt; §4.1 (`fillCustomColors`) and §4.3 (`revolt-fx`) are the two with user-visible impact.
7. **§3.2 – §3.4 and §7** — culling, render groups, renderer init and the resolution/DPI redesign. Last, because they need profiling on target hardware and §7 touches two files that must change together.
8. **§8 + §9** — resolve the follow-ups and document the breaking changes before the next publish.
