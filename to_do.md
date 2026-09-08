# Urso engine — remaining work

Open items only. Everything already fixed on `fix/engine-audit-0.9` has been removed from this list — see `git log a1c85db..HEAD` for what was done and why.

The asset loader's progress/error/retry path, the object-property hot-path allocations, the Text construction storm, and the texture-key mangling were all fixed in the latest round; what remains here is the work that needs design decisions, profiling, or a product call.

Line numbers are current as of that branch. Verified against the installed PixiJS **8.10.2** in `node_modules/pixi.js`.

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

The core mechanism now works (per-scene passes, no deadlocks, `isGroupLoaded`/`isGroupLoading`, promise API). Three things are still missing.

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
Fix: split into `this._preloadSpaces` and `this._groups`, or drop the numeric spaces entirely and key everything by group name. This is also what removes the `initial: 0` numeric/string ambiguity that the current `loadGroup` has to special-case.

### 1.2 Groups cannot be unloaded
There is no `unloadGroup(name)`. Once loaded, a group's textures stay in `Urso.cache.assetsList` for the process lifetime, and `_addedAssetsCache` (`assets/service.js:10`) permanently records the key so the asset can never be re-registered. A game that lazy-loads a bonus round and returns to base game only grows.
Needs: `Urso.assets.unloadGroup(name)` that calls `PIXI.Assets.unload(...)`, drops the entries from `Urso.cache`, removes the keys from `_addedAssetsCache`, and removes the group from `_loadedGroups` so it can be loaded again.

### 1.3 `placeHolder` is parsed and ignored — `assets/baseModel.js:17`
```js
this.placeHolder = Urso.helper.recursiveGet('placeHolder', params, false); //placeHolder assets model //TODO
```
The whole point of lazy loading is that an object can exist before its texture arrives. Nothing reads this field, so an `IMAGE` whose asset sits in a lazy group still fails at creation with `no image with key` (`objects/models/image.js:27`). Implement it: resolve to the placeholder texture at create time, then swap when `MODULES_ASSETS_GROUP_LOADED` fires for that group.

### 1.4 No worked example — `src/app/`
`assets/config.js` now documents the contract, but `src/app/` still contains only `config/load.js` and `templates/scenes/play.js`. Add a commented `src/app/modules/assets/config.js` stub plus a scene template that tags an asset with a `loadingGroup`, so the override-through-`extendingChain` path is demonstrated once end to end.

---

## 2. Asset and cache layer

### 2.2 `addFolderPathInAtlasTextureKey` does nothing — `assets/service.js:268, 284`
The option is read from config and then never applied; the code that would prefix a frame key with its folder path is commented out. This is the intended fix for the collisions in 3.1.

### 2.3 Global atlas rebuild is O(N²) — `lib/cache.js:23-31, 157`
`addAtlas` calls `clearGlobalAtlas()` on every atlas, and the `globalAtlas` getter rebuilds the entire `spine.TextureAtlas` from scratch on next access, re-walking every spine skin and attachment via `_getMeshFrameNames()`. Loading N atlases while reading the global atlas between them rebuilds N times. Given the recent commit history (`global atlas update`, `fixed uv for spine issue`) this area is already fragile — add a rebuild-once-after-batch flag.

### 2.4 Texture resolution is never applied — `assets/service.js:398`
`//TODO change resolution of base texture`. The `qualityFactors` in `assets/config.js:11-15` decide *which file* is fetched but not how it renders, so HD assets draw at the wrong size.

### 2.5 Other pipeline gaps
- `lib/loader.js:141-145` — the `ATLAS`-sourced-from-`JSONATLAS` branch is commented out, so such an atlas is skipped entirely (the `map` callback returns without loading).
- `assets/service.js:299` — `_processLoadedAssets` no longer post-processes `IMAGE` (resolution), `BITMAPFONT` or `FONT`; only `SPINEATLAS` survives. v8's `Assets` handles web fonts and bitmap fonts natively — verify and delete the dead branches, or reimplement.
- `assets/service.js:153` — `preloadAllImagesInGPU()` has an empty body. Implement with v8's `renderer.prepare` (needs `import 'pixi.js/prepare'`) or remove it and its controller passthrough.
- `assets/service.js:225`, `lib/loader.js:151-162` — the `noAtlasSpine` / global-atlas metadata path is half-disabled and self-labelled `FIXME remove noAtlasSpine`.

---

## 3. Performance

Audited against the `pixijs-performance` guidance and the installed v8 source. The costs below are ordered by expected impact. Numbers come from a 1,000,000-iteration microbenchmark of the exact patterns in the code; the per-frame budget at 60fps is 16.7 ms.

### 3.6 `refreshStyles()` re-runs every style selector on every object add/remove/destroy — `objects/service.js:173, 186, 222`, `objects/styles.js:22, 96-97`
`Urso.objects.create()` and every add/remove/destroy call `refreshStyles()` with no argument. That runs `_resetInactualStyles()` (walks the whole style cache, calling `testObject` on each cached object) and then `_apply()` for **every selector in the template**, each of which performs a full `findAll(selector)` search.

Building a scene of N objects with S style selectors is therefore O(N x S) selector searches, plus a full cache re-validation per object. `//todo optimization` is already on all three call sites. Fix: batch the refresh — create the whole tree with `doNotRefreshStylesFlag`, then refresh once — and scope `_apply` to the subtree being added rather than the world.

### 3.8 Culling is never enabled anywhere
`CullerPlugin` is never registered, and `cullable` / `cullArea` / `cullableChildren` appear nowhere in `src/` (the only hit is inside the disabled `extra/pixiPatch.js`). Every object is submitted to the renderer every frame regardless of whether it is on screen. For a scene larger than the viewport this is pure GPU waste.

Fix: register `CullerPlugin` before `app.init()`, expose `cullable`/`cullArea` as object-model properties through the proxy alias map, and set `cullableChildren = false` on static UI subtrees so the culler does not recurse into them.

### 3.9 No render groups, no `cacheAsTexture`, no batching guidance
- `objects/config.js:5` — `objectsToCache` is an empty array, so the object pool is off by default. That is a defensible default, but nothing documents when to turn it on.
- Nothing in the engine ever calls `cacheAsTexture` or `enableRenderGroup`, and the proxy mapping for it was removed (see 9.1). Static UI panels and complex `Graphics` therefore re-render from scratch every frame.
- `interactiveChildren` is never set to `false` on any container, so hit-testing recurses through every subtree on every pointer event.
- The scene graph is built in template order with no type grouping, so an interleaved `IMAGE / GRAPHICS / IMAGE / GRAPHICS` template produces four draw calls where two would do. Worth a note in the docs at minimum.

### 3.10 Renderer init leaves performance options unset — `scenes/pixiWrapper.js:51-55`
```js
await app.init({ background: "0x222222", resolution: 1 });
```
No `antialias`, `powerPreference`, `preference` (webgl/webgpu), `gcActive`/`gcMaxUnusedTime`/`gcFrequency`, and no `PrepareSystem` upload before a scene is shown — so the first frame after every scene load hitches while textures upload. See also 8 (Configuration) for the hardcoded `resolution: 1`, which is a correctness issue on high-DPI displays as well as a performance knob.

### 3.12 Minor per-frame allocations
- `lib/tween.js:230` — `new Date().getTime()` every frame; `performance.now()` avoids the `Date` allocation and has better resolution.
- `observer/controller.js:31-32` — every `fire()` builds a concatenated `eventName + suffix` string and dispatches twice (global + scene-scoped). `MODULES_SCENES_UPDATE` fires every frame, so this is 60 string allocations/sec minimum, more with per-frame game events.
- `objects/proxy.js:190` — `target.transitionProperty.split(' ')` allocates on every set for any object configured with transitions.

---

## 4. Remaining PixiJS v8 debt

### 4.1 `fillCustomColors` is advertised but dead — `extra/pixiPatch.js`, `objects/models/text.js:27, 100-101`, `objects/proxy.js:275`
`pixiPatch.js` targets v6/v7 internals (`PIXI.Text.prototype.drawLetterSpacing`, `PIXI.Container.prototype.renderAdvanced`, `PIXI.MeshMaterial`), none of which exist in v8. It is correctly disabled at `config/load.js:27` and `:186` — but the per-character text colouring it provided is still parsed, still assigned, and still mapped in the proxy, so the option is a silent no-op. Either reimplement on v8 (`SplitText`, or per-character `Text` objects) or remove the parameter, its proxy mapping, and its documentation.

### 4.3 `config.appVersion` anticache is dead — `lib/loader.js:125`
`defaultQueryString` is commented out, so the documented anticache mechanism does nothing. v8 equivalent: `Assets.init({ defaultSearchParams: { appVersion } })`.

### 4.6 `@urso/revolt-fx` is a v7-era dependency
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

`propertyAdapter.js` already references `DRAGCONTAINER`, `EMITTER`, `SCROLLBOX` and `TEXTINPUT`, so these were intended to ship. Decide per type: implement, or remove from `types.js` so a template fails at parse time with a clear message instead of at creation.

Note: now that bare type selectors exist, these names are also reachable as selectors, which makes the phantom entries more visible.

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
- `objects/baseModel.js:83` — `addChildAt(childObject, zIndex, …)` ignores `zIndex` and just calls `addChild`. Honour it (`zIndex` + `sortableChildren`) or drop the parameter.
- `objects/models/toggle.js:83-87`, `objects/models/button.js:100-104` — `pixelPerfectOver` / `pixelPerfectClick` parse into empty `//todo` blocks; both options are silently ignored.
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
- `objects/service.js:173, 186, 222` — `Urso.objects.refreshStyles()` is called with no argument on every add/remove/destroy, re-walking the whole world. Self-labelled `//todo optimization`; a likely hot spot on object-heavy scenes.
- `scenes/resolutions.js:13` — `//TODO optimization (performance)` on the resize path.
- `statesManager/action.js:28-30` — leftover random-timeout debug scaffolding in a comment; delete.
- Orientation helpers (`_isPortrait`, `_showOnLandscape`, `_showOnPortrait`) are duplicated across `fullscreen/controller.js`, `fullscreen/ios.js`, `fullscreen/android.js` and `deviceRotate/controller.js`, and read from two different sources — `fullscreen/controller.js:41-46` uses `ResolutionsConfig.contents` while `fullscreen/ios.js:82-87` uses `ResolutionsConfig._orientations`, a private field accessed from outside the class. Consolidate into one helper.

---

## 7. Configuration and integration

- **Resolution is hardcoded to 1** — `pixiWrapper.js:52-54` passes `resolution: 1` and never sets `autoDensity`, so the canvas renders at 1× on high-DPI displays and ignores `Urso.device.getPixelRatio()`. This also makes the commented-out `resizeTo: parent` (line 53) moot. Expected v8 setup: `resolution: window.devicePixelRatio, autoDensity: true`.
- **`init()` ordering** — `_root` and `_createWorld()` run before `await app.init()` (`pixiWrapper.js:44-58`). It works, but the world is built against a renderer that does not exist yet; moving them after `init()` makes failure modes clearer.
- **Globals** — `extra/main.js` assigns `window.PIXI`, `window.gsap` and `window.UrsoUtils`. Every engine file depends on the `PIXI` global rather than importing, which is why `extra/main.js` must load first; `soundManager/controller.js:18` reaches for `UrsoUtils.Howler` the same way. Document the load-order contract, or move to real imports.

---

## 8. Follow-ups created by this branch

- **`cacheAsBitmap` is now unsupported.** The proxy mapping was removed because v8's `cacheAsTexture` is a method, not a property, and assigning to it destroyed the method. Re-enabling the feature needs a method-call mapping in `objects/proxy.js` (the existing `function.` convention only calls methods without arguments). Until then, setting `cacheAsBitmap` on an object silently does nothing.
- **`Urso.scenes.getRenderer()` is a breaking change.** It returned the `Application`; it now returns `app.renderer` as its JSDoc always promised, with `getApp()` added for callers that want the Application. Needs a note in the README and a migration line in the changelog.
- **`build/js/index.js` is no longer loadable via a plain `<script>` tag.** Externalising `pixi.js`, `gsap`, `howler` and the spine runtime was correct for an npm library (3.2 MB → 338 KB, no duplicate Pixi), but the output now carries bare imports and needs a resolver. Document the supported consumption path, and decide whether a second, self-contained IIFE/UMD build is worth shipping for script-tag users.
- **Production mode now silences the host page's `console.log`.** `lib/logger.js` has always done `window.log = console.log = () => {}` when the LOG level is off, but the default level included LOG so it never fired. Now that `config.mode === 'production'` defaults to ERROR-only, a production build of a game overwrites the global `console.log` for the whole page, not just the engine. That is aggressive for a library. Decide whether to keep it (and document it loudly) or scope the suppression to `window.log` only.
- **`_fpsCheckAllowUpdate()` now always returns `true`.** Removing the duplicate manual gate left the method as a pure side-effect call (update the FPS counter, set `ticker.maxFPS`), so the `if (!this._fpsCheckAllowUpdate()) return false;` guard in `_loop` is dead. Rename it to something like `_updateFpsLimit()` and drop the guard, or reinstate a real return contract.

---

## 9. Docs, tests, tooling

- **Test coverage is a starting point, not a suite.** `npm test` runs two smoke suites (type selectors, lazy-load group state machine). Nothing covers the template→assets→objects→components pipeline, the instance factory's mode/mixin resolution, or the property proxy. A test that instantiates every path registered in `config/load.js` would catch §5.1 automatically.
- **No linter or formatter.** Indentation is inconsistent across the codebase (2-space in components, 4-space in modules).
- **`README.bak.md` is still checked in.**
- README needs updating for the two behaviour changes in §8, plus the newly working bare type selectors and the `isGroupLoaded`/`isGroupLoading`/promise additions to `Urso.assets`.

---

## 10. Suggested order

1. **§1.1** — the `this.assets` split. It is the precondition for `unloadGroup` (§1.2) and removes the `initial`-group special-casing `loadGroup` currently carries.
2. **§2.2 + §2.1** — atlas key collisions. Texture keys are now only stripped of real image extensions, but frames from different atlases still overwrite each other silently; `addFolderPathInAtlasTextureKey` is the intended namespacing fix and is still inert.
3. **§1.2, §1.3, §1.4** — finish lazy loading: unload, placeholders, worked example.
4. **§3.1** — the `refreshStyles()` storm. With the per-access allocations gone this is now the largest remaining CPU cost on scene build, but it needs care: scoping the refresh to a subtree can change which styles apply.
5. **§5.1** — decide implement-vs-remove for the five phantom object types before anyone writes a template against them.
6. **§4** — remaining v8 debt; §4.1 (`fillCustomColors`) and §4.6 (`revolt-fx`) are the only two with user-visible impact.
7. **§3.3 - §3.5** — culling, render groups and renderer init. Still last: they need profiling on target hardware to size correctly, and culling trades CPU for GPU rather than being a free win.
8. **§8 + §9** — resolve the follow-ups and document the breaking changes before the next publish.
