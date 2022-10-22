URSO — The HTML5 Game Framework
=============

![ursojs.io logo](https://ursojs.io/img/logo.png)

### Learn more ###
- You can find more information on the [official website](https://ursojs.io/)
- Explore working [examples](https://ursojs.io/examples.html) demos and see the code structure
- Also you can use [slot base game](https://github.com/megbrimef/urso-slot-base) as a slot game engine (slot framework)
- Clone [examples repository](https://github.com/megbrimef/urso-examples) to fast learning

### How to ###
```js
require('@urso/core');
require('./app/config/load'); // your game application

window.onload = Urso.runGame; //run game
```

### Beginning ###
Having cloned the repository to yourself locally, you must install all the game dependencies before starting.

Game dependencies are installing with yarn or npm install commands.

After installing the dependencies, you need to run the command yarn start or npm run start to start the game.
 
### How its working? ###
The source code and assets of the game are located in src/app and src/assets.

Each game must necessarily include the following:
- src/app/config/load.js - connecting all modules (js files), as well as specifying the inheritance chain of the game.
- src/app/config/main.js - important parameters for the game (name, scene by default)
- src/js/index.js is the entry point of the application. The engine code is connected there through the dependencies, load.js and main.js of the game. As soon as all the engine files are loaded, you need to launch the application using the Urso.runGame() function (usually on window.onload)

The default game relies on Core.

Core is: third-party libraries (Pixi, Howler ...), interfaces to these libraries, a transport module, a base component, logic for sounds and buttons states, and logic for launching a game (Urso.Core.App).

After starting the game, Core will create all the namespaces, all the necessary objects and methods for the game to work (see src/js/app.js in the Core repository). Next, it will call the run method.
 
### Objects required to run the game: ###
- Urso.helper - contains a set of helper methods for the convenience of the developer (see src/js/lib/helper.js in the Core repository);
- Urso.observer - provides an event-driven model of the game (see src/js/modules/observer in the Core repository);
- Urso.cache - provides work with loaded resources (see src/js/lib/cache.js in the Core repository);
- Urso.device - contains a set of methods for receiving data from the device on which the game is running (see src/js/lib/device.js in the Core repository);
- Urso.loader - wrapper class over the standard PIXI resource loader (see src/js/lib/loader.js in the Core repository);
- Urso.localData - provides work with local storage inside the game (see src/js/lib/localData.js in the Core repository);
- Urso.assets - contains the logic for working with resource loading (see src/js/modules/assets in the Core repository);
- Urso.logic - contains the logic of event routers (see src/js/modules/logic in the Core repository);
- Urso.objects - the logic for creating scene objects (see src/js/modules/objects in the Core repository);
- Urso.scenes - scene manager responsible for creating, displaying, scene transitions (see src/js/modules/scenes in the Core repository);
- Urso.soundManager - manager for working with sounds (see src/js/modules/soundManager in the Core repository);
- Urso.statesManager - a manager for working states (see src/js/modules/statesManager in the Core repository);
- Urso.template - template engine that provides work with templates (see src/js/modules/template in the Core repository);
- Urso.browserEvents - translator of browser events into the game (see src/js/extra/browserEvents.js in the Core repository);

The Urso.runGame method, in turn, will start loading the default scene using the scene manager.
 
 
### Scenes, templates, components and simple objects ###
Scene (scene) - a set of objects that are present on the screen and display some specific state of the game (main menu, loading screen, level in the game).

How the scene should look is described in the template (for example src/app/templates/scenes/play.js).

Template (templates) - Template includes descriptions of styles, resources and objects (simple and components) that need to be created.

Styles are implemented through classes, similar to classes in CSS.

Adding a class to an object automatically applies the properties described in the styles to it.

The set of assets is automatically added to the download list.

For objects, the procedure for creating them on the scene is described.

The template itself cannot change the states of objects.

Components - Components can consist of many simple objects and unlike templates, their state can be controlled by event routers via Urso.observer.

Components should not independently interact with other components or be aware of their existence.

Components know and can use directly only helper libraries such as Urso.localData and Urso.helper. Communication with other entities should occur through events (Urso.observer).

The component implements a modification of the mvc pattern, where:
 
- controller should contain only the external interface and event handlers (event subscriptions);
- service contains all the logic;
- view interacts with scene objects;
- template contains a set of simple objects that refer to this component

Simple objects (src/js/modules/objects/models) - Objects such as image, text, container, spine, etc.

When creating a scene object, the template engine collects all the necessary assets and adds them to the download.

After the download is complete, the scene manager starts creating all objects and components.

As soon as the components and objects are created, the scene is displayed on the screen.

Changes to the global state of the game and individual components occur in event routers. Also available is Urso.statesManager for switching game states through a set of Action objects.
 
 
### Event routers and working with the event-driven model (observer) ###
Working with the event-driven model is carried out by the following methods:
- this.addListener('event.name', callback, isGlobal) - used to subscribe to event 'event.name'.
- this.removeListener('event.name', callback, isGlobal) - used to unsubscribe from event 'event.name'.

The first argument is the name of the event.

The second argument is a method (function) that will be executed in case of an event triggering.

The event can be intercepted locally (within the current scene) and globally (for all scenes). Regulated by the third argument (isGlobal) when subscribing.

It is recommended to subscribe inside the special functions _subscribe or _subscribeOnce, which are automatically called when the class is instantiated.

At the component level, we recommend that you subscribe at the controller level.

- this.emit('event.name', params, delay) - used to generate event 'event.name'.

From the console observer is available with commands:
- Urso.observer.add - analog of this.addListener for access from the console
- Urso.observer.remove - analog of this.removeListener for console access
- Urso.observer.fire - analogue of this.emit for access from the console

It is desirable to use only local subscriptions for components.
 
 
### States Manager ###
The state manager uses a collection of Action objects (src\js\modules\statesManager\configStates.js) and optionally StateDriven components.

Action logic objects are described in src\js\modules\statesManager\configActions.js.

When an attempt is made to activate an Action, the guard method is run, which returns true if the Action can be activated or false if not.

If the StateDriven component is used, it automatically registers its guard with the state manager and there is no need to override the guard in the Action.

 
States are configured by specifying the name of the state and the type of transition between Action:
```js
STATE_NAME : { action: 'action_name' } // the state contains one Action and ends after it ends.
```

```js
STATE_NAME :  { 
    all: [
     { action: 'action_0_name' },
     { action: 'action_1_name' }
   ]
} // state contains a collection of Action and is completed after all Actions have completed.
```

```js
STATE_NAME :  { 
  race: [
    { action: 'action_0_name' },
    { action: 'action_1_name' }
  ]
} // the state contains a collection of Action and is completed after any Action has completed and all others have completed via terminateEvents.
```

```js
STATE_NAME :  { 
  sequence: [
    { action: 'action_0_name' },
    { action: 'action_1_name' }
  ]
} // the state contains the Action collection and is completed after all Actions are executed one by one
```

terminateEvents - these are events leading to a quick termination of the component's logic.
 
### Event routers ###
Event routers using Urso.observer manage both the state of the entire game and the state of individual components.

Core implements two event routers:
- Buttons - an event router that manages the state of buttons (see src/js/modules/logic/buttons in the Core repository);
- Sounds - an event router that controls the playback of sounds (see src/js/modules/logic/sounds in the Core repository);
 
### Working with scene objects ###
To work with scene objects (and from the console), you need to use the following tools:
- this.common.find returns false/object/collection (Urso.find('selector') for console access);
- this.common.findOne returns false/object (Urso.findOne('^name') for console access);
- this.common.findAll('.class') returns false/collection (Urso.findAll('.class') for console access);

The search modifier is the first character of the passed argument.

The following modifiers are available:
- '^' - Search by name (name);
- '.' - Search by class (class);
- '#' - Search by identifier (id);

Given that objects can contain other objects, combinations of selectors are also available - Urso.find ('^nameContainer .classText').

The search will search in an object named ^nameContainer for objects with class classText, and at any nesting level.
 
### Dynamically creating scene objects ###
In order to create an object on the scene, you need to call the Urso.objects.create function and pass the desired object parameters to it as the first parameter and the parent object as the second.

If the parent object is not passed, the object will be created in the root object (world)

For example:
```js
Urso.objects.create(
    {
        type: Urso.types.objects.IMAGE,
        assetKey: assetKey,
        y: 250
    }, 
    someParentObject
);
```

### Working with classes and entities ###
To work with classes, the following are used:
- Urso.getInstance ('Modules.Observer.Controller') returns an object (instance) of the Observer.Controller class
- Urso.getPath ('Modules.Observer.Controller') returns a reference to the constructor of the Observer.Controller class

These two methods also support any number of modifiers, which allows more flexibility in applying the desired class in a specific environment.

For example, if you apply the modifier 'mobile', then Urso.getInstance ('Modules.Observer.Controller') will look for the constructor first in Modules.Observer.Mobile.Controller. If no such constructor is found, then the “default option” Modules.Observer.Controller will be returned;

Also, any class inside itself can call the following construction this.getInstance ('View'), which will return the desired class of the same entity, in our case it is a View instance


### License ###
By Lancecat Games

This content is released under the (http://opensource.org/licenses/MIT) MIT License.
