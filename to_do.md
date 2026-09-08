# Urso engine — things to fix or finish

Audit of `src/` against the installed PixiJS **8.10.2** (`node_modules/pixi.js`), on the `dev/0.9` branch. Every API claim below was checked against the actual v8 source in `node_modules`, not assumed.

Context: the repo is mid-migration from Pixi v5/v7 to v8. `pixiWrapper`, `lib/loader`, `assets/service` and several object models were partially ported and the old paths left commented out in place. The demo scene (`src/app/templates/scenes/play.js`) is a single `Graphics` rectangle with **no assets at all**, so most of the broken paths below are never exercised by the current `npm run dev` — the engine looks healthier than it is.

**Contents**

1. [Broken at runtime (dead public API)](#1-broken-at-runtime-dead-public-api)
2. [Lazy load by groups — needs to be finished](#2-lazy-load-by-groups--needs-to-be-finished)
3. [PixiJS v8 migration debt](#3-pixijs-v8-migration-debt)
4. [Asset and cache layer](#4-asset-and-cache-layer)
5. [Correctness bugs in modules and components](#5-correctness-bugs-in-modules-and-components)
6. [Unfinished features](#6-unfinished-features)
7. [Core ships game-specific config](#7-core-ships-game-specific-config)
8. [Configuration and integration](#8-configuration-and-integration)
9. [Build and packaging](#9-build-and-packaging)
10. [Suggested order](#10-suggested-order)

---

## 1. Broken at runtime (dead public API)

### 1.1 FPS limiter is a no-op — `modules/scenes/pixiWrapper.js:249-263`
`_loop()` calls `_fpsCheckAllowUpdate()` and **discards its return value**, then always calls `_update()`:

```js
_loop() {
    this._fpsCheckAllowUpdate()   // returns true/false — ignored
    this._update();
    return true;
}
```

`config.fps.limit` and `config.fps.optimizeLowPerformance` therefore have no effect on the update rate. Fix: `if (!this._fpsCheckAllowUpdate()) return false;` before `_update()`. Note `this._app.ticker.maxFPS` is only assigned inside the passing branch (line 288) — move it so the limit applies even on a skipped frame, or drop the manual throttle and rely on `ticker.maxFPS` alone.

### 1.2 `pause()` / `resume()` do nothing — `pixiWrapper.js:79-95`
`_loopPaused` is still set, but the `if (!this._loopPaused)` guard in `_loop()` is commented out (lines 255-257). `Urso.scenes.pause()` and `isPaused()` are dead. Fix: honour the flag in `_loop()`, or `this._app.ticker.stop()/start()`. The spine global-autoupdate lines commented at 82 and 91 also need a v8 equivalent (`spine-pixi-v8` drives its own state; pause via the object's `autoUpdate`).

### 1.3 `Urso.scenes.generateTexture()` returns `undefined` — `pixiWrapper.js:202-205`
Body entirely commented out. v8 fix: `return this._app.renderer.generateTexture(obj);`.

### 1.4 Mouse coordinates are always `{x:0, y:0}` — `pixiWrapper.js:326-340`
`_getMouseCoords()` reads `this.interaction?.eventData?.data?.global`, but `this.interaction` is never assigned — the `InteractionManager` construction was commented out at lines 59-60 (the class no longer exists in v8). Consequences: `Urso.scenes.getMouseCoords()` is dead, `MODULES_SCENES_MOUSE_NEW_POSITION` never fires after the first frame, and `Debug.Coords` (`components/debug/coords.js:18`) always renders `x:0; y:0`.
v8 fix: `this._app.renderer.events.pointer.global`.

### 1.5 `getRenderer()` returns the Application, not the renderer — `pixiWrapper.js:149-151`
Returns `this._app`; the JSDoc on it and on `Urso.scenes.getRenderer()` (`modules/scenes/controller.js:105`) both promise a `PIXI.Renderer`. Either return `this._app.renderer` or fix the contract — callers doing `renderer.render(...)` / `renderer.extract` break.

### 1.6 Nine-slice borders are silently ignored — `modules/objects/models/nineSlicePlane.js:28`
```js
new PIXI.NineSlicePlane(texture, this.leftWidth, this.topHeight, this.rightWidth, this.bottomHeight)
```
In v8 `NineSlicePlane` is an alias of `NineSliceSprite`, whose constructor takes a **single options object**; when passed a `Texture` it wraps it as `{ texture }` and drops every positional argument (verified in `NineSliceSprite.mjs:10-38`). All four border widths fall back to `texture.defaultBorders` or the 10px default, so template values never apply.
```js
this._baseObject = new PIXI.NineSliceSprite({
    texture,
    leftWidth: this.leftWidth, topHeight: this.topHeight,
    rightWidth: this.rightWidth, bottomHeight: this.bottomHeight
});
```

### 1.7 `cacheAsBitmap` proxy mapping targets a method — `modules/objects/proxy.js:293`
`'cacheAsBitmap': 'cacheAsTexture'` assigns to `cacheAsTexture`, which in v8 is a **function** on `cacheAsTextureMixin`, not a property. Setting it replaces the method and never enables caching. Route it through `modifyValue`/a custom function calling `target._baseObject.cacheAsTexture(bool)`.

### 1.8 `baseModel.transform` getter returns `undefined` — `modules/objects/baseModel.js:79-81`
`Container.transform` was removed in v8 (no `get transform` in `Container.mjs`). Expose `localTransform` / `worldTransform`, or drop the getter.

### 1.9 Bare type selectors are documented but unimplemented — and they throw
README §8 and §22.2 document "no modifier ⇒ search by object type". It does not exist:
- `modules/objects/selector.js:110-114` — `matchExpr` only has `id` (`#`), `name` (`^`) and `class` (`.`).
- `modules/objects/cache.js:9-13` — the index has only `ids`, `names`, `classes`. There is no `getType`.

A bare selector falls through `_parseSelectorPart`, which returns `false` (line 131). `parse()` logs an error but **still pushes `false` into the array** (line 97), then `find.js:19-22` does `selectorsPartsParsed[last][0]` → `undefined` → `lastRule.type` throws `TypeError: Cannot read properties of undefined`.
Fix: either implement a `types` index in `objects/cache.js` and a bare-word branch in `matchExpr`, or remove the claim from the README and make `parse()` return early on an unparseable part instead of pushing `false`.

### 1.10 Asset-load errors are unhandled and never retried — `lib/loader.js:128-172`
`_onError` (line 203) holds the retry logic but nothing is wired to it — `onError`/`onProgress` registration is commented out at lines 176-177, and `await Promise.all(assetsLoading)` has no `try/catch`. A single failed asset rejects the promise, `callback()` is never reached, and the scene hangs on the loading screen with an unhandled rejection. `_lastLoadFailed` and the `currentIteration` guard (line 122) are now write-only.

### 1.11 Load progress never updates — `lib/loader.js:175-177`
`_onLoadUpdate` is stored via `setOnLoadUpdate` (`assets/service.js:157`) but only ever called from the commented-out block. `MODULES_ASSETS_LOAD_PROGRESS`, `Model.loadUpdate`, and the `Loader` component's bar get nothing between 0 and completion.
v8 fix: use the batch form, which takes a progress callback — `await PIXI.Assets.load(aliasArray, p => this._onLoadUpdate({ progress: p * 100 }))` — instead of mapping each asset to its own `Assets.load`.

### 1.12 Loader state is never reset — `lib/loader.js:116`, `184-185`
`_isRunning = true` is set but only cleared in `_onError`; `_assetsQuery` is never emptied. Today this is masked because `Lib.Loader` is **not** a singleton, so `assets/service.js` gets a fresh instance per group. But the `Urso.loader` singleton handed out in `app.js:56` is permanently "running" after first use and `isRunning()` (line 14) is unusable. Decide whether the loader is per-batch or shared, then reset both fields on the success path.

---

## 2. Lazy load by groups — needs to be finished

The mechanism is *scaffolded* but not usable. `Urso.assets.loadGroup()` and `_startLazyLoad()` exist and the README documents the feature (§13), but four separate defects mean lazy groups only ever work for the first scene, and any misconfiguration silently deadlocks the load chain instead of erroring.

### 2.1 Lazy loading only ever runs once, for the first scene — `assets/service.js:11, 443-449`
```js
_startLazyLoad() {
    if (this.lazyLoadProcessStarted)
        return;
    this.lazyLoadProcessStarted = true;
    this._continueLazyLoad();
}
```
`lazyLoadProcessStarted` is set once and **never reset**. `startLoad()` (line 65) calls `_startLazyLoad()` after each scene's initial preload, so scene 1 runs the lazy chain and every later scene skips it entirely. Any asset a later scene tags with a `loadingGroup` is registered into `this.assets[group]` and then never loaded.
Fix: reset the flag when the lazy chain completes (at the `MODULES_ASSETS_LAZYLOAD_FINISHED` emit, line 462), so each scene can start a fresh pass over whatever groups are now pending. Guard against re-entrancy while a pass is in flight rather than for the process lifetime.

### 2.2 A missing group deadlocks the chain instead of skipping — `assets/service.js:77-83`, `455-469`
```js
loadGroup(assetsSpace, group, callback = () => { }, updateCallback = () => { }) {
    if (!assetsSpace) assetsSpace = this.assets;
    if (!assetsSpace[group])
        return Urso.logger.error('ModulesAssetsService group error, no assets:' + group + ...);
```
The error path **returns without calling `callback`**. `_continueLazyLoad` chains each step through that callback (`this.loadGroup(null, groupName, () => this._continueLazyLoad(step + 1))`), so the first group in `config.lazyLoadGroups` that has no registered assets stops the chain dead — every later group is skipped and `MODULES_ASSETS_LAZYLOAD_FINISHED` never fires. This is the normal case, not an edge case: a config typically lists all groups the game will ever use, while the current scene only populates some.
Fix: treat "group not registered" as an empty group — `if (!assetsSpace[group]) return callback();` — and reserve the error for a group name absent from `Config.loadingGroups`.

### 2.3 The public `Urso.assets.loadGroup(name, cb)` hangs on the same path — `assets/controller.js:46-48`
Same root cause as 2.2. A game calling `Urso.assets.loadGroup('bonus', () => this._showBonus())` for a group that has no assets yet gets an error in the console and a callback that never fires. There is also no way to ask whether a group is already loaded, so callers cannot defend against it.
Add to the controller: `isGroupLoaded(name)`, `isGroupLoading(name)`, and make `loadGroup` idempotent (calling it twice for the same group should call both callbacks once loading finishes, not start a second load).

### 2.4 No promise API
Everything is callback-only. `preload`, `loadGroup` and `_continueLazyLoad` all take `callback`/`updateCallback`. Since `lib/loader.js:108` is already `async` and awaits `Assets.load`, returning promises costs nothing and makes lazy loading composable:
```js
await Urso.assets.loadGroup('bonus');
```
Keep the callbacks for compatibility; return a promise as well.

### 2.5 `this.assets` mixes two incompatible shapes and leaks — `assets/service.js:118-122`, `418-437`
`_createNewAssetsSpace()` stores a per-preload space at a numeric key:
```js
this.assets[this._loadCounter] = {};   // { 0: [ ...initial models... ] }
```
while `_addAsset` stores lazy groups as flat arrays at string keys:
```js
this.assets[model.loadingGroup].push(model);   // [ ...models... ]
```
So `this.assets` is simultaneously a map of preload-spaces and a map of group-arrays, distinguished only by key type. `_processLoadedAssets` does `delete assetsSpace[group]`, which removes the inner group but leaves the numeric space `{}` behind — one empty object leaked per `preload()` call, forever.
Fix: split into two fields (`this._preloadSpaces` and `this._groups`), or drop the numeric spaces entirely and key everything by group name with `initial` as a normal group. This also removes the `initial: 0` numeric/string ambiguity in `assets/config.js:23`.

### 2.6 Groups cannot be unloaded
There is no `unloadGroup(name)`. Once a group is loaded, its textures stay in `Urso.cache.assetsList` for the process lifetime, and `_addedAssetsCache` (`assets/service.js:10`, `364-370`) permanently records the key so the asset can never be re-registered. For a game that lazy-loads a bonus round and then returns to base game, memory only grows.
Needs: `Urso.assets.unloadGroup(name)` that calls `PIXI.Assets.unload(...)`, drops the entries from `Urso.cache`, and removes the keys from `_addedAssetsCache` so the group can be loaded again.

### 2.7 `placeHolder` is parsed and ignored — `assets/baseModel.js:17`
```js
this.placeHolder = Urso.helper.recursiveGet('placeHolder', params, false); //placeHolder assets model //TODO
```
The whole point of lazy loading is that an object can exist before its real texture arrives. Nothing reads this field: an `IMAGE` whose asset is in a lazy group fails at creation with `no image with key` (`objects/models/image.js`). Implement it — resolve to the placeholder texture at create time, then swap when `MODULES_ASSETS_GROUP_LOADED` fires for that group.

### 2.8 No worked example and no default groups
`assets/config.js:20-33` ships `loadingGroups = { initial: 0 }` with the group examples commented out, and `lazyLoadGroups = []`. A game must override `Modules.Assets.Config` under its own `Urso.App` namespace, but nothing in `src/app/` shows how, and the README (§13) only describes it prose-side. Add a commented `src/app/modules/assets/config.js` stub plus a scene template that tags an asset with `loadingGroup`, so the merge-through-`extendingChain` path is demonstrated once.

**Suggested shape for the fix**, in order: 2.5 (data model) → 2.2/2.3 (never deadlock, add `isGroupLoaded`) → 2.1 (per-scene passes) → 2.4 (promises) → 2.6 (unload) → 2.7 (placeholders) → 2.8 (example).

---

## 3. PixiJS v8 migration debt

Graphics' v7 methods still exist in 8.10.2 **as deprecated shims** (verified at `Graphics.mjs:760`), so these work but log a deprecation warning on every construction and will break on the next major.

| File | Lines | v7 call | v8 replacement |
|---|---|---|---|
| `objects/models/graphics.js` | 25-33 | `beginFill` / `drawPolygon` / `drawRect` / `endFill` | `.poly(...)` / `.rect(...)` then `.fill({ color })` |
| `objects/models/mask.js` | 21-36 | `lineStyle(0)` / `beginFill` / `drawRect` / `endFill` | `.rect(...).fill(0xffffff)` |
| `objects/models/checkbox.js` | 71-79 | `beginFill` / `drawPolygon` / `drawRect` / `endFill` | same as above |
| `objects/models/hitArea.js` | 62-65 | `lineStyle` / `beginFill` / `drawRect` / `endFill` | `.rect(0,0,w,h).fill(0xffffff)` |

**`buttonMode` is fully removed in v8** — it exists nowhere in the package (grepped), so these are silent no-ops and the pointer cursor never appears:

- `objects/models/toggle.js:60, 70, 79`
- `objects/models/checkbox.js:47`
- `objects/models/slider.js:142`

Replace with `cursor = 'pointer'` (and `''` to clear). `button.js:78-79` and `hitArea.js:69-70` were already migrated to `eventMode`/`cursor` — bring the other four in line. `interactive = true/false` still works (it aliases `eventMode = 'static'/'passive'`), but prefer the explicit form.

**Other items:**

- `objects/models/hitArea.js:67` — `cacheAsBitmap = true` is deprecated since 8.6.0 (`cacheAsTextureMixin.mjs:19-25`). It is also pointless here: the object is an `alpha = 0` interactive rectangle, so caching it to a texture buys nothing. Remove rather than port.
- `objects/baseModel.js:50` — `blendMode` defaults to numeric `1` (v5 `BLEND_MODES.ADD`). v8 blend modes are **strings** (`'normal' | 'add' | 'multiply' | …`). Inert today because `_updateCommonProperties` only pushes keys present in the template, but any template passing a number yields an invalid blend mode. Change the default to `'normal'` and document string values.
- `objects/proxy.js:263` — `'action': 'events.onInputUp._bindings.0._listener'` is a Pixi v4/v5 signal path that cannot resolve in v8. Dead mapping.
- `objects/proxy.js:95-99` — the `text` update hook is commented out (`updateText` is gone). v8 `Text` updates automatically on `.text` assignment; confirm and delete the comment rather than leaving an open FIXME.
- `assets/models/sound.js:9-13` — `params: { loadType: 1, xhrType: 'blob' }` are v5 `PIXI.Loader` options that v8 `Assets` ignores. Dead config; actual loading is done by the custom `SoundAsset` LoadParser in `extra/main.js`.
- `lib/loader.js:125` — `defaultQueryString` anticache is commented out, so `config.appVersion` does nothing despite being documented as an anticache mechanism. v8 equivalent: `Assets.init({ defaultSearchParams: { appVersion } })`.
- `pixiWrapper.js:207-214` — `_setPixiSettings()` is never called and its body targets the removed `PIXI.settings`. v8 equivalents: `TextureSource.defaultOptions.scaleMode`, `AbstractRenderer.defaultOptions.resolution`. Reimplement or delete.
- `pixiWrapper.js:224-236` — `_requestAnimFrame` is dead code now that `app.ticker` drives the loop.
- `extra/pixiPatch.js` — the whole file targets v6/v7 internals (`PIXI.Text.prototype.drawLetterSpacing`, `PIXI.Container.prototype.renderAdvanced`, `PIXI.MeshMaterial`), none of which exist in v8. Correctly disabled at `config/load.js:27` and `:186`. **But the feature it provided is still advertised**: `fillCustomColors` is parsed in `objects/models/text.js:27`, assigned at `:100-101`, and mapped in `proxy.js:279` — per-character text coloring is now a silent no-op. Reimplement on v8 (`SplitText`, or per-character `Text` objects) or remove the parameter and its docs.

---

## 4. Asset and cache layer

### 4.1 `addContainer` / `getContainer` crash — `lib/cache.js:7-19, 167, 220`
`assetsList` is initialised with `atlas, binary, bitmapFont, file, image, json, jsonAtlas, sound, spine, spineAtlas, texture` — **there is no `container` key**. `addContainer` (line 167) does `this.assetsList['container'][key] = data` → `TypeError: Cannot set properties of undefined`; `getContainer` (line 220) throws the same way on read. `lib/loader.js:66` calls `addContainer` for `Urso.types.assets.CONTAINER`.
Currently unreachable only because containers have `contents` and no `path`, so `_addAssetToLoader` (`assets/service.js:560-567`) skips them. Add the `container: {}` key regardless — it is a latent crash one config change away.

### 4.2 The "already loaded" skip never matches — `assets/service.js:163`
```js
if (!Urso.cache.getFile(assetModel.path))
```
`getFile` reads `assetsList.file`, which is only ever written by `addFile(asset.key, …)` (`lib/loader.js:70`) and only for `FONT` and `HTML` types. Checking it by `path` can never hit. The skip is dead, so every re-display re-queues every asset; only `_addedAssetsCache` in `_addAsset` prevents duplicate work, and that lives at a different layer.

### 4.3 `Urso.cache.getJson()` returns two different shapes
- Normal load (`lib/loader.js:76`): `addJson(key, resource)` where `resource` is what `Assets.load` returns — the **parsed object**.
- Extracted from a JSONATLAS (`lib/loader.js:135`): `addJson(key, { data: jsonData })` — **wrapped**.

Consumers cannot tell which they got. `modules/i18n/controller.js:29` assigns the result straight to `#vocabulary` and indexes it by locale id, so a locale delivered via JSONATLAS silently returns every key untranslated. Pick one shape.

### 4.4 `addTexture` mangles keys containing dots — `lib/cache.js:187-194`
```js
if (key.includes('.')) {
    const keySplit = key.split('.');
    key = keySplit.splice(0, keySplit.length - 1).join('.')
}
```
Intended to strip a file extension, but it strips the last dot-segment from *any* key. A frame named `ui.button.normal` becomes `ui.button`. Combined with `_setDataToAssetsList` (line 143), which warns about a duplicate key and then **overwrites anyway**, two frames from different atlases collapse onto one entry with only a console warning. README §24.5 already flags atlas name intersections as a hazard; the cache should namespace instead (the `addFolderPathInAtlasTextureKey` option that would do this is commented out — see 4.6).

### 4.5 `_processLoadedAtlases` returns where it means continue — `assets/service.js:215`
```js
for (let assetModel of atlases) {
    …
    if (!assetModel.cacheTextures) return;   // aborts the whole method
```
`cacheTextures` defaults to `false` (`assets/models/atlas.js:15`), so the first ordinary atlas in a group aborts texture registration for **every atlas after it** — an atlas that does set `cacheTextures: true` is silently skipped depending on declaration order. Should be `continue`.

### 4.6 Other asset-pipeline gaps
- `lib/loader.js:141-145` — the `ATLAS`-sourced-from-`JSONATLAS` branch is commented out, so such an atlas is skipped entirely (the `map` callback `return`s without loading).
- `assets/service.js:218-231` — `addFolderPathInAtlasTextureKey` (`assets/config.js:6`) is commented out, so the option does nothing. This is the fix for 4.4.
- `assets/service.js:241-256` — `_processLoadedAssets` no longer post-processes `IMAGE` (resolution), `BITMAPFONT` or `FONT`; only `SPINEATLAS` survives. v8's `Assets` handles web fonts and bitmap fonts natively — verify and delete the dead branches, or reimplement.
- `assets/service.js:135-141` — `preloadAllImagesInGPU()` has an empty body. Implement with v8's `renderer.prepare` (needs `import 'pixi.js/prepare'`) or remove the method and its controller passthrough.
- `assets/service.js:339` — texture resolution is never applied (`//TODO change resolution of base texture`), so `qualityFactors` (`assets/config.js:11-15`) picks *which file* is fetched but not how it renders — HD assets draw at the wrong size.
- `assets/service.js:166`, `lib/loader.js:151-162` — the `noAtlasSpine` / global-atlas metadata path is half-disabled and self-labelled `FIXME remove noAtlasSpine`.
- `lib/cache.js:22-31, 154-157` — `addAtlas` calls `clearGlobalAtlas()` on every atlas, and the `globalAtlas` getter rebuilds the entire `spine.TextureAtlas` from scratch on next access, re-walking every spine skin and attachment via `_getMeshFrameNames()`. Loading N atlases and reading the global atlas between them is O(N²). Given the recent commits (`global atlas update`, `fixed uv for spine issue`) this area is already fragile — worth a rebuild-once-after-batch flag.

---

## 5. Correctness bugs in modules and components

### 5.1 Styles use a falsy check where they mean "is defined" — `objects/styles.js:193`
```js
_restoreValueByKey(key, object, globalResetFlag) {
    if (object._originalModel[key])   // falsy, not `typeof === 'undefined'`
        return;
```
`_apply` (line 107) correctly uses `typeof object._originalModel[key] === 'undefined'`. Here the falsy test means an object whose template sets `alpha: 0`, `x: 0`, `y: 0` or `visible: false` is treated as *not* having its own value, so restoring styles overwrites the explicit `0`/`false` with the style default. Make both checks identical.

### 5.2 `loadAndSetLocale` loads twice when already cached — `modules/i18n/controller.js:39-53`
```js
if (jsonResource) {
    this.setLocale(localeKey);     // no return
}
if (pathToLocaleJson) { … }        // falls through and loads again
```
The cached branch does not return, so an already-loaded locale is set, then re-fetched, then set again — two `MODULES_I18N_NEW_LOCALE_WAS_SET` emissions and a redundant network round-trip. Add the `return`.

### 5.3 Loader component scales the mask by a percentage — `components/loader/controller.js:21-26`
```js
this.loaderBgMask._baseObject.scale.x = val;
```
`val` arrives as 0-100 (`assets/service.js:157` does `updateCallback(Math.floor(params.progress))`), so the mask is scaled up to 100× instead of 0-1. Should be `val / 100`. Masked today only because the component's template objects are entirely commented out (`components/loader/template.js:16-77`).

Also in that file: the three getters (`loadAmountText`, `loaderBg`, `loaderBgMask`) each run a **global** `Urso.findOne` on every access, and `setLoadProgress` touches all of them plus `componentCreated` — six world-wide selector searches per progress tick. Cache the references in `create()`. They should also use `this.common.findOne` (component scope), which is what the README tells component authors to do.

### 5.4 `fullscreen/controller.js:49` — `_isPortrait` is inverted and returns the wrong type
```js
get _isPortrait() {
    return innerWidth > innerHeight ? Urso.device.ScreenOrientation.PORTRAIT : ...LANDSCAPE;
}
```
Width greater than height is landscape, not portrait. It also returns an orientation constant from a getter that every sibling treats as a boolean. The three other copies are correct and consistent — `fullscreen/ios.js:74`, `fullscreen/android.js:51`, `deviceRotate/controller.js:58` all use `this._orientation === ScreenOrientation.PORTRAIT`. This copy appears unused, which is the only reason it hasn't bitten; delete it or fix it.

While there: `_isPortrait`, `_showOnLandscape` and `_showOnPortrait` are duplicated across four files, and two of them read different sources — `fullscreen/controller.js:41-46` reads `ResolutionsConfig.contents`, `fullscreen/ios.js:82-87` reads `ResolutionsConfig._orientations` (a private field, from outside the class). Consolidate into one helper.

### 5.5 Transport is unreachable through config — `modules/transport/*`
- `config.useTransport` (`config/main.js:10`) is declared and documented in README §19.2 but **referenced nowhere else in `src/`**. `Urso.transport.init()` is never called by the engine, and nothing tells a game it must call it.
- `modules/transport/controller.js:2-9` — `_service` is `null` until `init()`, so every handler setter (`setOnConnectionHandler`, `setResponseHandler`, …) throws if called first. Either construct the service in the constructor or guard the setters.
- The controller has no `singleton = true`, unlike every other module controller.
- `modules/transport/config.js:9` — `host: Urso.helper.parseGetParams('wsHost')`. The host can *only* come from a URL query param; there is no static configuration path, and an absent param yields `undefined`.
- `modules/transport/service.js:125` — `// TODO : SET VALIDATION MODELS`; messages are unvalidated.
- `modules/transport/connectionTypes/websocket.js:24` — reconnect uses a raw `setTimeout` instead of `Urso.setTimeout`, so it ignores `timeScale` and the engine's timer management.

### 5.6 `deviceRotate` needs CSS the engine does not ship — `components/deviceRotate/controller.js:26-44`
`_createDom` builds a div with classes `fullscreen`, `device-rotate` and `fullscreen-info`, and loads `${Urso.config.gamePath}assets/images/fullscreen/rotate.png`. Neither the stylesheet nor the image exists in this repo, so the overlay is unstyled (and effectively invisible) unless the game supplies both. Document the contract, or ship a minimal injected style.

### 5.7 Smaller items
- `components/soundInitialPopup/controller.js:38` subscribes to the string literal `'components.soundInitialPopup.pointerAction.popupButton'`, which is not in `Urso.events`. Every other component uses a constant. The tint `0xd4be69` at line 20 is likewise hardcoded.
- `modules/objects/propertyAdapter.js:268` — `Math.atan(xCatet / yCatet)` carries `//todo or yCatet/xCatet ?`. This is an unresolved correctness question in the alignment math; worth a test rather than a comment.
- `modules/objects/propertyAdapter.js:306` — `// TODO: CHECK SCALE CAN BE NEGATIVE`; negative `scaleY` is currently rejected, which breaks flipped sprites.
- `modules/objects/styles.js:34` — style resolution ignores the parent (`//todo consider parent`), so CSS-like inheritance is not implemented despite the CSS analogy in the docs.
- `modules/objects/styles.js:7-8` — the `Styles` singleton constructs a real `Models.Text` (and therefore a `PIXI.Text`) at startup purely to read defaults, and holds it forever.
- `modules/objects/service.js:173, 186, 222` — `Urso.objects.refreshStyles()` is called with no argument on every add/remove/destroy, re-walking the whole world. Self-labelled `//todo optimization`; a likely hot spot on object-heavy scenes.
- `modules/scenes/resolutions.js:13` — `//TODO optimization (performance)` on the resize path.
- `lib/tween.js:251` — tweens are never garbage collected; `this._tweens` grows unbounded. Real leak on long sessions.
- `lib/logger.js:23` — log level is not switched by `config.mode`, so production builds keep full logging.
- `modules/statesManager/action.js:28-30` — leftover random-timeout debug scaffolding in a comment; delete.

---

## 6. Unfinished features

### 6.1 Object types with no model — `modules/template/types.js`
Exported in `Urso.types.objects` and dispatched in `objects/service.js`, but the model classes do not exist. `getInstance` returns `false`, so creation fails with `ModulesObjectsCreate model type error` (`objects/service.js:126`):

| Type | Dispatch | Status |
|---|---|---|
| `ATLASIMAGE` | `objects/service.js:92-94` | case commented out; `Models.AtlasImage` missing |
| `DRAGCONTAINER` | `objects/service.js:98` | `Models.DragContainer` missing |
| `EMITTER` | no case → `default` → `Models.Emitter` | missing; only `EMITTERFX` is implemented |
| `SCROLLBOX` | no case → `default` → `Models.Scrollbox` | missing |
| `TEXTINPUT` | `objects/service.js:113` | `Models.TextInput` missing |

`propertyAdapter.js` already references `DRAGCONTAINER`, `EMITTER`, `SCROLLBOX` and `TEXTINPUT`, so the intent was to ship them. Decide per type: implement, or remove from `types.js` so templates fail at parse time with a clear message instead of at creation.

### 6.2 Editor component — `components/editor/api.js`
`addStyle()` (`:9-11`) and `editObject(id, key, value)` (`:75`) are empty. `_assetsKeys` is missing `AUDIOSPRITE`, `HTML`, `JSONATLAS`, `SOUND`, `SPINEATLAS`; `_objectsKeys` covers 6 of 25 object types. Either finish or mark the component experimental.

### 6.3 Other unfinished
- `objects/baseModel.js:57` — `append: false` ("object will not created") is parsed but never checked anywhere. Implement or remove.
- `objects/baseModel.js:84` — `addChildAt(childObject, zIndex, …)` ignores `zIndex` and just calls `addChild`. Honour it (`zIndex` + `sortableChildren`) or drop the parameter.
- `objects/models/toggle.js:82-86`, `objects/models/button.js:100-104` — `pixelPerfectOver` / `pixelPerfectClick` parse into empty `//todo` blocks; both options are silently ignored.
- `components/debug/controller.js:8` — `renderStats` and `resolution` debug panels are commented out of the list.
- `components/base/controller.js:43` — `loadUpdate()` is an empty `//todo` on the base component, yet it is called for every component on every progress tick.
- `modules/scenes/service.js:60` — `addObject` returns `null` for objects created before assets resolve, with `//todo Maybe we can return a promise`. Callers cannot tell success from "not yet".

---

## 7. Core ships game-specific config

Three Core files ship a specific game's configuration as the engine default. Because `extendingChain` merges `Urso.App` **over** `Urso.Core`, a game that forgets to override one inherits nonsense rather than an empty default.

- `modules/statesManager/configStates.js:6-68` — ships a full slot-machine state graph (`START_GAME`, `SPIN_START`, `WINLINES_ANIMATE_ALL`, `GAMBLE`, `UPDATE_BALANCE`, `PICK_GAME1/2`) referencing actions (`serverSpinRequest`, `slotMachineSpinStart`, `showWinlinesAnimationAll`) that exist nowhere in Core. Meanwhile `Modules.StatesManager.Actions` in `config/load.js` is an empty `{ //put your custom actions here }`, so `Urso.statesManager.start()` on a fresh game walks states whose actions cannot resolve. This belongs in `urso-slot-base`; Core should default to an empty or single-state config.
- `components/layersSwitcher/config.js:6-22` — ships `^granny`, `^bonusPopup`, `.baseGame`, `.bonusGame` as the real `allLayers` / `groupsLayers`. Also note `.backround` is a **typo** for `.background`, repeated in both fields (self-consistent, but it contradicts the README §15 example which spells it correctly).
- `modules/i18n/config.js:9-13` — ships `de`/`en`/`ru` paths as real defaults.

In all three cases the comment says "example" but the value is live.

---

## 8. Configuration and integration

- **`config.gameContainerSelector` is undocumented and undefined** — read at `pixiWrapper.js:48` but absent from `config/main.js`. `document.querySelector(undefined)` stringifies to the selector `"undefined"`, returns `null`, and silently falls back to `document.body`. Add it to `ConfigMain` with a default.
- **Resolution is hardcoded to 1** — `pixiWrapper.js:50-52` passes `resolution: 1` and never sets `autoDensity`, so the canvas renders at 1× on high-DPI displays and ignores `Urso.device.getPixelRatio()`. This also makes the commented-out `resizeTo: parent` (line 49) moot. Expected v8 setup: `resolution: window.devicePixelRatio, autoDensity: true`.
- **Devtools hook ships to production** — `window.__PIXI_APP__ = app` at `pixiWrapper.js:43`. Gate on `Urso.config.mode !== 'production'`.
- **Empty interval on tab hide** — `pixiWrapper.js:358-364` installs a 16 ms `setInterval` whose body is entirely commented out. It burns a timer while the tab is hidden and does not provide the "reserve loop" its own JSDoc promises. Restore `this._update()` inside it or remove the handler.
- **`init()` ordering** — `_root` and `_createWorld()` run before `await app.init()` (`:42-53`). It works, but the world is built against a renderer that does not exist yet; moving them after `init()` makes failure modes clearer.
- **Globals** — `extra/main.js` assigns `window.PIXI`, `window.gsap` and `window.UrsoUtils`. Every engine file depends on the `PIXI` global rather than importing, which is why `extra/main.js` must load first. `soundManager/controller.js:18` reaches for `UrsoUtils.Howler` the same way. Document the load-order contract explicitly, or move to real imports.

---

## 9. Build and packaging

- **`vite.config.js:14` — `sourcemap` is nested inside `build.lib`, where Vite ignores it.** It belongs at `build.sourcemap`. No source maps are produced despite the intent.
- **`vite.config.js:5` — `minify: false` on the production build.** `build:prod` emits a 3.2 MB unminified `build/js/index.js`.
- **`vite.config.js:17` — `external: []` bundles every dependency.** `pixi.js`, `gsap`, `howler`, `@esotericsoftware/spine-pixi-v8` and `@urso/revolt-fx` are declared as `dependencies` but inlined. A consumer that also uses PixiJS gets two copies, and the `instanceof spine.*` checks in `objects/models/spine.js:2` and `lib/cache.js:1` fail across them. Externalize, or move to `peerDependencies`.
- **`package.json`** — `main` points at `build/js/index.js`, which is gitignored (`.gitignore:15`), and there is no `prepublishOnly`/`prepare` script, so `npm publish` from a clean checkout ships an empty package. Also missing `exports`, `files`, and `types`. `.npmignore` does not exclude `src/` or `docs/`.
- **No tests, linter, or formatter.** No `test` script, no ESLint/Prettier config. Given how much of this engine is string-path indirection through `modules/instances/controller.js`, a smoke test that instantiates every path registered in `config/load.js` would have caught §6.1 immediately, and one that displays a scene with a real atlas would have caught most of §2 and §4.
- **`index.html:6`** — page title is still `Document`. `app.js:78` sets `document.title` from `config.title` at runtime, so this only shows pre-boot, but it is a one-word fix.
- **`README.md:63-66` documents `yarn start` / `npm run start`,** which do not exist — the script is `dev`. `README.bak.md` is also still checked in.

---

## 10. Suggested order

1. **§1.10-1.12 and §4** — the loader and asset/cache layer. Nothing else can be tested with real content until assets load, report progress, and fail loudly. §4.1 and §4.5 are one-line fixes.
2. **§2 lazy load by groups** — sits directly on top of §1/§4 and is the feature you want. Do 2.5 (data model) first; 2.2 and 2.3 are small and stop the silent deadlocks.
3. **§1.1-1.5 pixiWrapper** — small, self-contained, restores documented public API (`pause`, `generateTexture`, `getMouseCoords`, FPS limiting).
4. **§3 Graphics / `buttonMode` sweep** — mechanical, clears the deprecation warnings, fixes the missing pointer cursor on toggle/checkbox/slider.
5. **§1.6, §1.7, §1.9, §5.1, §5.2, §5.3** — silently-wrong behaviour with cheap fixes.
6. **§6.1 and §7** — decide implement-vs-remove for the five phantom object types, and empty out the slot-game config from Core, before anyone writes against either.
7. **§9 build config** — before the next publish.
