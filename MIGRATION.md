# Migration Guide

This document describes breaking changes and new APIs introduced in this version of Urso. Games upgrading to this version should review these changes before updating.

## Breaking Changes

### getRenderer() now returns the Renderer, not the Application

`Urso.scenes.getRenderer()` previously returned the Pixi `Application` despite its documentation promising a `Renderer`. It now correctly returns `app.renderer`.

If your code needs the `Application` object, use the new `Urso.scenes.getApp()` method instead.

```js
// Before: worked but was undocumented
const app = Urso.scenes.getRenderer();

// After: correct method for Renderer
const renderer = Urso.scenes.getRenderer();

// New: for Application
const app = Urso.scenes.getApp();
```

### Built library no longer runs from a plain `<script>` tag

The build output (`build/js/index.js`) now carries bare imports for `pixi.js`, `gsap`, `howler`, and `@esotericsoftware/spine-pixi-v8`. Consuming applications must use a bundler or import map to resolve these dependencies, rather than loading the library with a plain `<script>` tag.

**Upside:** This eliminates duplicate copies of Pixi in your application and fixes `instanceof` checks in the Spine runtime, which depend on a single shared instance of the library.

### Five object types removed

The following object types were removed from `Urso.types.objects` because they had no model class implementation; using them always failed:

- `ATLASIMAGE` — use `IMAGE` instead
- `DRAGCONTAINER` — no replacement available
- `EMITTER` — use `EMITTERFX` instead
- `SCROLLBOX` — no replacement available
- `TEXTINPUT` — no replacement available

A template that still references one of these does NOT fail silently and is not skipped: the object
is not created, and the engine logs `ModulesObjectsCreate unknown object type: ...` naming the
offending value and the removed constants. This holds both for a template written against the
constant (which now evaluates to `undefined`) and for a serialised template that hardcoded the old
numeric id. Search your templates for these five names before upgrading.

The numeric ids of the SURVIVING types are deliberately unchanged and the gaps are not reused. That
is not for the removed types' benefit — it protects everything else. `objects/service.js` builds a
reverse lookup over `Urso.types.objects` and uses it for both the default dispatch branch and the
type-selector index, so renumbering would silently remap every remaining object type.

### fillCustomColors property removed from TEXT objects

The `fillCustomColors` property on TEXT objects has been removed. It produced no visual effect since the Pixi v8 migration because it relied on v6/v7 internals that no longer exist.

Gradient fills remain fully supported and work as before—use `fill` as an array of colors, and optionally configure `fillGradientType` and `fillGradientStops`.

```js
// Still works: gradient fills
{
  type: Urso.types.objects.TEXT,
  fill: ['#ffffff', '#00ff99'],
  fillGradientType: 'horizontal',
  fillGradientStops: [0, 1]
}
```

### Extra.PixiPatch namespace removed

The `Extra.PixiPatch` namespace entry and `src/js/extra/pixiPatch.js` have been removed. This was a Pixi v6/v7 compatibility shim.

### preloadAllImagesInGPU removed from Urso.assets

`Urso.assets.preloadAllImagesInGPU()` has been removed. This method was an empty stub that never did anything.

If you need to preload GPU resources, use the Pixi v8 renderer's `prepare` plugin instead. Import it and call it on the renderer obtained from `Urso.scenes.getRenderer()`:

```js
import 'pixi.js/prepare';

const renderer = Urso.scenes.getRenderer();
const sprites = [/* create sprites */];
renderer.prepare.upload(sprites);
```

## New Features

### Asset group runtime API

`Urso.assets` now exposes methods to query and control lazy-loaded asset groups at runtime:

- `loadGroup(name, callback, updateCallback)` — load a group and receive a promise; callback signature is unchanged
- `isGroupLoaded(name)` — returns `true` if the group has finished loading
- `isGroupLoading(name)` — returns `true` if the group is currently loading
- `getPlaceholderKey(assetKey)` — returns the placeholder asset key for a lazy-loaded asset, or `false` if none is configured
- `unloadGroup(name)` — unload a group and release GPU resources; returns a promise

These methods allow UI components to show loading states and to free memory by unloading no-longer-needed asset groups.

### Asset placeholder support

Assets can now define a `placeHolder` field that names a stand-in texture shown until the real asset's group arrives. The texture is swapped automatically when the group loads. Placeholders are honoured by all texture-bearing object models: `IMAGE`, `BUTTON`, `TOGGLE`, `IMAGESANIMATION`, and `NINESLICEPLANE`.

```js
{
  assetKey: 'level-background',
  loadingGroup: 'levelAssets',
  placeHolder: 'loading-placeholder'
}
```

### Bare type selectors

Selectors now support bare type names without a prefix. `Urso.find('button')` matches objects of type `BUTTON`.

```js
Urso.find('button');           // every BUTTON object
Urso.findOne('spine');         // the first SPINE object
Urso.findAll('text');          // every TEXT object
Urso.find('button .title');    // objects with class 'title' that sit UNDER a button
```

Note the last form: a combined selector is matched against its LAST part and then walks up the
parents, so it returns the descendants, not the ancestor. The available type names are the lower-cased
keys of `Urso.types.objects` — `bitmaptext`, `button`, `buttoncomposite`, `checkbox`, `collection`,
`component`, `container`, `emitterfx`, `graphics`, `group`, `hitarea`, `image`, `imagesanimation`,
`mask`, `ninesliceplane`, `slider`, `spine`, `text`, `toggle`, `world`.

This was documented in the README but unimplemented and throwing errors before this release.

### New object properties through template/proxy

Objects now support four new Pixi v8 properties via the template system:

- `cullable` — enable occlusion culling for this object (requires culling: true in renderer config)
- `cullArea` — pre-computed bounds for culling
- `interactiveChildren` — disable hit-testing recursion into this object's subtree
- `cacheAsBitmap` — now correctly calls Pixi v8's `cacheAsTexture` method (v7's `cacheAsBitmap` is deprecated in v8)

```js
{
  type: Urso.types.objects.CONTAINER,
  cullable: true,
  interactiveChildren: false,
  cacheAsBitmap: true
}
```

### Renderer configuration block

A new `renderer` configuration block in `ConfigMain` exposes Pixi v8 initialization options for hardware profiling and optimization. Every default preserves previous behaviour; nothing is enabled. Opt-in only when profiling on target hardware:

```js
renderer: {
  background: "0x222222",      // canvas background; default black is 0x000000
  antialias: false,            // GPU cost; profile before enabling
  powerPreference: undefined,  // 'high-performance' or 'low-power'; undefined = browser decides
  preference: undefined,       // 'webgl' or 'webgpu'; undefined = Pixi auto-detects
  gcActive: undefined,         // garbage collection enable/disable
  gcMaxUnusedTime: undefined,  // ms before GC; Pixi default 60000
  gcFrequency: undefined,      // ms between GC runs; Pixi default 30000
  culling: false               // enable CullerPlugin; trades CPU for GPU savings
}
```

### gameContainerSelector config

A new `gameContainerSelector` field in `ConfigMain` allows you to specify a CSS selector for the element the canvas should be appended to. If not set or falsy, the canvas is appended to `document.body` as before.

```js
gameContainerSelector: '#game-container'  // append canvas to #game-container
```

### npm test

A test suite is now available via `npm test`, which runs test files for selectors, lazy-load groups, loaders, texture caching, placeholders, and styles.

