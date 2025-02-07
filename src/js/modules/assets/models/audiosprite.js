const ModulesAssetsBaseModel = require('./../baseModel');

class ModulesAssetsModelsAudiosprite extends ModulesAssetsBaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.assets.AUDIOSPRITE;
        this.codecs = ['ogg', 'm4a', 'mp3', 'wav'];

        const codec = this.codecs.filter(codec => UrsoUtils.Howler.codecs(codec))[0];

        this.contents = Urso.helper.recursiveGet('contents', params, [
            { type: Urso.types.assets.JSON, key: `${this.key}_audiospriteJson`, path: `${this.path}.json` },
            { type: Urso.types.assets.SOUND, key: `${this.key}_audiospriteSound`, path: `${this.path}.${codec}` }
        ]);

        this.path = false;
        this.key = false;
    }

    setupParams(params) {
        super.setupParams(params);

        this.path = Urso.helper.recursiveGet('path', params, false);
    }
}

module.exports = ModulesAssetsModelsAudiosprite;