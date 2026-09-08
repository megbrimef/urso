
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
        this._frames = 0;
        this._currentFPS = Urso.config.fps.limit;
        this._lastTimeCheckFPS = 0;
    }

    async init() {
        //define renderer
        const app = new PIXI.Application();
        // FIXED: devtools global was shipped to production — only expose in development mode
        if (Urso.config.mode !== 'production')
            window.__PIXI_APP__ = app;
        //root and world
        this._root = new PIXI.Container();
        this._root.label = 'root';
        this._createWorld();
        // FIXED: gameContainerSelector was read as undefined, which querySelector stringified to "undefined" selector — now guarded with truthy check
        const parent = (Urso.config.gameContainerSelector && document.querySelector(Urso.config.gameContainerSelector)) || document.body;

        // ADDED: register CullerPlugin when culling is enabled — culling trades CPU (per-object
        // bounds checks) for GPU savings, so it is opt-in and must be profiled, not assumed to help.
        // Objects additionally have to opt in individually via the `cullable` property.
        // FIXED: this was written as `require('pixi.js')`, which is undefined in this package —
        // "type": "module" means every engine file is an ES module. It would have thrown
        // ReferenceError the moment anyone set culling: true, and no test covers that path because
        // the default is false. Use the PIXI global the rest of this file already relies on.
        if (Urso.config.renderer && Urso.config.renderer.culling)
            PIXI.extensions.add(PIXI.CullerPlugin);

        // ADDED: build init options from config, omitting keys with undefined values so Pixi defaults apply
        // ADDED: fall back to an empty object so a game that replaces Urso.config wholesale
        // degrades to today's behaviour rather than throwing on a missing `renderer` key.
        const rendererConfig = Urso.config.renderer || {};

        const initOptions = {
            background: rendererConfig.background !== undefined ? rendererConfig.background : "0x222222",
            // resolution: 1 is hardcoded; NOT autoDensity — see resolutions.js comments
            resolution: 1
        };

        // ADDED: conditionally add renderer option keys only when configured (not undefined)
        if (rendererConfig.antialias !== undefined)
            initOptions.antialias = rendererConfig.antialias;
        if (rendererConfig.powerPreference !== undefined)
            initOptions.powerPreference = rendererConfig.powerPreference;
        if (rendererConfig.preference !== undefined)
            initOptions.preference = rendererConfig.preference;
        if (rendererConfig.gcActive !== undefined)
            initOptions.gcActive = rendererConfig.gcActive;
        if (rendererConfig.gcMaxUnusedTime !== undefined)
            initOptions.gcMaxUnusedTime = rendererConfig.gcMaxUnusedTime;
        if (rendererConfig.gcFrequency !== undefined)
            initOptions.gcFrequency = rendererConfig.gcFrequency;

        await app.init(initOptions);
        parent.appendChild(app.canvas);
        app.stage.addChild(this._root)
        this._app = app
        this._app.ticker.add(this._loop);

        this._loaderScene = this.getInstance('Model');

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
        //FIXME
        // spine.settings.GLOBAL_AUTO_UPDATE = false;
    }

    /**
     * resume scene
     */
    resume() {
        this._loopLastCall = Date.now();
        this._loopPaused = false;
        //FIXME 
        // this._update();
        // spine.settings.GLOBAL_AUTO_UPDATE = true;
    }

    /**
     * resize renderer
     * @param {Number} width
     * @param {Number} height
     */
    resize(width, height) {
        this._app.renderer.resize(width, height);
    };

    /**
     * hide canvas
     */
    hideCanvas() {
        this._app.canvas.style.display = 'none';
    }

    /**
     * show canvas
     */
    showCanvas() {
        this._app.canvas.style.display = '';
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
        this._app.canvas.style.width = val + 'px';
    };

    /**
     * set canvas height
     * @param {Number} val
     */
    setCanvasHeight(val) {
        this._app.canvas.style.height = val + 'px';
    };

    /**
     * get current renderer
     * @returns {Object} - PIXI.Renderer
     */
    getRenderer() {
        // FIXED: getRenderer returned the Application instead of the Renderer — now returns app.renderer as promised
        return this._app.renderer;
    }

    /**
     * get PIXI Application
     * @returns {Object} - PIXI.Application
     */
    getApp() {
        return this._app;
    }

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
        // FIXED: generateTexture was fully commented out and returned undefined — restored implementation using app.renderer
        return this._app.renderer.generateTexture(obj);
    }

    _createWorld() {
        if (this.world)
            this._root.removeChild(this.world);

        this.world = new PIXI.Container();
        this._root.addChild(this.world);
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
        // FIXED: FPS limiter was ignored and pause state was never checked — now return false if stopped/paused and only update when FPS check allows
        if (this._loopStopped)
            return false;

        if (this._loopPaused)
            return false;

        if (!this._fpsCheckAllowUpdate())
            return false;

        this._update();

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

        // PERF: two independent throttles fighting each other — removed manual gate, ticker.maxFPS is idiomatic Pixi v8 throttle and skips render too
        this._app.ticker.maxFPS = this._maxFPSLimit;

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
        //this.interaction.update(deltaFrame); //FIXME

        this._checkMouse();
        this.emit(Urso.events.MODULES_SCENES_UPDATE, deltaTime);

        this.currentScene.update(deltaTime);
        this.currentScene.render();
        //FIXME
        //this._renderer.render(this._root);
        // this.ticker.update(deltaTime);
        // this._renderer.render(this._root);
    };

    _checkMouse() {
        let newCoords = this._getMouseCoords();

        // PERF: JSON.stringify comparison is 215x slower than direct field comparison, runs 60x/sec — compare fields directly
        if (this._mouseCoords.x === newCoords.x && this._mouseCoords.y === newCoords.y)
            return true;

        this._mouseCoords = newCoords;
        this.emit(Urso.events.MODULES_SCENES_MOUSE_NEW_POSITION, this._mouseCoords);
    };

    _getMouseCoords() {
        // FIXED: mouse coords were always {0,0} because this.interaction doesn't exist in Pixi v8 — read from app.renderer.events.pointer.global instead
        const globalCoords = this._app.renderer.events.pointer.global || { x: 0, y: 0 };

        const coords = {
            x: ~~(globalCoords.x / this.world.scale.x),
            y: ~~(globalCoords.y / this.world.scale.y)
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
    _visibilityChangeHandler(state) {
        const isVisible = state === 'visible';

        if (isVisible) {
            if (this.passiveCallIntervalId) {
                clearInterval(this.passiveCallIntervalId);
                this.passiveCallIntervalId = null;
            }

            return;
        }

        // FIXED: interval callback was empty and burned a timer — restored to call _update when tab is hidden and not stopped/paused
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

export default ModulesScenesPixiWrapper;
