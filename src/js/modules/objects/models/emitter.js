class ModulesObjectsModelsEmitter extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.EMITTER;

        this.emitter = null;

        this._addBaseObject();
        this._addEmitter();
    }

    setupParams(params) {
        super.setupParams(params);

        this.autostart = Urso.helper.recursiveGet('autostart', params, false);
        this.cfg = Urso.helper.recursiveGet('cfg', params, false); // json asset key with emitter config
        this.textures = Urso.helper.recursiveGet('textures', params, []); // array of image asset keys
    }

    _addBaseObject() {
        this._baseObject = new PIXI.ParticleContainer();
        this._baseObject.setProperties({
            scale: true,
            position: true,
            rotation: true,
            uvs: true,
            alpha: true,
        });
    };

    _addEmitter() {
        const cfg = Urso.cache.getJson(this.cfg);
        const textures = [];

        if (!cfg || !cfg.data)
            throw new SyntaxError(`Config error in ${this.name} emitter`);

        for (const textureName of this.textures) {
            const texture = Urso.cache.getTexture(textureName);
            if (texture)
                textures.push(texture);
        }
        this.emitter = new PIXI.particles.Emitter(this._baseObject, textures, cfg.data);
        this.emitter.emit = this.autostart;
        this.emitter.autoUpdate = true;
    }

    play() {
        this.emitter.emit = true;
    }
}

module.exports = ModulesObjectsModelsEmitter;
