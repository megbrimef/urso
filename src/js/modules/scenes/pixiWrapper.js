class ModulesScenesPixiWrapper {
    constructor() {
        this.singleton = true;
        this._renderer;

        this.scenes = {};
        this.world;

        this._root;
        this._loaderScene;

        this._loopStopped = false;
        this._loopPaused = false;
        this._loopLastCall = 0;

        this.loop = this.loop.bind(this);
    }

    init() {
        this._setPixiSettings();

        //define renderer
        PIXI.utils.skipHello();
        this.renderer = new PIXI.Renderer({ preserveDrawingBuffer: true, width: 1, height: 1 });
        document.body.appendChild(this.renderer.view);

        //root and world
        this._root = new PIXI.Container();
        this._createWorld();

        // setup interaction
        this.interaction = new PIXI.InteractionManager({ root: this._root, view: this.renderer.view });

        this._loaderScene = this.getInstance('Model');
        this._requestAnimFrame(this.loop);

        this.getInstance('Resolutions');
    }

    _setPixiSettings() {
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;
        PIXI.settings.TEXT_RESOLUTION = 1;

        if (Urso.device.iOS || Urso.device.macOS)
            PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH;
    }

    _createWorld() {
        if (this.world)
            this._root.removeChild(this.world);

        this.world = new PIXI.Container();
        this._root.addChild(this.world);
    }

    _requestAnimFrame(loopFunction) {
        (() => {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function (/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                    window.setTimeout(callback, 0);
                };
        })()(loopFunction);
    }

    _getDeltaTime() {
        let newTime = Date.now();
        let deltaTime = newTime - this._loopLastCall;
        this._loopLastCall = newTime;

        return Urso.math.intMakeBetween(deltaTime, 0, 1000);
    }

    _getDeltaFrame(deltaTime) {
        return deltaTime * 60 / 1000;
    };

    loop() {
        if (this._loopStopped)
            return false;

        this._requestAnimFrame(this.loop);

        if (!this._loopPaused)
            this.update();

        return true;
    };

    update() {
        if (!this.currentScene || this.currentScene.isPaused())
            return;

        let deltaTime = this._getDeltaTime();
        let deltaFrame = this._getDeltaFrame(deltaTime);
        this.interaction.update(deltaFrame);

        this.currentScene.update(deltaTime);
        this.currentScene.render();
        this.renderer.render(this._root);
    };

    //size
    resize(width, height) {
        this.renderer.resize(width, height);
    };

    setWorldScale(x, y) {
        this.world.scale.x = x;
        this.world.scale.y = y;
    }

    setCanvasWidth(val) {
        this.renderer.view.style.width = val + 'px';
    };

    setCanvasHeight(val) {
        this.renderer.view.style.height = val + 'px';
    };

    getPixiWorld() {
        return this.world;
    }

    setNewScene(model) {
        this._createWorld();
        this.currentScene = model;
    }
}

module.exports = ModulesScenesPixiWrapper;
