URSO — The HTML5 Game Framework
=============

![ursojs.io logo](https://ursojs.io/img/logo.png)

### Learn more ###
- You can find more information on the [official website](https://ursojs.io/)
- Explore working [examples](https://ursojs.io/examples.html) demos and see the code structure
- Also you can use [slot base game](https://github.com/megbrimef/urso-slot-base) as a slot game engine (slot framework)
- Clone [examples repository](https://github.com/megbrimef/urso-examples) to fast learning
- Join [discord channel](https://discord.gg/JauD9CbDHA) to ask questions and read changelogs

### How to ###
```js
require('@urso/core');
require('./app/config/load'); // your game application

window.onload = Urso.runGame; //run game
```

### Table of Contents ###

1. Getting Started
2. Project Structure
3. Engine Architecture and Launch Process
4. Objects Required for Game Launch
5. Scenes, Scene Sizes, Templates, Components and Simple Objects
6. Component Connection and Organization
7. Object Visibility Order (Layers)
8. Working with Scene Objects (Search, Selectors)
9. Event Routers and Event-Driven Model (Observer)
10. Dynamic Scene Object Creation
11. Working with Classes and Entities
12. Adding Sound and Sound/Event Mapping Configuration
13. LazyLoad Mechanism (Asset Loading Groups)
14. States Manager and Components.StateDriven
15. LayersSwitcher Component
16. Modifications and Mixins
17. Transitions for Objects
18. Game Text Localization
19. Transport
20. Additional Reference Sections
  - 20.1. Core Modules (Lib)
  - 20.2. Additional Information about Templates and Scenes
  - 20.3. Practical Recommendations, Debugging, Profiling
  - 20.4. Examples and API Reference (Compatible Elements)
21. Extra (BrowserEvents, PixiPatch)
22. Types (Urso.types)
23. Events (Urso.events)
24. Practical Patterns and Recommendations
25. Optimization and Debugging
26. FAQ
27. Examples from A to Z
28. API Reference
29. Appendices
30. Code Examples
31. Links

------------------

### 1. Getting Started ###
------------------
After cloning the repository locally, you need to install all game dependencies before launching.

Game dependencies are installed with commands:
- yarn
- npm install

After installing dependencies, to launch the game you need to execute:
- yarn start
- npm run start

### 2. Project Structure ###
--------------------
Game source code and resources are located in:
- src/app — source code (application)
- src/assets — resources (assets)

Each game must include:
- src/app/config/load.js — connection of all modules (js files), as well as game inheritance chain specification.
- src/app/config/main.js — setting important game parameters (name, default scene).
- src/js/index.js — application entry point. Engine code is connected through dependencies, load.js and main.js of the game. Once all engine files are loaded, you need to launch the application using Urso.runGame() function (usually on window.onload).

### 3. Engine Architecture and Launch Process ###
------------------------------------------
The game depends on Core by default.

Core consists of:
- Third-party libraries (Pixi, Howler...).
- Set of interfaces to these libraries.
- Transport module.
- Base components.
- Sound logic and button states.
- Game launch logic (Urso.Core.App).

After game launch begins, Core, going through established dependencies, will create all namespaces, all necessary objects and methods for game operation (see src/js/app.js in Core repository). Then it will call the run method.

Urso.Game assembly occurs based on extendingChain config (ConfigMain)
For example, if we defined game files in App namespace (window.Urso.App) then extendingChain should look as follows:
Urso.config.extendingChain = ['Urso.Core', 'Urso.App'];

Urso.runGame method in turn will begin loading the default scene using the scene manager.

### 4. Objects Required for Game Launch ###
------------------------------------
- Urso.helper — contains a set of helper methods for developer convenience (see src/js/lib/helper.js in Core repository).
- Urso.observer — provides event-driven model operation (see src/js/modules/observer in Core repository).
- Urso.cache — provides work with loaded resources (see src/js/lib/cache.js in Core repository).
- Urso.device — contains a set of methods for getting data from the device on which the game is running (see src/js/lib/device.js in Core repository).
- Urso.loader — wrapper class over standard PIXI resource loader (see src/js/lib/loader.js in Core repository).
- Urso.localData — provides work with local storage inside the game (see src/js/lib/localData.js in Core repository).
- Urso.assets — contains resource loading logic (see src/js/modules/assets in Core repository).
- Urso.logic — contains event router logic (see src/js/modules/logic in Core repository).
- Urso.objects — scene object creation logic (see src/js/modules/objects in Core repository).
- Urso.scenes — scene manager responsible for creating, displaying, scene transitions (see src/js/modules/scenes in Core repository).
- Urso.soundManager — manager for working with sounds (see src/js/modules/soundManager in Core repository).
- Urso.statesManager — manager for working with states (see src/js/modules/statesManager in Core repository).
- Urso.template — templating engine that provides work with templates (see src/js/modules/template in Core repository).
- Urso.browserEvents — browser event translator to game (see src/js/extra/browserEvents.js in Core repository).

### 5. Scenes, Scene Sizes, Templates, Components and Simple Objects ###
----------------------------------------------------------------
Scene — a set of objects that are present on screen and display some specific game state (main menu, loading screen, game level).

Canvas will occupy maximum available space on the page, based on proportions set in ModulesScenesResolutionsConfig, and parent scene container sizes (virtual pixels) will be determined based on ModulesScenesResolutionsConfig parameters.

If adaptive parameter is set to true, then canvas will occupy all available space, and scene sizes will be no less than specified, but one side may be increased to occupy maximum available space on the page. In this case adaptiveConfig starts working. You can set stretching boundaries for each orientation in it.

How the scene should look is described in the scene template (for example src/app/templates/scenes/play.js).

Template — includes descriptions of styles, resources and objects (simple and components) that need to be created.

A separate template group from the list of assets and objects is possible, for example src/app/templates/groups/testGroup.js, and displaying this group on the scene (see src/app/templates/scenes/play.js).

Styles are implemented through classes similar to CSS classes. Adding a class to an object automatically applies properties described in styles to it. You can use parameters for objects in styles and control them.

Assets — all resources in the game (images, text blocks, buttons, etc.). Asset set automatically gets into the loading list. Asset parameters are located (see src/js/modules/assets/baseModel in Core repository). Asset access is performed, for example, by key specified in asset group.

Simple objects — objects such as image, text, container, spine, etc. (see src/js/modules/objects/models in Core repository).

When creating a scene object, the templating engine collects all necessary assets and adds them to loading. After loading completion, scene manager begins creating all objects and components. Once components and objects are created — the scene is displayed on screen.

Built-in Components
- Loader — loading progress display
- Debug — debug metrics
- Fullscreen — fullscreen mode switching
- DeviceRotate — UI management with "wrong" orientation
- StateDriven — base state manager dependent component
- LayersSwitcher, SoundInitialPopup — service/utility (when available)

General best practices for components
- Don't interact between components directly — only through Observer
- Local subscriptions
- Selectors for searching inside component through this.common.find/One/All

### 6. Component Connection and Organization ###
----------------------------------------
To add a component, in src/app/config/load.js you need to specify the path to component name and in the component folder specify all files that need to be loaded into the game.

Example:
- In src/app/config/load.js specify require('../components/_info'); where components — folder name with components.
- _info — file where all js-files of current component are connected.

Components can consist of multiple simple objects, contain different logic, perform actions depending on game events. Component implements MVC-pattern modification, where:
- controller — external interface and event handlers (subscriptions).
- service — logic.
- view — interaction with scene objects.
- template — set of simple objects related to component.

Each component must contain controller; other files are added optionally, depending on the task.

Component interaction rules:
- Components should not independently interact with other components or know about their existence.
- Components can use helper libraries directly, for example, Urso.localData and Urso.helper. Communication with other entities should occur through events (Urso.observer).

Urso.localData — object (cache) where you can write and get parameters for further work:
- Urso.localData.set(key, value) — parameter writing.
- Urso.localData.get(name) — value getting.

### 7. Object Visibility Order (Layers) ###
------------------------------------
All objects have their visibility order — layer on scene. Each object can be behind or in front of another object.

Order is implemented as follows:
- Top object specified in code (in object list, for example on scene) will be behind the object specified below it in the list — i.e., in the background.

### 8. Working with Scene Objects (Search, Selectors) ###
--------------------------------------------------
Tools for working with scene objects (and from console):
- this.common.find — returns false/object/collection (Urso.find('selector') for console access).
- this.common.findOne — returns false/object (Urso.findOne('^name') for console access).
- this.common.findAll('.class') — returns false/collection (Urso.findAll('.class') for console access).

Search area:
- this.common.find() — search inside current component.
- Urso.find() — search at entire game level.

Search modifier — first symbol of passed argument:
- '^' — search by name;
- '.' — search by class;
- '#' — search by identifier (id);
- '' — if not specified, search by object type.

Selector — combination of modifier and searched name. Example: '.logo' will search for objects that have 'logo' in class.

Combined selectors:
- Urso.find('^nameContainer .classText') — search in '^nameContainer' object for objects with 'classText' class at any nesting level.

### 9. Event Routers and Event-Driven Model (Observer) ###
---------------------------------------------------
Event routers, using Urso.observer, control the state of entire game and individual components.

The engine has a set of ready events (see src/js/modules/observer/events.js in Core repository).

Core implements event router:
- Sounds — router controlling sound playback (see src/js/modules/logic/sounds in Core repository).
Similarly, you can organize logic of other entities.

Working with event-driven model is performed by methods:
- this.addListener('event.name', callback, isGlobal) — subscription.
- this.removeListener('event.name', callback, isGlobal) — unsubscription.
- this.emit('event.name', params, delay) — event generation.

Explanations:
- First argument — event name.
- Second — function called when event triggers.
- Third argument isGlobal — interception mode: locally (within current scene) or globally (for all scenes).

Recommendations:
- Perform subscription in _subscribeOnce method (call when creating class instance). Method will be called automatically when creating class using Urso.getInstance(...) class factory.
- At component level subscribe in controller.
- For components it's desirable to use local subscription.

Console access:
- Urso.observer.add — analog of this.addListener.
- Urso.observer.remove — analog of this.removeListener.
- Urso.observer.fire — analog of this.emit.

### 10. Dynamic Scene Object Creation ###
----------------------------------
Objects can be created dynamically (for example, in components).

To create an object call Urso.objects.create with object parameters (first argument) and parent object (second argument, optional). If parent is not passed, object is created in root object (world).

Example:
Urso.objects.create(
  {
    type: Urso.types.objects.IMAGE,
    assetKey: assetKey,
    y: 250
  },
  someParentObject
);

### 11. Working with Classes and Entities ###
-------------------------------------
Class access:
- this.getInstance('View') — returns object (instance) of View class of the same namespace. That is, for Components.Test.Controller returns object of Components.Test.View class.
- Urso.getInstance('Modules.Observer.Controller') — returns object (instance) of Observer.Controller class.
- Urso.getByPath('Modules.Observer.Controller') — returns reference to Observer.Controller class constructor.

These methods accept parameter — path to needed class. Example:
- Urso.getInstance('Components.Button.Template') — get object of Button.Template class.
- Urso.getInstance('Components.Button.Template').objects — array of objects defined in Template file.

Internal calls:
- In any class you can call this.getInstance('Template') to get Template instance of the same entity.

### 12. Adding Sound and Sound/Event Mapping Configuration ###
-------------------------------------------------------
Sounds can be added for any game events: background music, button click sound, etc. Sounds are used as assets added to asset group.

Recommended approach — Atlas: set where necessary sounds are in one track; logic launches needed segment by name.

Sound logic is located (see src/js/modules/logic/config/sounds in Core repository).

Adding sound configuration:
- Create game file src/app/modules/logic/config/sounds.js.
- In sounds.js file in getSoundsConfig() method return object where property is group name and value is array of objects with parameters.

Record parameters:
- soundKey: 'backgroundTheme' — access key to sound asset.
- event: 'sounds.backgroundTheme.play' — event at which sound performs action (for example, playback).
- action — action: 'play', 'stop', 'pause', 'resume', 'fade'.
- relaunch: true — allow sound restart.
- loop: true — looped playback.

Action "fade" (volume dynamics):
- startSound (default false) — starts sound before fade execution.
- fadeDuration (default 200) — volume change duration.
- fadeTo (default 1) — final volume (0..1).

Example:
- In button logic create event this.emit('sounds.buttonMenu.play'), and in sounds.js config subscribe this event to needed soundKey/action.

    { soundKey: 'sound1', event: 'sound1.play.once', action: 'play' },
    { soundKey: 'sound_check', event: 'soundCheck.play.once', action: 'play' },
    { soundKey: 'sound_check', event: 'soundCheck.stop', action: 'stop' },
    { soundKey: 'sound_check', event: 'soundCheck.pause', action: 'pause' },
    { soundKey: 'sound_check', event: 'soundCheck.resume', action: 'resume' },
    { soundKey: 'sound_check', event: 'soundCheck.play.loop', action: 'play', relaunch: true, loop: true }

### 13. LazyLoad Mechanism (Asset Loading Groups) ###
----------------------------------------------
Urso.assets — resource loading logic (see src/js/modules/assets in Core repository).

Loading order:
- All assets without loadingGroup specification are loaded first by _startLoad method and have initial: 0 (see src/js/modules/assets/service in Core repository).
- Then groups are loaded by _startLazyLoad method by their loadingGroup.

Events:
- Upon group loading completion loader.start launches event Urso.events.MODULES_ASSETS_GROUP_LOADED (see src/js/modules/assets/service).
- Upon all groups loading completion — event Urso.events.MODULES_ASSETS_LAZYLOAD_FINISHED.

Prioritization:
- Group queue corresponds to order in lazyLoadGroups array (see src/js/modules/assets/config in Core repository).
- Example: loadingGroup: "lazy" and "afterLazy"; in config this.loadingGroups = { initial: 0, lazy: "lazy", afterLazy: "afterLazy" }, and this.lazyLoadGroups = [ this.loadingGroups.lazy, this.loadingGroups.afterLazy ] — priority "lazy", then "afterLazy".

### 14. States Manager and Components.StateDriven ###
----------------------------------------------
States manager — connection of logical module (Modules.States) controlling active states and their actions, and components inherited from base state-dependent component (Components.StateDriven).

Urso.statesManager — manager for working with states (see src/js/modules/statesManager in Core repository).

States are launched sequentially after previous one completion. Or, if nextState key is set, then transition occurs to first state that passed guard in this array. Action launches if guard passes, which checks launch possibility.

States and transitions (see src\js\modules\statesManager\configStates.js):
- State can contain one action — completes after its completion.
- State can contain multiple actions — completes by transition rule.

Transition types:
- all — state completes after all actions execution.
- race — completes after any action completion; others complete through terminate.
- sequence — completes after all actions execution in order.

Early completion:
- States can be completed early through terminate (see src\js\modules\statesManager\action.js).

configStates fragment:
STATE_NAME : { action: 'action_name' }
STATE_NAME : { all: [ { action: 'action_0_name' }, { action: 'action_1_name' } ] }
STATE_NAME : { race: [ { action: 'action_0_name' }, { action: 'action_1_name' } ] }
STATE_NAME : { sequence: [ { action: 'action_0_name' }, { action: 'action_1_name' } ] }

Components.StateDriven (see src/js/components/stateDriven):
- Has configStates — state entry checks (guard).
- Has configActions — actions for launch.
- Component implementation is made using _subscribeOnce method, so when inheriting from it, make sure to use super._subscribeOnce() call in your own _subscribeOnce method.

Component code example:
configStates = {

  SHOW_MENU: {
    guard: () => { return Urso.localData.get('states.allow.SHOW_MENU') },
  },
};

configActions = {

  menuOpenAction: {
    guard: () => { return Urso.localData.get('spaceKey.input.blocked') }, // check if buttons are blocked
    run: (finishCallback) => { this._changeVisibility(true), finishCallback() }, // execute if guard returned true
  },
  
  menuCloseMouseAction: {
    run: (finishCallback) => { this._changeVisibility(false), finishCallback() }
    terminate: () => { log('closed by menu button on screen') }, // output information how menu was closed.
  },

  menuCloseEscAction: {
    run: (finishCallback) => { this._changeVisibility(false), finishCallback() }
    terminate: () => { log('closed by Esc key on keyboard') }, // output information how menu was closed.
  },
};

- SHOW_MENU state: actions — menuOpenAction (open), menuCloseEscAction (close by Esc), menuCloseButtonAction (close by button).
- After closing — transition nextState: ['WAIT'].
- In component controller state entry check (SHOW_MENU) through configStates; in configActions — open/close logic.

### 15. LayersSwitcher Component ###
----------------------------
Component for enabling and disabling layers in game (see urso\core\src\js\components\layersSwitcher).

Files:
- config.js — layer list and selectors for control.
- controller.js — component logic.

Subscription:
- controller.js is subscribed to event Urso.events.COMPONENTS_LAYERS_SWITCHER_SWITCH with parameter 'groupName' — name of enabled layer selector set.

Behavior:
- When event triggers, component makes all layers from managed layers list invisible and leaves only selected layer objects visible.

Configuration:
- this.allLayers[] — list of selectors of all managed objects.
- this.groupsLayers{} — enabled layer dependencies: key — group name; value — selector array.

this.groupsLayers example:
{
  'mainElements': ['^logo', '^mainButton', '.baseGame'],
  'background': ['.background'],
}

### 16. Modifications and Mixins ###
-----------------------------
Modifications — code files executed instead of standard ones under certain condition.

Example of modifications connection in component info file:
Controller: require('./controller.js'),
Template: require('./template.js'),
modifications: { Desktop: { Controller: require('./modifications/desktop/controller.js') } }

If Urso.getInstancesModes() contains Desktop, controller from modifications/desktop/controller.js will be loaded. Otherwise — standard Controller.

Mixins — methods for reuse in different unrelated classes.

Mixin connection (similar to modifications):
mixins: { Desktop: { Controller: require('./mixins/desktop/controller.js') } }

If Urso.getInstancesModes() contains Desktop — method from mixin ('./mixins/desktop/controller.js') will execute in component Controller.

### 17. Transitions for Objects ###
----------------------------
Transition — smooth transformation (see src\js\modules\objects\baseModel.js in Core repository).

Parameters:
- transitionDelay — delay (ms) before transition start (optional).
- transitionDuration — transition duration.
- transitionProperty — list of keys whose change initiates transition.

Example:
transitionDelay: 1000
transitionDuration: 2000
transitionProperty: "alpha x y"

Changing:
- object.alpha = 1 (appearance) or 0 (disappearance).
- object.x = 200; object.y = 300 (diagonal movement).
You can set one coordinate for axis movement.

### 18. Game Text Localization ###
---------------------------
Text translation to different languages is performed through JSON localization files for each language. Structure: translation key — text.

Example:
"RULES_HEADER": "First Level",
"RULES": "Rules",
"MY_BET_ITEM_TIME": "Time",
"Bet": "Bet"

Usage:
- In text object add localeId parameter with translation key. In this case localization will be pulled automatically.
- Connect json localization file in assets.
- Execute command Urso.core.i18n.setLocale(localeKey), where localeKey — json localization file name.

18.2. Code Usage
- Urso.i18n.get(localeId, localeVariables?)
- Urso.i18n.setLocale(localeKey)
- Urso.i18n.loadAndSetLocale(localeKey, pathToLocaleJson)

18.3. UI Auto-update
- Use localeId instead of text in text objects
- Listen to language change event (Urso.events.MODULES_I18N_NEW_LOCALE_WAS_SET) and update texts

### 19. Transport ###
-------------
19.1. Connection Type Support
- websocket, xhr (by configuration)

19.2. Configuration
- useTransport: true/false (ConfigMain)
- autoReconnect: boolean,
- reconnectTimeout: number in ms,
- type: websocket | xhr
- host: string

19.3. ModulesTransportDecorator Decorator
- toServer/toFront

### 20. Additional Reference Sections ###

20.1. Core Modules (Lib)
- helper — utilities (for example, parseGetParams, waitForDomElement, arraysGetUniqElements, replaceAll, recursiveGet, mergeObjectsRecursive).
- cache — get/has/set/remove/clear.
- device — device data (isMobile/tablet/desktop; getScreenSize/Width/Height; getOrientation; getPixelRatio).
- loader — PIXI.Loader overlay: add(key,url), load(cb), onProgress.add(cb).
- localData — local key-value storage.
- logger — logging levels: ERROR, WARNING, INFO, LOG (level is set in configuration and can be overridden through URL parameter).
- math, time, tween, objectPool, composition — service utilities/infrastructure.

20.2. Additional Information about Templates and Scenes
- Template consists of styles, resource list (assets) and object tree (objects).
- Control methods are available for scenes, including scene switching, FPS getting, pause/resume.

20.3. Practical Recommendations, Debugging, Profiling
- For event work clear domain naming is recommended: ui.*, game.*, modules.*, components.*.
- For assets — grouping and lazyLoad; for weak devices — FPS limitation (config.fps.limit) and optimizeLowPerformance mode.
- For sound consider tab visibility rules (browser event handling).
- Debug component — for FPS/metrics monitoring

### 21. Extra (BrowserEvents, PixiPatch) ###
------------------------------------
21.1. BrowserEvents
- Browser event translation (resize, visibilitychange, input) to engine events: EXTRA_BROWSEREVENTS_*
- Provides scene/sound/render reaction

21.2. PixiPatch
- PIXI fixes/extensions

### 22. Types (Urso.types) ###
----------------------
22.1. assets
- ATLAS, AUDIOSPRITE, BITMAPFONT, CONTAINER, FONT, IMAGE, JSON, JSONATLAS, SOUND, SPINE, HTML

22.2. objects
Object types (Urso.types.objects)
- ATLASIMAGE, BITMAPTEXT, BUTTON, BUTTONCOMPOSITE, CHECKBOX, COLLECTION, COMPONENT, CONTAINER, DRAGCONTAINER, EMITTER, EMITTERFX, GRAPHICS, GROUP, HITAREA, IMAGE, IMAGESANIMATION, MASK, NINESLICEPLANE, SCROLLBOX, SLIDER, SPINE, TEXT, TEXTINPUT, TOGGLE, WORLD

Creation
- Urso.objects.create(params, parent?)

Example:
Urso.objects.create({
  type: Urso.types.objects.IMAGE,
  assetKey: 'logo',
  x: 100, y: 100, name: 'logo'
}, someParent);

Search
- this.common.find / findOne / findAll
- Urso.find / findOne / findAll (console)
- Selectors: ^name, .class, #id; combined: '^container .className'

Base model properties (ModulesObjectsBaseModel)
- Position, scale, anchors, visibility, alpha, angle, sizes, classes/identifiers (can be found in setupParams)

Specific object model properties contain all base model properties as well as their own properties, which can be found in model setupParams.

Specialized objects
- Button/Toggle/Checkbox/Slider — interactive; Scrollbox — scrolling; Spine — animation; Emitter — particles; NineSlicePlane — adaptive panels; Text/TextInput/BitmapText — text

22.3. Other Enumerations
- Screen orientations: Urso.device.ScreenOrientation.LANDSCAPE/ PORTRAIT
- Engine constants

### 23. Events (Urso.events) ###
------------------------
23.1. System Event Examples
- MODULES_SCENES_NEW_SCENE_INIT
- EXTRA_BROWSEREVENTS_WINDOW_RESIZE
- MODULES_ASSETS_LOAD_PROGRESS

23.2. Naming Conventions
- module.domain.action
- ui.*, game.*, sound.*, scenes.*, assets.*, transport.*

### 24. Practical Patterns and Recommendations ###
-------------------------------------------
24.1. Abstraction Layers
- Logic — in services/routers
- Presentation — in View and templates
- Controller — only API/subscriptions

24.2. Selectors
- Use ^, #, . and combinations
- Don't overload search — cache references to frequently used objects

24.3. Events
- Minimize global subscriptions
- Remove subscriptions on destruction

24.4. Performance
- Group resources
- Tune fps and quality
- Use audiosprites and atlases
- Disable invisible containers

24.5. Asset Organization
- Coordinate keys and paths
- Include webp when supported
- Control name intersections in atlases

24.6. Sound
- Keep sound and event mapping config centralized

24.7. States
- Break complex states into all/race/sequence combinations
- Use terminateEvents for graceful parallel Action stopping

### 25. Optimization and Debugging ###
-------------------------------
25.1. Debug Component
- FPS display, draw calls, object count
- Coordinate switcher

25.2. Profiling
- scenes.getFps(), getFpsData()
- Logger with levels
- Custom profiler when needed

25.3. Memory and Cache
- Watch large textures/sprites
- Use LibObjectPool for object reuse

25.4. Build
- Debug build:dev; minimize build:prod

### 26. FAQ ###
-------
- How to launch game? — see Quick Start: index.js + load.js + runGame
- Where to connect modules? — config/load.js
- How to add scene? — create template and register scene in Template/Scenes
- How to play sound on event? — add record in modules/logic/config/sounds.js and emit event
- How to find object? — this.common.find/One/All or Urso.find*/ selectors ^ . #
- How to configure asset quality? — through Urso.assets.updateQuality/ setQuality and qualityFactors config

### 27. Examples from A to Z ###
------------------------
27.1. Mini-menu + game transition
- main.js: defaultScene = 'menu'
- load.js: require('./scenes/menu'); require('./scenes/game');
- In Menu template: PLAY button calls Urso.scenes.display('game')

27.2. Dynamic object creation
Urso.objects.create({ type: Urso.types.objects.TEXT, text: 'Hello', x: 100, y: 100 });

27.3. Selectors
Urso.find('^container .className'); Urso.findOne('#uniqueId'); Urso.findAll('.buttonClass');

27.4. Events
this.addListener('game.start', handler); this.emit('game.start', { level: 1 });

27.5. States
STATE: { sequence: [ { action: 'a0' }, { action: 'a1' } ] }

27.6. Sound on event
sounds.js: { soundKey: 'sfxClick', event: 'ui.click', action: 'play' }
emit: this.emit('ui.click')

27.7. Lazy asset loading
- Add group to lazyLoadGroups
- When needed call loading from logic/component

27.8. Fullscreen mode
emit('fullscreen.toggle')

27.9. Debug
Add Debug component to scene for monitoring

### 28. API Reference ###
-----------------
28.1. Core/Global
- Urso.runGame()
- Urso.getInstance(path, ...modifiers)
- Urso.getByPath(path, ...modifiers)
- Urso.find / findOne / findAll

28.2. Observer
- addListener(name, cb, isGlobal?)
- removeListener(name, cb, isGlobal?)
- emit(name, params?, delay?)

28.3. Assets/Loader/Cache
- assets.preload(assets, onComplete, onProgress?, onError?)
- assets.loadGroup(groupName, onComplete, onProgress?, onError?)
- loader.add(key, url); loader.load(cb); loader.onProgress.add(cb)
- cache.get/has/set/remove/clear

28.4. Objects
- objects.create(params, parent?)
- Model properties: position, scale, anchor, visibility, etc.

28.5. Scenes
- scenes.display(name), getFps(), getFpsData(), pause(), resume()

28.6. I18n
- Urso.i18n.get(localeId, localeVariables?)
- Urso.i18n.setLocale(localeKey)
- Urso.i18n.loadAndSetLocale(localeKey, pathToLocaleJson)

28.7. Device
- isMobile/tablet/desktop/touch
- getScreenWidth/Height(), getOrientation(), getPixelRatio()

28.8. Logger
- error/warning/info/log; levels through defaultLogLevel

### 29. Appendices ###
--------------
29.1. Naming Conventions
- Event names: domain.action.detail (for example, sound.play.click, ui.button.play.click)
- Object names: clear and unique for findOne '^name'
- Object classes: '.class-name' reflects role/style

29.2. Release Checklist
- Loading groups and lazyLoad checked
- Asset quality chosen for devices
- Sound config matches actual assets
- Logs and levels reduced for production
- Performance on target devices measured

### 30. Code Examples ###
-----------------
index.js

require("@urso/core");
require("./app/config/load");
window.onload = Urso.runGame;

config/main.js
//overriding core config
Urso.config.extendingChain = ['Urso.Core', 'Urso.App'];
Urso.config.title = 'SomeGame';
Urso.config.appVersion = '1.11.10'; //game anticache get param
Urso.config.defaultScene = 'play'; //default game scene for urso engine

config/load.js

window.Urso.App = {
  Components: {
    Bg: {
      Controller: require('./../components/bg/controller.js'),
      Template: require('./../components/bg/template.js'),
    },
    Intro: {
      Controller: require('./../components/intro/controller.js'),
      Template: require('./../components/intro/template.js'),
    },
    LayersSwitcher: {
      Config: require('./../components/layersSwitcher/config.js') //config for core LayersSwitcher component
    },
    SoundsInit: {
      Controller: require('./../components/soundsInit/controller.js'),
    },
  },
  Modules: {
    I18n: {
      Config: require('./../modules/i18n/config.js')
    },
    Logic: {
      Controller: require('./../modules/logic/controller'),
      Main: require('./../modules/logic/main'),
      Config: {
        Sounds: require('./../modules/logic/config/sounds.js') //sounds router
      }
    },
    Observer: {
      Events: require('../modules/observer/events') //custom events config
    },
    Scenes: {
      ResolutionsConfig: require('./../modules/scenes/resolutionsConfig.js'),
    }
  },
  Templates: {
    Scenes: {
      Play: require('./../templates/scenes/play.js')
    },
    Groups: {
      AtlasLoadGroup: require('./../templates/groups/atlasLoadGroup.js'),
      RestAssetsLoadGroup: require('./../templates/groups/restAssetsLoadGroup.js'),
    }
  },
};

require('./main.js');

### 31. Links ###
---------
- https://ursojs.io/examples.html
- https://github.com/megbrimef/urso-examples
- https://github.com/megbrimef/urso
- https://github.com/megbrimef/urso-slot-base
- https://discord.gg/JauD9CbDHA


### License ###
By Lancecat Games

This content is released under the (http://opensource.org/licenses/MIT) MIT License.
