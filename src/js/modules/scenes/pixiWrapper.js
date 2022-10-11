const NORMAL_FPS_COUNT = 60;
const LOW_PERFORMANCE_FPS_COUNT = 30;

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

        this._loop = this._loop.bind(this);
        this.passiveCallIntervalId = null;

        this._mouseCoords = { x: 0, y: 0 };


        this._maxFPSLimit = Urso.config.fps.limit;
        this._lastUpdateTime = 0;
        this._frames = 0;
        this._currentFPS = Urso.config.fps.limit;
        this._lastTimeCheckFPS = 0;
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
        this.interaction = new PIXI.InteractionManager(this.renderer);

        this._loaderScene = this.getInstance('Model');
        this._requestAnimFrame(this._loop);

        this.getInstance('Resolutions');
    }

    /**
     * returns is scene paused
     * @returns {Boolean}
     */
    isPaused() {
        return this._loopPaused;
    }

    /**
     * pause scene
     */
    pause() {
        this._loopPaused = true;
        PIXI.spine.settings.GLOBAL_AUTO_UPDATE = false;
    }

    /**
     * resume scene
     */
    resume() {
        this._loopLastCall = Date.now();
        this._loopPaused = false;
        this._update();
        PIXI.spine.settings.GLOBAL_AUTO_UPDATE = true;
    }

    /**
     * resize renderer
     * @param {Number} width
     * @param {Number} height
     */
    resize(width, height) {
        this.renderer.resize(width, height);
    };

    /**
     * hide canvas
     */
    hideCanvas() {
        this.renderer.view.style.display = 'none';
    }

    /**
     * show canvas
     */
    showCanvas() {
        this.renderer.view.style.display = '';
    }

    /**
     * set world scale
     * @param {Number} x
     * @param {Number} y
     */
    setWorldScale(x, y) {
        this.world.scale.x = x;
        this.world.scale.y = y;
    }

    /**
     * set canvas width
     * @param {Number} val
     */
    setCanvasWidth(val) {
        this.renderer.view.style.width = val + 'px';
    };

    /**
     * set canvas height
     * @param {Number} val
     */
    setCanvasHeight(val) {
        this.renderer.view.style.height = val + 'px';
    };

    /**
     * get pixi world (main Container)
     * @returns {Object}
     */
    getPixiWorld() {
        return this.world;
    }

    /**
     * set new scene
     * @param {Object} model
     */
    setNewScene(model) {
        this._createWorld();
        this.currentScene = model;
    }

    /**
     * get fps
     * @returns {Number}
     */
    getFps() {
        return this._currentFPS;
    }

    /**
     * get fps data
     * @returns {Object}
     */
    getFpsData() {
        return {
            fps: this._currentFPS,
            limit: this._maxFPSLimit
        }
    }

    /**
     * get cached mouse coords
     * @returns {Object}
     */
    getCachedMouseCoords() {
        return this._mouseCoords;
    }

    /**
     * generateTexture from object
     * @param {Object} obj
     * @returns {Object} - pixi.Texture
     */
    generateTexture(obj) {
        return this.renderer.generateTexture(obj);
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
        let deltaTime = Urso.scenes.timeScale * (newTime - this._loopLastCall);
        this._loopLastCall = newTime;

        return Urso.math.intMakeBetween(deltaTime, 0, 1000);
    }

    _getDeltaFrame(deltaTime) {
        return deltaTime * 60 / 1000;
    };

    _loop() {
        if (this._loopStopped)
            return false;

        this._requestAnimFrame(this._loop);

        if (!this._loopPaused) {
            if (!this._fpsCheckAllowUpdate())
                return;

            this._update();
        }

        return true;
    };

    _fpsCheckAllowUpdate() {
        const currentTime = Urso.time.get();
        this._updateCurrentFPS(currentTime);

        //setup maxFPSLimit
        if (Urso.config.fps.optimizeLowPerformance)
            if (this._currentFPS < NORMAL_FPS_COUNT)
                this._maxFPSLimit = LOW_PERFORMANCE_FPS_COUNT;
            else
                this._maxFPSLimit = Urso.config.fps.limit;

        //check need update
        if (currentTime - this._lastUpdateTime < ~~(1000 / this._maxFPSLimit))
            return false;

        this._lastUpdateTime = currentTime;
        return true;
    }

    _updateCurrentFPS(currentTime) {
        this._frames++;

        if (currentTime - this._lastTimeCheckFPS < 1000)
            return;

        this._currentFPS = Math.round(1000 * this._frames / (currentTime - this._lastTimeCheckFPS));
        this._lastTimeCheckFPS = currentTime;
        this._frames = 0;
    }

    _update() {
        if (!this.currentScene)
            return;

        let deltaTime = this._getDeltaTime();
        let deltaFrame = this._getDeltaFrame(deltaTime);
        this.interaction.update(deltaFrame);

        this._checkMouse();
        this.emit(Urso.events.MODULES_SCENES_UPDATE, deltaTime);

        this.currentScene.update(deltaTime);
        this.currentScene.render();
        this.renderer.render(this._root);
    };

    _checkMouse() {
        let newCoords = this._getMouseCoords();

        if (Urso.helper.checkDeepEqual(this._mouseCoords, newCoords))
            return true;

        this._mouseCoords = newCoords;
        this.emit(Urso.events.MODULES_SCENES_MOUSE_NEW_POSITION, this._mouseCoords);
    };

    _getMouseCoords() {
        const coords = {
            x: ~~(this.interaction.mouse.global.x / this.world.scale.x),
            y: ~~(this.interaction.mouse.global.y / this.world.scale.y)
        };

        coords.x = this._validateCoordinate(coords.x);
        coords.y = this._validateCoordinate(coords.y);

        return coords;
    };

    _validateCoordinate(c) {
        return c > 0 ? c : 0;
    }

    /**
     * reserve loop, when browser tab is inactive
     * @param {Boolean} isVisible
     */
    _visibilityChangeHandler(isVisible) {
        if (isVisible) {
            if (this.passiveCallIntervalId) {
                clearInterval(this.passiveCallIntervalId);
                this.passiveCallIntervalId = null;
            }

            return;
        }

        this.passiveCallIntervalId = setInterval(() => {
            if (!this._loopStopped && !this._loopPaused) {
                this._update();
            }
        }, 16);
    }

    _subscribeOnce() {
        this.addListener(Urso.events.EXTRA_BROWSEREVENTS_WINDOW_VISIBILITYCHANGE, this._visibilityChangeHandler.bind(this), true);
    }
}

module.exports = ModulesScenesPixiWrapper;
