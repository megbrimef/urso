# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@urso/core` — an HTML5 game engine (framework) built on PixiJS v8, published as an ES-module library. This repo is the engine itself; `src/app/` holds a minimal demo game used to run the engine locally.

## Commands

```bash
npm install          # or yarn
npm run dev          # vite dev server, serves index.html which imports src/js/index.js
npm run build:prod   # vite lib build -> build/js/index.js (ES only, minify:false)
npm run watch        # build in watch mode
npm run serve        # preview a produced build
```

There is no test suite, linter, or formatter configured. The README's "yarn start" is stale — the dev script is `dev`.

## Architecture

### Global namespace, not ES imports

Engine code never imports its siblings. Everything lives on a `window.Urso` tree and is resolved by **string path** at runtime. ES `import` is used in exactly two places: `src/js/config/load.js` (engine) and `src/app/config/load.js` (game).

`src/js/config/load.js` is the single manual registry: it imports every engine file and hand-writes the `window.Urso.Core.{Components,Config,Extra,Lib,Modules,Templates}` object literal. **Adding a new engine file requires two edits there** — an import line and an entry in the namespace literal. The namespace key path must mirror the directory path (`modules/objects/models/text.js` → `Modules.Objects.Models.Text`), because path resolution depends on it.

### Boot sequence

1. `src/js/index.js` — loads both `load.js` files, sets `Urso.config = Urso.Core.Config.Main`, exposes `Urso.runGame`.
2. `index.html` calls `Urso.runGame` on `window.onload`.
3. `src/js/app.js` `setup()` — merges every namespace named in `Urso.config.extendingChain` (default `['Urso.Core', 'Urso.App']`) into a single `Urso.Game` via `mergeObjectsRecursive`, then instantiates every global singleton (`Urso.helper`, `Urso.observer`, `Urso.assets`, `Urso.objects`, `Urso.scenes`, `Urso.template`, `Urso.statesManager`, …) and calls `App.run()`, which displays `Urso.config.defaultScene`.

**All runtime lookups go through `Urso.Game`, never through `Urso.Core` directly** — that is what lets game code override engine classes by defining the same path under `Urso.App`.

### Instance factory (`modules/instances/controller.js`)

This is the core indirection; read it before changing any resolution behavior.

- `Urso.getInstance('Modules.Observer.Controller', params)` → instance; `Urso.getByPath(...)` → the class.
- Inside any class, `this.getInstance('Service')` resolves a **sibling in the same namespace folder** (derived from the caller's `__path`). This is how controllers reach their own `Service` / `Model` / `Template`.
- `this.singleton = true` in a constructor makes the factory cache and reuse one instance.
- After constructing an instance the factory auto-calls `_subscribe()` and then `_subscribeOnce()` (guarded by `__subscribedOnce`). Singletons return the cached instance without re-running either. Put `this.addListener(...)` calls in `_subscribeOnce`.
- It also injects `addListener` / `removeListener` / `emit` onto every class prototype (thin wrappers over `Urso.observer`).
- **Modes**: `Urso.addInstancesMode('mobile')` etc. (`desktop`/`mobile` are set automatically). A namespace node may carry a `modifications` key (swap the class entirely for a mode) or a `mixins` key (wrap it: `superclass => class extends superclass {...}`). Resolution checks both on the last path segment.

### Templates → assets → objects → components

A scene or group template is a plain class with `styles`, `assets`, and `objects` fields. `objects` is a declarative tree; each node has a `type` from `Urso.types.objects` and optional `contents` children. `styles` are CSS-like classes applied by an object's `class` string.

`Urso.scenes.display(name)`:
1. `Urso.template.scene(name)` resolves `Templates.Scenes.<Name>` through the instance factory.
2. Previous scene's components are destroyed; `Urso.observer.clearAllLocal()` and `setPrefix(name)`.
3. `Urso.template.parse()` walks the tree, expanding `COMPONENT` and `GROUP` nodes (pulling in their nested assets/objects) and collecting the full asset list.
4. Assets preload (`Urso.assets.preload`), driving `loadUpdate` on components.
5. On load complete, `Urso.objects.create(objects)` builds the display tree, then every component's `create()` runs.

Component lifecycle hooks (see `components/base/controller.js`): `assetsMount`, `objectsMount`, `loadUpdate`, `create`, `update(deltaTime)`, `destroy`. Components follow an MVC split — `controller.js` (public API + subscriptions), `service.js` (logic), `view.js`, `template.js`. Only `controller.js` is required. Components must not talk to each other directly; use observer events.

### Objects module

`Urso.objects.create(params, parent)` maps a template node's `type` to `Modules.Objects.Models.*`, which wrap Pixi display objects. `proxy.js` + `propertyAdapter.js` expose engine-level properties (including `transitionDuration`/`transitionProperty` tweened setters) over the Pixi object; `pool.js` recycles pooled types; `cache.js` + `find.js` + `selector.js` back the selector search.

Selectors: `^name`, `.class`, `#id`, bare = object type; space-separated selectors search descendants. `Urso.find/findOne/findAll` search the whole world; `this.common.find/findOne/findAll` inside a component scope only.

### Observer

`fire(event, params, delay)` dispatches twice: the bare event name (global listeners) and the name suffixed with the current scene prefix (local listeners). `add(event, cb, global)` — omitting `global` subscribes locally, so the listener dies with the scene. Prefer local. Event constants live in `modules/observer/events.js` and are exposed as `Urso.events`; naming is `module.domain.action`.

### Other modules worth knowing

- `modules/logic` — "logic blocks" (`main`, `sounds`, plus `getAdditionalLogicBlocks()` overrides). `Urso.logic.do('fnName', ...args)` fans the call out to whichever blocks implement it.
- `modules/statesManager` — declarative state machine; states combine actions via `all` / `race` / `sequence`, each action has `guard` / `run(finishCallback)` / `terminate`. `Components.StateDriven` is the base class for state-reactive components (call `super._subscribeOnce()` when overriding).
- `modules/scenes/resolutionsConfig.js` — virtual canvas size (default 1920×1080 landscape, `adaptive: true`) and per-device stretch limits. `pixiWrapper.js` is the only file that touches the Pixi `Application`/ticker.
- `modules/assets` — quality factors (`medium`/`hd`/`high`), WebP detection, and lazy-load groups (`loadingGroups` / `lazyLoadGroups` in `assets/config.js`); assets without a `loadingGroup` load in the initial preload.
- `lib/composition.js` — multiple inheritance helper (`Urso.Game.Lib.Composition.inherit(A, B)`).

## Conventions

- Private members are `_`-prefixed; the factory's own bookkeeping uses `__` (`__path`, `__entities`).
- Classes are `export default` with a name matching their namespace position (`ModulesObjectsModelsText`), 4-space indent, JSDoc on public methods.
- `Urso.types` and `Urso.events` are only populated after `Template.Controller` / `Observer.Controller` are constructed, so they are not safe to read at module top level — read them inside constructors/methods.
- `src/app/` is the demo game and the reference for how a consuming game is structured; it is not part of the published library entry point in spirit, but `config/load.js` does import it.
