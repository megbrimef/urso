# Urso engine — remaining work

Open items only. Everything already fixed on `fix/engine-audit-0.9` has been removed from this list — see `git log a1c85db..HEAD` for what was done and why.

Line numbers are current as of that branch. Verified against the installed PixiJS **8.10.2** in `node_modules/pixi.js`.

**Contents**

1. [Asset loading: progress, errors, retry](#1-asset-loading-progress-errors-retry)
2. [Lazy load by groups — remaining pieces](#2-lazy-load-by-groups--remaining-pieces)
3. [Asset and cache layer](#3-asset-and-cache-layer)
4. [Performance](#4-performance)
5. [Remaining PixiJS v8 debt](#5-remaining-pixijs-v8-debt)
6. [Unfinished features](#6-unfinished-features)
7. [Correctness and design issues](#7-correctness-and-design-issues)
8. [Configuration and integration](#8-configuration-and-integration)
9. [Follow-ups created by this branch](#9-follow-ups-created-by-this-branch)
10. [Docs, tests, tooling](#10-docs-tests-tooling)
11. [Suggested order](#11-suggested-order)

---

## 1. Asset loading: progress, errors, retry

The single highest-value area left. All three defects live in `src/js/lib/loader.js`.

### 1.1 Load errors are unhandled and never retried — `lib/loader.js:128-172`
`_onError` (line 203) still holds the retry logic, but nothing is wired to it: the `onError`/`onProgress` registration is commented out at lines 176-177, and the `await Promise.all(assetsLoading)` has no `try/catch`. A single failed asset rejects the promise, `callback()` is never reached, and the scene hangs on the loading screen behind an unhandled rejection. `_lastLoadFailed` and the `currentIteration` guard (line 122) are write-only.

### 1.2 Load progress never updates — `lib/loader.js:175-177`
`_onLoadUpdate` is stored via `setOnLoadUpdate` (`assets/service.js:214`) but only ever called from the commented-out block, so `MODULES_ASSETS_LOAD_PROGRESS`, `Model.loadUpdate` and the `Loader` component's bar get nothing between 0 and completion.
v8 fix: use the batch form, which takes a progress callback —
```js
await PIXI.Assets.load(aliasArray, p => this._onLoadUpdate({ progress: p * 100 }))
```
— instead of mapping each asset to its own `Assets.load` call. Note the `Loader` component now expects a 0-100 value.

### 1.3 Loader state is never reset — `lib/loader.js:109, 116, 184-185`
`_isRunning = true` is set but only cleared in `_onError`; `_assetsQuery` is never emptied. Masked today because `Lib.Loader` is not a singleton, so `assets/service.js` gets a fresh instance per group — but the `Urso.loader` singleton handed out in `app.js:56` is permanently "running" after first use, and `isRunning()` (line 14) is unusable. Decide whether the loader is per-batch or shared, then reset both fields on the success path.

---

## 2. Lazy load by groups — remaining pieces

The core mechanism now works (per-scene passes, no deadlocks, `isGroupLoaded`/`isGroupLoading`, promise API). Three things are still missing.

### 2.1 `this.assets` mixes two incompatible shapes and leaks — `assets/service.js:48, 177`
`_createNewAssetsSpace()` stores a per-preload space at a numeric key:
```js
this.assets[this._loadCounter] = {};   // { 0: [ ...initial models... ] }
```
while `_addAsset` stores lazy groups as flat arrays at string keys:
```js
this.assets[model.loadingGroup].push(model);   // [ ...models... ]
```
So `this.assets` is simultaneously a map of preload-spaces and a map of group-arrays, told apart only by key type. `_processLoadedAssets` deletes the inner group but leaves the numeric space `{}` behind — one empty object leaked per `preload()` call, forever.
Fix: split into `this._preloadSpaces` and `this._groups`, or drop the numeric spaces entirely and key everything by group name. This is also what removes the `initial: 0` numeric/string ambiguity that the current `loadGroup` has to special-case.

### 2.2 Groups cannot be unloaded
There is no `unloadGroup(name)`. Once loaded, a group's textures stay in `Urso.cache.assetsList` for the process lifetime, and `_addedAssetsCache` (`assets/service.js:10`) permanently records the key so the asset can never be re-registered. A game that lazy-loads a bonus round and returns to base game only grows.
Needs: `Urso.assets.unloadGroup(name)` that calls `PIXI.Assets.unload(...)`, drops the entries from `Urso.cache`, removes the keys from `_addedAssetsCache`, and removes the group from `_loadedGroups` so it can be loaded again.

### 2.3 `placeHolder` is parsed and ignored — `assets/baseModel.js:17`
```js
this.placeHolder = Urso.helper.recursiveGet('placeHolder', params, false); //placeHolder assets model //TODO
```
The whole point of lazy loading is that an object can exist before its texture arrives. Nothing reads this field, so an `IMAGE` whose asset sits in a lazy group still fails at creation with `no image with key` (`objects/models/image.js:27`). Implement it: resolve to the placeholder texture at create time, then swap when `MODULES_ASSETS_GROUP_LOADED` fires for that group.

### 2.4 No worked example — `src/app/`
`assets/config.js` now documents the contract, but `src/app/` still contains only `config/load.js` and `templates/scenes/play.js`. Add a commented `src/app/modules/assets/config.js` stub plus a scene template that tags an asset with a `loadingGroup`, so the override-through-`extendingChain` path is demonstrated once end to end.

---

## 3. Asset and cache layer

### 3.1 `addTexture` mangles keys containing dots — `lib/cache.js:188-195`
```js
if (key.includes('.')) {
    const keySplit = key.split('.');
    key = keySplit.splice(0, keySplit.length - 1).join('.')
}
```
Intended to strip a file extension, but it strips the last dot-segment from *any* key: a frame named `ui.button.normal` becomes `ui.button`. Combined with `_setDataToAssetsList` (line 144), which warns about a duplicate key and then overwrites anyway, two frames from different atlases collapse onto one entry behind a console warning. README §24.5 already flags atlas name intersections as a hazard. Strip only a known image extension, and namespace instead of overwriting — see 3.2.

### 3.2 `addFolderPathInAtlasTextureKey` does nothing — `assets/service.js:268, 284`
The option is read from config and then never applied; the code that would prefix a frame key with its folder path is commented out. This is the intended fix for the collisions in 3.1.

### 3.3 Global atlas rebuild is O(N²) — `lib/cache.js:23-31, 157`
`addAtlas` calls `clearGlobalAtlas()` on every atlas, and the `globalAtlas` getter rebuilds the entire `spine.TextureAtlas` from scratch on next access, re-walking every spine skin and attachment via `_getMeshFrameNames()`. Loading N atlases while reading the global atlas between them rebuilds N times. Given the recent commit history (`global atlas update`, `fixed uv for spine issue`) this area is already fragile — add a rebuild-once-after-batch flag.

### 3.4 Texture resolution is never applied — `assets/service.js:398`
`//TODO change resolution of base texture`. The `qualityFactors` in `assets/config.js:11-15` decide *which file* is fetched but not how it renders, so HD assets draw at the wrong size.

### 3.5 Other pipeline gaps
- `lib/loader.js:141-145` — the `ATLAS`-sourced-from-`JSONATLAS` branch is commented out, so such an atlas is skipped entirely (the `map` callback returns without loading).
- `assets/service.js:299` — `_processLoadedAssets` no longer post-processes `IMAGE` (resolution), `BITMAPFONT` or `FONT`; only `SPINEATLAS` survives. v8's `Assets` handles web fonts and bitmap fonts natively — verify and delete the dead branches, or reimplement.
- `assets/service.js:153` — `preloadAllImagesInGPU()` has an empty body. Implement with v8's `renderer.prepare` (needs `import 'pixi.js/prepare'`) or remove it and its controller passthrough.
- `assets/service.js:225`, `lib/loader.js:151-162` — the `noAtlasSpine` / global-atlas metadata path is half-disabled and self-labelled `FIXME remove noAtlasSpine`.

---

## 4. Performance

Audited against the `pixijs-performance` guidance and the installed v8 source. The costs below are ordered by expected impact. Numbers come from a 1,000,000-iteration microbenchmark of the exact patterns in the code; the per-frame budget at 60fps is 16.7 ms.

### 4.1 `_getAliases()` rebuilds a ~55-key object literal on EVERY property get and set — `objects/proxy.js:275-300`
This is the single worst hot-path issue in the engine. `_getAliases()` returns a fresh object literal, and it is called from both proxy traps:

```js
_customGetLogic(object, key, reflectValue) {
    const wrapKey = this._getAliases()[key];   // allocates ~55 keys, then reads one
```

Every scene object is wrapped in a `Proxy`, so this fires on *every* property access — including internal reads of `_baseObject`, `_uid`, `type`, and every method lookup, not just the mapped properties. Measured: **158x slower** than indexing a hoisted constant (468 ms vs 3.0 ms per million calls), plus ~55 key allocations per access feeding constant GC pressure.

Fix: hoist to a module-level `const`, or build once in the constructor. The same applies to `_getSelectorProperties()` (`:262`) and `_getOriginalModelExceptions()` (`:268`), which allocate fresh arrays per call and are also invoked from the set trap.

### 4.2 `isAdaptiveProperty()` allocates a key array per property set — `objects/propertyAdapter.js:76-78`
```js
isAdaptiveProperty(property) {
    return Object.keys(this._dependencies).includes(property);
}
```
Called from `proxy._setProperty` on every property set. `Object.keys()` allocates a 13-element array, then `.includes()` does a linear scan. Measured: **539x slower** than `property in this._dependencies` (444 ms vs 0.8 ms per million). One-line fix.

### 4.3 `checkDeepEqual` uses `JSON.stringify` — and runs every frame — `lib/helper.js:373-375`, `scenes/pixiWrapper.js:330`
```js
checkDeepEqual(obj1, obj2) { return JSON.stringify(obj1) === JSON.stringify(obj2); }
```
`_checkMouse()` calls it once per frame to compare two `{x, y}` objects, so every frame does two `JSON.stringify` calls and two string allocations. Measured: **215x slower** than comparing the two fields directly (3499 ms vs 16 ms per million). Compare `x`/`y` inline in `_checkMouse`; leave the generic helper for cold paths, or document it as debug-only.

### 4.4 `recursiveGet`/`recursiveSet` re-split the key string on every call — `lib/helper.js:177, 209`
```js
key = (typeof key === 'string') ? key.split(".") : key;
```
These are the workhorses behind every mapped proxy property (`'anchor.x'`, `'style.fontSize'`, …), so the split runs on every get and set that resolves through an alias. Measured: **3.7x slower** than memoising the split path (803 ms vs 220 ms per million). Cache split paths in a `Map` keyed by the string. Note `recursiveSet` also mutates its input array via `shift()`, so a cached array must be copied or the loop rewritten with an index.

### 4.5 Creating one styled `Text` triggers ~18 separate re-renders — `objects/models/text.js:93-98`, `objects/service.js:227-234`
The text model constructs `PIXI.Text` with only three style keys:
```js
const styles = { fontFamily: this.fontFamily, leading: this.leading, align: this.textAlign };
this._baseObject = new PIXI.Text(this.text, styles);
```
The other 18 `style.*` properties in the proxy alias map (`fontSize`, `fill`, `stroke`, `dropShadow*`, `wordWrap*`, `letterSpacing`, …) are then applied one at a time by `_updateCommonProperties`, which loops `_originalModel` and sets each key individually. Each assignment reaches a `TextStyle` setter, which emits `update`, which calls `onViewUpdate()` — so a fully-styled text object re-renders its canvas and re-uploads to the GPU up to 18 times before it is ever shown. On a text-heavy scene this dominates scene build time.

Fix: assemble the complete style object in `_addBaseObject` and pass it to the constructor once, leaving `_updateCommonProperties` to handle only non-style properties. While there, switch to the v8 options form — `new PIXI.Text({ text, style })` — since the positional form only survives behind a deprecation shim (`AbstractText.mjs`, `ensureTextOptions`).

### 4.6 `refreshStyles()` re-runs every style selector on every object add/remove/destroy — `objects/service.js:173, 186, 222`, `objects/styles.js:22, 96-97`
`Urso.objects.create()` and every add/remove/destroy call `refreshStyles()` with no argument. That runs `_resetInactualStyles()` (walks the whole style cache, calling `testObject` on each cached object) and then `_apply()` for **every selector in the template**, each of which performs a full `findAll(selector)` search.

Building a scene of N objects with S style selectors is therefore O(N x S) selector searches, plus a full cache re-validation per object. `//todo optimization` is already on all three call sites. Fix: batch the refresh — create the whole tree with `doNotRefreshStylesFlag`, then refresh once — and scope `_apply` to the subtree being added rather than the world.

### 4.7 `_checkMaxSize` does pointless work on every property set — `objects/proxy.js:104-160`
Two problems, both v8-related:
- `baseObject.updateTransform({})` (line 110). In v7 this recalculated the world transform. **In v8 `updateTransform(opts)` is a property setter** (`Container.mjs:874`) that assigns position/scale/rotation/skew/pivot/origin from an options object; passed `{}`, every field falls back to its current value. So it performs six `.set()` calls to achieve nothing, on every property set of any object with `maxWidth`/`maxHeight` — and the original intent (force a transform recalc before measuring) is silently lost, so the measurement below it may read stale bounds.
- `baseObject.updateText(true)` (line 115) **does not exist in v8** — `Text.updateText` was removed. If that branch is entered (`!texture.orig.width`), it throws `TypeError: baseObject.updateText is not a function`.

### 4.8 Culling is never enabled anywhere
`CullerPlugin` is never registered, and `cullable` / `cullArea` / `cullableChildren` appear nowhere in `src/` (the only hit is inside the disabled `extra/pixiPatch.js`). Every object is submitted to the renderer every frame regardless of whether it is on screen. For a scene larger than the viewport this is pure GPU waste.

Fix: register `CullerPlugin` before `app.init()`, expose `cullable`/`cullArea` as object-model properties through the proxy alias map, and set `cullableChildren = false` on static UI subtrees so the culler does not recurse into them.

### 4.9 No render groups, no `cacheAsTexture`, no batching guidance
- `objects/config.js:5` — `objectsToCache` is an empty array, so the object pool is off by default. That is a defensible default, but nothing documents when to turn it on.
- Nothing in the engine ever calls `cacheAsTexture` or `enableRenderGroup`, and the proxy mapping for it was removed (see 9.1). Static UI panels and complex `Graphics` therefore re-render from scratch every frame.
- `interactiveChildren` is never set to `false` on any container, so hit-testing recurses through every subtree on every pointer event.
- The scene graph is built in template order with no type grouping, so an interleaved `IMAGE / GRAPHICS / IMAGE / GRAPHICS` template produces four draw calls where two would do. Worth a note in the docs at minimum.

### 4.10 Renderer init leaves performance options unset — `scenes/pixiWrapper.js:51-55`
```js
await app.init({ background: "0x222222", resolution: 1 });
```
No `antialias`, `powerPreference`, `preference` (webgl/webgpu), `gcActive`/`gcMaxUnusedTime`/`gcFrequency`, and no `PrepareSystem` upload before a scene is shown — so the first frame after every scene load hitches while textures upload. See also 8 (Configuration) for the hardcoded `resolution: 1`, which is a correctness issue on high-DPI displays as well as a performance knob.

### 4.11 Double FPS throttling — `scenes/pixiWrapper.js:265-292`
`_fpsCheckAllowUpdate()` now both sets `this._app.ticker.maxFPS` *and* runs its own `currentTime - _lastUpdateTime` gate. Two independent throttles on the same clock can beat against each other and yield an effective rate below the configured limit. Pick one: `ticker.maxFPS` alone is the idiomatic v8 approach and lets Pixi skip the render too, whereas the manual gate only skips engine logic.

### 4.12 Minor per-frame allocations
- `lib/tween.js:230` — `new Date().getTime()` every frame; `performance.now()` avoids the `Date` allocation and has better resolution.
- `observer/controller.js:31-32` — every `fire()` builds a concatenated `eventName + suffix` string and dispatches twice (global + scene-scoped). `MODULES_SCENES_UPDATE` fires every frame, so this is 60 string allocations/sec minimum, more with per-frame game events.
- `objects/proxy.js:190` — `target.transitionProperty.split(' ')` allocates on every set for any object configured with transitions.

---

## 5. Remaining PixiJS v8 debt

### 5.1 `fillCustomColors` is advertised but dead — `extra/pixiPatch.js`, `objects/models/text.js:27, 100-101`, `objects/proxy.js:275`
`pixiPatch.js` targets v6/v7 internals (`PIXI.Text.prototype.drawLetterSpacing`, `PIXI.Container.prototype.renderAdvanced`, `PIXI.MeshMaterial`), none of which exist in v8. It is correctly disabled at `config/load.js:27` and `:186` — but the per-character text colouring it provided is still parsed, still assigned, and still mapped in the proxy, so the option is a silent no-op. Either reimplement on v8 (`SplitText`, or per-character `Text` objects) or remove the parameter, its proxy mapping, and its documentation.

### 5.2 `baseModel.transform` returns `undefined` — `objects/baseModel.js:79-81`
`Container.transform` was removed in v8 (no `get transform` in `Container.mjs`). Expose `localTransform` / `worldTransform`, or drop the getter.

### 5.3 `config.appVersion` anticache is dead — `lib/loader.js:125`
`defaultQueryString` is commented out, so the documented anticache mechanism does nothing. v8 equivalent: `Assets.init({ defaultSearchParams: { appVersion } })`.

### 5.4 Dead v5 asset params — `assets/models/sound.js:9-13`
`params: { loadType: 1, xhrType: 'blob' }` are v5 `PIXI.Loader` options that v8 `Assets` ignores entirely. The real loading is done by the custom `SoundAsset` LoadParser in `extra/main.js`. Remove.

### 5.5 Dead code in the Pixi wrapper — `scenes/pixiWrapper.js:35, 218, 65, 235`
- `_setPixiSettings()` (line 218) is never called and its body targets the removed `PIXI.settings`. v8 equivalents: `TextureSource.defaultOptions.scaleMode`, `AbstractRenderer.defaultOptions.resolution`. Reimplement or delete along with the commented call at line 35.
- `_requestAnimFrame` (line 235) is dead now that `app.ticker` drives the loop; the commented call sits at line 65.

### 5.6 `@urso/revolt-fx` is a v7-era dependency
It references `PIXI.BLEND_MODES`, which does not exist in v8 — every build prints `IMPORT_IS_UNDEFINED ... FX.js:521`. The `EMITTERFX` object type depends on it. Either upgrade/fork the package for v8 or confirm the affected code path is unreachable. It is also the one runtime dependency still bundled rather than externalised.

---

## 6. Unfinished features

### 6.1 Object types with no model — `modules/template/types.js`
Exported in `Urso.types.objects` and dispatched in `objects/service.js`, but the model classes do not exist. `getInstance` returns `false`, so creation fails with `ModulesObjectsCreate model type error` (`objects/service.js:126`):

| Type | Dispatch | Status |
|---|---|---|
| `ATLASIMAGE` | `objects/service.js:92-94` | case commented out; `Models.AtlasImage` missing |
| `DRAGCONTAINER` | `objects/service.js:98` | `Models.DragContainer` missing |
| `EMITTER` | no case → `default` → `Models.Emitter` | missing; only `EMITTERFX` exists |
| `SCROLLBOX` | no case → `default` → `Models.Scrollbox` | missing |
| `TEXTINPUT` | `objects/service.js:113` | `Models.TextInput` missing |

`propertyAdapter.js` already references `DRAGCONTAINER`, `EMITTER`, `SCROLLBOX` and `TEXTINPUT`, so these were intended to ship. Decide per type: implement, or remove from `types.js` so a template fails at parse time with a clear message instead of at creation.

Note: now that bare type selectors exist, these names are also reachable as selectors, which makes the phantom entries more visible.

### 6.2 Editor component — `components/editor/api.js`
`addStyle()` (`:9-11`) and `editObject(id, key, value)` (`:75`) are empty. `_assetsKeys` is missing `AUDIOSPRITE`, `HTML`, `JSONATLAS`, `SOUND`, `SPINEATLAS`; `_objectsKeys` covers 6 of 25 object types. Finish, or mark the component experimental.

### 6.3 Transport is unreachable through config — `modules/transport/*`
- `config.useTransport` (`config/main.js:10`) is declared and documented in README §19.2 but referenced nowhere else in `src/`. `Urso.transport.init()` is never called by the engine, and nothing tells a game it must call it.
- `transport/controller.js:2-9` — `_service` is `null` until `init()`, so every handler setter (`setOnConnectionHandler`, `setResponseHandler`, …) throws if called first.
- The controller has no `singleton = true`, unlike every other module controller.
- `transport/config.js:9` — `host: Urso.helper.parseGetParams('wsHost')`. The host can only come from a URL query param; there is no static config path, and an absent param yields `undefined`.
- `transport/service.js:125` — `// TODO : SET VALIDATION MODELS`; messages are unvalidated.
- `transport/connectionTypes/websocket.js:24` — reconnect uses a raw `setTimeout` instead of `Urso.setTimeout`, so it ignores `timeScale`.

### 6.4 Smaller unfinished items
- `objects/baseModel.js:57` — `append: false` ("object will not created") is parsed but never checked anywhere.
- `objects/baseModel.js:83` — `addChildAt(childObject, zIndex, …)` ignores `zIndex` and just calls `addChild`. Honour it (`zIndex` + `sortableChildren`) or drop the parameter.
- `objects/models/toggle.js:83-87`, `objects/models/button.js:100-104` — `pixelPerfectOver` / `pixelPerfectClick` parse into empty `//todo` blocks; both options are silently ignored.
- `components/debug/controller.js:8` — `renderStats` and `resolution` debug panels are commented out of the list.
- `components/base/controller.js:43` — `loadUpdate()` is an empty `//todo` on the base component, yet it is called for every component on every progress tick.
- `scenes/service.js:60` — `addObject` returns `null` for objects created before assets resolve (`//todo Maybe we can return a promise`). Callers cannot distinguish success from "not yet".
- `components/deviceRotate/controller.js:26-44` — builds a div with classes `fullscreen`, `device-rotate`, `fullscreen-info` and loads `assets/images/fullscreen/rotate.png`. Neither the stylesheet nor the image exists in this repo, so the overlay is invisible unless the game supplies both. Document the contract or ship a minimal injected style.

---

## 7. Correctness and design issues

- `objects/propertyAdapter.js:268` — `Math.atan(xCatet / yCatet)` carries `//todo or yCatet/xCatet ?`. An unresolved correctness question in the alignment math; worth a test rather than a comment.
- `objects/propertyAdapter.js:306` — `// TODO: CHECK SCALE CAN BE NEGATIVE`; negative `scaleY` is currently rejected, which breaks flipped sprites.
- `objects/styles.js:34` — style resolution ignores the parent (`//todo consider parent`), so the CSS-like inheritance the docs imply is not implemented.
- `objects/styles.js:6-7` — the `Styles` singleton constructs a real `Models.Text` (and so a `PIXI.Text`) at startup purely to read defaults, and holds it forever.
- `objects/service.js:173, 186, 222` — `Urso.objects.refreshStyles()` is called with no argument on every add/remove/destroy, re-walking the whole world. Self-labelled `//todo optimization`; a likely hot spot on object-heavy scenes.
- `scenes/resolutions.js:13` — `//TODO optimization (performance)` on the resize path.
- `lib/tween.js:248-250` — the `//todo remove old Tweens to garbage collect them` comment is stale: completed tweens *are* deleted on the line above it. What remains is that a tween which never completes (looping, or started and then abandoned) is never reclaimed, and `_update` iterates the map with `for...in` every frame. Delete the misleading comment; consider a sweep for long-idle tweens.
- `lib/logger.js:23` — log level is not switched by `config.mode`, so production builds keep full logging.
- `components/soundInitialPopup/controller.js:38` subscribes to the string literal `'components.soundInitialPopup.pointerAction.popupButton'`, which is not in `Urso.events`; every other component uses a constant. The tint `0xd4be69` at line 20 is likewise hardcoded.
- `statesManager/action.js:28-30` — leftover random-timeout debug scaffolding in a comment; delete.
- Orientation helpers (`_isPortrait`, `_showOnLandscape`, `_showOnPortrait`) are duplicated across `fullscreen/controller.js`, `fullscreen/ios.js`, `fullscreen/android.js` and `deviceRotate/controller.js`, and read from two different sources — `fullscreen/controller.js:41-46` uses `ResolutionsConfig.contents` while `fullscreen/ios.js:82-87` uses `ResolutionsConfig._orientations`, a private field accessed from outside the class. Consolidate into one helper.

---

## 8. Configuration and integration

- **`config.gameContainerSelector` is undocumented and undefined** — read at `pixiWrapper.js:50` but absent from `config/main.js`. `document.querySelector(undefined)` stringifies to the selector `"undefined"`, returns `null`, and silently falls back to `document.body`. Add it to `ConfigMain` with a default.
- **Resolution is hardcoded to 1** — `pixiWrapper.js:52-54` passes `resolution: 1` and never sets `autoDensity`, so the canvas renders at 1× on high-DPI displays and ignores `Urso.device.getPixelRatio()`. This also makes the commented-out `resizeTo: parent` (line 53) moot. Expected v8 setup: `resolution: window.devicePixelRatio, autoDensity: true`.
- **`init()` ordering** — `_root` and `_createWorld()` run before `await app.init()` (`pixiWrapper.js:44-58`). It works, but the world is built against a renderer that does not exist yet; moving them after `init()` makes failure modes clearer.
- **Globals** — `extra/main.js` assigns `window.PIXI`, `window.gsap` and `window.UrsoUtils`. Every engine file depends on the `PIXI` global rather than importing, which is why `extra/main.js` must load first; `soundManager/controller.js:18` reaches for `UrsoUtils.Howler` the same way. Document the load-order contract, or move to real imports.

---

## 9. Follow-ups created by this branch

- **`cacheAsBitmap` is now unsupported.** The proxy mapping was removed because v8's `cacheAsTexture` is a method, not a property, and assigning to it destroyed the method. Re-enabling the feature needs a method-call mapping in `objects/proxy.js` (the existing `function.` convention only calls methods without arguments). Until then, setting `cacheAsBitmap` on an object silently does nothing.
- **`Urso.scenes.getRenderer()` is a breaking change.** It returned the `Application`; it now returns `app.renderer` as its JSDoc always promised, with `getApp()` added for callers that want the Application. Needs a note in the README and a migration line in the changelog.
- **`build/js/index.js` is no longer loadable via a plain `<script>` tag.** Externalising `pixi.js`, `gsap`, `howler` and the spine runtime was correct for an npm library (3.2 MB → 338 KB, no duplicate Pixi), but the output now carries bare imports and needs a resolver. Document the supported consumption path, and decide whether a second, self-contained IIFE/UMD build is worth shipping for script-tag users.

---

## 10. Docs, tests, tooling

- **Test coverage is a starting point, not a suite.** `npm test` runs two smoke suites (type selectors, lazy-load group state machine). Nothing covers the template→assets→objects→components pipeline, the instance factory's mode/mixin resolution, or the property proxy. A test that instantiates every path registered in `config/load.js` would catch §5.1 automatically.
- **No linter or formatter.** Indentation is inconsistent across the codebase (2-space in components, 4-space in modules).
- **`README.md:63-67` documents `yarn start` / `npm run start`,** neither of which exists — the script is `dev`.
- **`README.bak.md` is still checked in.**
- README needs updating for the two behaviour changes in §8, plus the newly working bare type selectors and the `isGroupLoaded`/`isGroupLoading`/promise additions to `Urso.assets`.

---

## 11. Suggested order

1. **§1** — asset loading progress, errors and retry. Everything downstream is untestable with real content while a single bad asset hangs the scene silently.
2. **§2.1** — the `this.assets` split. It is the precondition for `unloadGroup` (§2.2) and removes the `initial`-group special-casing that `loadGroup` currently carries.
3. **§3.1 + §3.2** — atlas key collisions. Silent data loss, and the fix is already written and commented out.
4. **§2.2, §2.3, §2.4** — finish lazy loading: unload, placeholders, worked example.
5. **§6.1** — decide implement-vs-remove for the five phantom object types before anyone writes a template against them.
6. **§4.1 - §4.4** — the four hot-path allocation fixes. Together they are perhaps an hour of work, carry almost no behavioural risk, and are the highest performance-per-effort items in this list.
7. **§4.5 + §4.6** — text construction and the style-refresh storm; these dominate scene build time.
8. **§5** — remaining v8 debt; §5.1 (`fillCustomColors`) and §5.6 (`revolt-fx`) are the only two with user-visible impact.
9. **§4.8 - §4.10** — culling, render groups and renderer init. Do these last: they need profiling on target hardware to size correctly, and §4.8 trades CPU for GPU rather than being a free win.
10. **§9 + §10** — document the breaking changes before the next publish.
