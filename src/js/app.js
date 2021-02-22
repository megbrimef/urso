class App {
    constructor() {
        this.version = '0.1.8';

        this.setup = this.setup.bind(this);
    }

    setup() {
        //helper must be first
        Urso.helper = new Urso.Core.Lib.Helper(); //helper functions

        //setup Instances
        let instances = new Urso.Core.Modules.Instances.Controller();
        Urso.getInstance = instances.getInstance;
        Urso.getPath = instances.getPath;
        Urso.getInstancesModes = instances.getModes;
        Urso.addInstancesMode = instances.addMode;
        Urso.removeInstancesMode = instances.removeMode;

        //TODO
        //Urso.Core must be in npm
        //Urso.SlotGame //npm
        //Urso.SomeBaseGame //??
        //Urso.SomeNewGame //from _src code

        //build from extendingChain and merge all into Urso.Game
        Urso.Game = {};
        for (let extention of Urso.config.extendingChain)
            Urso.helper.mergeObjectsRecursive(Urso.Game, Urso.helper.recursiveGet(extention, window, {}), true);

        //(!)important we must use only Urso.Game from our code

        //observer pattern
        Urso.observer = Urso.getInstance('Modules.Observer.Controller');

        //Extra
        Urso.browserEvents = Urso.getInstance('Extra.BrowserEvents');

        //libs
        Urso.cache = Urso.getInstance('Lib.Cache'); //all assets cache
        Urso.device = Urso.getPath('Lib.Device'); //all device info
        Urso.loader = Urso.getInstance('Lib.Loader'); //assets loader class
        Urso.localData = Urso.getInstance('Lib.LocalData'); //local data storage
        Urso.logger = Urso.getInstance('Lib.Logger'); //logger
        Urso.math = Urso.getInstance('Lib.Math'); //math functions

        //Modules
        Urso.assets = Urso.getInstance('Modules.Assets.Controller');
        Urso.buttons = Urso.getInstance('Modules.Buttons.Controller');
        // TODO: CHECK FOR EVENT TO START COMMUNICATION WITH SERVER
        Urso.transport = Urso.getInstance('Modules.Transport.Controller');
        Urso.logic = Urso.getInstance('Modules.Logic.Controller');
        Urso.objects = Urso.getInstance('Modules.Objects.Controller');
        Urso.scenes = Urso.getInstance('Modules.Scenes.Controller');
        Urso.soundManager = Urso.getInstance('Modules.SoundManager.Controller');
        Urso.statesManager = Urso.getInstance('Modules.StatesManager.Controller');
        Urso.template = Urso.getInstance('Modules.Template.Controller');

        //set title
        document.title = Urso.config.title;

        this.sayHello();

        //App.run
        Urso.getInstance('App').run();
    }

    sayHello() {
        console.log(`%c Urso ${this.version} `, 'background: #222; color: #bada55');
    }

    run() {
        Urso.scenes.display(Urso.config.defaultScene);
    }
}

module.exports = App;
