class ModulesObjectsModelsEmitterFx extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.EMITTERFX;

        this.emitter = null;

        this._addBaseObject();
        this._createBundle();
        this._createTicker();
    }
    /**
     * 
     * @param {Object} params
     * 
     * - Params have to contain 'cfg' which is a key of JSON config made via 
     * https://editor.revoltfx.electronauts.net editor.
     * - In a case config doesn't have textures described in it, you can use spritesheetFilter which should be a
     * string, described common part of texures asset keys. That string will be used as filter to get textures from cache.
     * If textures should be animated, texture's asset key have to be of the next format:
     * mc_commonPart_01 - where 'mc' stands for 'movieclips' allows us use animation, commonPart - described all textures in a spriteSheet,
     * and _01 - number of frame.
     */
    setupParams(params) {
        super.setupParams(params);

        this.autostart = Urso.helper.recursiveGet('autostart', params, false);
        this.cfg = Urso.helper.recursiveGet('cfg', params, false);
        this.spritesheetFilter = Urso.helper.recursiveGet('spritesheetFilter', params, false);
    }

    update(deltaTime) {
        if (this._emitter) {
            this._bundle.update(deltaTime);
        }
    }

    /**
     * @param {String} emitterName
     * Inits emitter by it's name. If no name given - inits first emitter from config.
     */
    play(emitterName) {
        this._isActive = true;

        emitterName = emitterName || this._defaultEmitterName;

        this._emitter = this._bundle.getParticleEmitter(emitterName);
        this._emitter.init(this._baseObject, true, 1);
    }
    /**
     * 
     * Stops emitter. If new emitter wasn't inited before particles disappears - clears this._emitter to stop bundle update.
     */
    stop() {
        if(!this._emitter)
            return;

        this._emitter.stop();
        this._emitter.on.completed.add(() => {
            if(!this._isActive)
                this._emitter = null;
        });
        
        this._isActive = false;
    }

    _addBaseObject() {
        this._baseObject = new PIXI.Container();
    };

    _createBundle() {
        this._bundle = new PIXI.particlesFx.FX();

        let fx_settings_data = Urso.cache.getJson(this.cfg).data;

        if(this.spritesheetFilter)
            fx_settings_data.spritesheetFilter = this.spritesheetFilter;

        this._defaultEmitterName = fx_settings_data.emitters[0].name;

        this._bundle.initBundle(fx_settings_data);
        this.autostart && this.play();
    }

    _createTicker() {
        this._ticker = new PIXI.Ticker();
        this._ticker.add(this.update.bind(this));
        this._ticker.start();
    }
}

module.exports = ModulesObjectsModelsEmitterFx;
