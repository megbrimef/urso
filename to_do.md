# Urso engine — remaining work

Open items only. Everything already fixed on `fix/engine-audit-0.9` has been removed from this list — see `git log a1c85db..HEAD` for what was done and why.

Line numbers are current as of that branch. Verified against the installed PixiJS **8.10.2** in `node_modules/pixi.js`.

**Contents**

1. [Asset loading: progress, errors, retry](#1-asset-loading-progress-errors-retry)
2. [Lazy load by groups — remaining pieces](#2-lazy-load-by-groups--remaining-pieces)
3. [Asset and cache layer](#3-asset-and-cache-layer)
4. [Remaining PixiJS v8 debt](#4-remaining-pixijs-v8-debt)
5. [Unfinished features](#5-unfinished-features)
6. [Correctness and design issues](#6-correctness-and-design-issues)
7. [Configuration and integration](#7-configuration-and-integration)
8. [Follow-ups created by this branch](#8-follow-ups-created-by-this-branch)
9. [Docs, tests, tooling](#9-docs-tests-tooling)
10. [Suggested order](#10-suggested-order)

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

## 4. Remaining PixiJS v8 debt

### 4.1 `fillCustomColors` is advertised but dead — `extra/pixiPatch.js`, `objects/models/text.js:27, 100-101`, `objects/proxy.js:275`
`pixiPatch.js` targets v6/v7 internals (`PIXI.Text.prototype.drawLetterSpacing`, `PIXI.Container.prototype.renderAdvanced`, `PIXI.MeshMaterial`), none of which exist in v8. It is correctly disabled at `config/load.js:27` and `:186` — but the per-character text colouring it provided is still parsed, still assigned, and still mapped in the proxy, so the option is a silent no-op. Either reimplement on v8 (`SplitText`, or per-character `Text` objects) or remove the parameter, its proxy mapping, and its documentation.

### 4.2 `baseModel.transform` returns `undefined` — `objects/baseModel.js:79-81`
`Container.transform` was removed in v8 (no `get transform` in `Container.mjs`). Expose `localTransform` / `worldTransform`, or drop the getter.

### 4.3 `config.appVersion` anticache is dead — `lib/loader.js:125`
`defaultQueryString` is commented out, so the documented anticache mechanism does nothing. v8 equivalent: `Assets.init({ defaultSearchParams: { appVersion } })`.

### 4.4 Dead v5 asset params — `assets/models/sound.js:9-13`
`params: { loadType: 1, xhrType: 'blob' }` are v5 `PIXI.Loader` options that v8 `Assets` ignores entirely. The real loading is done by the custom `SoundAsset` LoadParser in `extra/main.js`. Remove.

### 4.5 Dead code in the Pixi wrapper — `scenes/pixiWrapper.js:35, 218, 65, 235`
- `_setPixiSettings()` (line 218) is never called and its body targets the removed `PIXI.settings`. v8 equivalents: `TextureSource.defaultOptions.scaleMode`, `AbstractRenderer.defaultOptions.resolution`. Reimplement or delete along with the commented call at line 35.
- `_requestAnimFrame` (line 235) is dead now that `app.ticker` drives the loop; the commented call sits at line 65.

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
- `lib/tween.js:251` — tweens are never garbage collected; `this._tweens` grows unbounded. A real leak on long sessions.
- `lib/logger.js:23` — log level is not switched by `config.mode`, so production builds keep full logging.
- `components/soundInitialPopup/controller.js:38` subscribes to the string literal `'components.soundInitialPopup.pointerAction.popupButton'`, which is not in `Urso.events`; every other component uses a constant. The tint `0xd4be69` at line 20 is likewise hardcoded.
- `statesManager/action.js:28-30` — leftover random-timeout debug scaffolding in a comment; delete.
- Orientation helpers (`_isPortrait`, `_showOnLandscape`, `_showOnPortrait`) are duplicated across `fullscreen/controller.js`, `fullscreen/ios.js`, `fullscreen/android.js` and `deviceRotate/controller.js`, and read from two different sources — `fullscreen/controller.js:41-46` uses `ResolutionsConfig.contents` while `fullscreen/ios.js:82-87` uses `ResolutionsConfig._orientations`, a private field accessed from outside the class. Consolidate into one helper.

---

## 7. Configuration and integration

- **`config.gameContainerSelector` is undocumented and undefined** — read at `pixiWrapper.js:50` but absent from `config/main.js`. `document.querySelector(undefined)` stringifies to the selector `"undefined"`, returns `null`, and silently falls back to `document.body`. Add it to `ConfigMain` with a default.
- **Resolution is hardcoded to 1** — `pixiWrapper.js:52-54` passes `resolution: 1` and never sets `autoDensity`, so the canvas renders at 1× on high-DPI displays and ignores `Urso.device.getPixelRatio()`. This also makes the commented-out `resizeTo: parent` (line 53) moot. Expected v8 setup: `resolution: window.devicePixelRatio, autoDensity: true`.
- **`init()` ordering** — `_root` and `_createWorld()` run before `await app.init()` (`pixiWrapper.js:44-58`). It works, but the world is built against a renderer that does not exist yet; moving them after `init()` makes failure modes clearer.
- **Globals** — `extra/main.js` assigns `window.PIXI`, `window.gsap` and `window.UrsoUtils`. Every engine file depends on the `PIXI` global rather than importing, which is why `extra/main.js` must load first; `soundManager/controller.js:18` reaches for `UrsoUtils.Howler` the same way. Document the load-order contract, or move to real imports.

---

## 8. Follow-ups created by this branch

- **`cacheAsBitmap` is now unsupported.** The proxy mapping was removed because v8's `cacheAsTexture` is a method, not a property, and assigning to it destroyed the method. Re-enabling the feature needs a method-call mapping in `objects/proxy.js` (the existing `function.` convention only calls methods without arguments). Until then, setting `cacheAsBitmap` on an object silently does nothing.
- **`Urso.scenes.getRenderer()` is a breaking change.** It returned the `Application`; it now returns `app.renderer` as its JSDoc always promised, with `getApp()` added for callers that want the Application. Needs a note in the README and a migration line in the changelog.
- **`build/js/index.js` is no longer loadable via a plain `<script>` tag.** Externalising `pixi.js`, `gsap`, `howler` and the spine runtime was correct for an npm library (3.2 MB → 338 KB, no duplicate Pixi), but the output now carries bare imports and needs a resolver. Document the supported consumption path, and decide whether a second, self-contained IIFE/UMD build is worth shipping for script-tag users.

---

## 9. Docs, tests, tooling

- **Test coverage is a starting point, not a suite.** `npm test` runs two smoke suites (type selectors, lazy-load group state machine). Nothing covers the template→assets→objects→components pipeline, the instance factory's mode/mixin resolution, or the property proxy. A test that instantiates every path registered in `config/load.js` would catch §5.1 automatically.
- **No linter or formatter.** Indentation is inconsistent across the codebase (2-space in components, 4-space in modules).
- **`README.md:63-67` documents `yarn start` / `npm run start`,** neither of which exists — the script is `dev`.
- **`README.bak.md` is still checked in.**
- README needs updating for the two behaviour changes in §8, plus the newly working bare type selectors and the `isGroupLoaded`/`isGroupLoading`/promise additions to `Urso.assets`.

---

## 10. Suggested order

1. **§1** — asset loading progress, errors and retry. Everything downstream is untestable with real content while a single bad asset hangs the scene silently.
2. **§2.1** — the `this.assets` split. It is the precondition for `unloadGroup` (§2.2) and removes the `initial`-group special-casing that `loadGroup` currently carries.
3. **§3.1 + §3.2** — atlas key collisions. Silent data loss, and the fix is already written and commented out.
4. **§2.2, §2.3, §2.4** — finish lazy loading: unload, placeholders, worked example.
5. **§5.1** — decide implement-vs-remove for the five phantom object types before anyone writes a template against them.
6. **§4** — remaining v8 debt; §4.1 (`fillCustomColors`) and §4.6 (`revolt-fx`) are the only two with user-visible impact.
7. **§8 + §9** — document the breaking changes before the next publish.
