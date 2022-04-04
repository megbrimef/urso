class ModulesLogicSounds {
    constructor() {
        this._cfg = null;

        this._setDefaultConfig();
        this._loadedSounds = {};
    }

    _setDefaultConfig() {
        const cfg = this.getInstance('Config.Sounds');
        this._cfg = cfg.soundsConfig;
    };

    _parseConfig() {
        const mappedCfg = {};
        const configs = Object.keys(this._cfg);

        configs.forEach(configName => {
            const cfg = this._cfg[configName];

            cfg.forEach(obj => {
                const {
                    action = 'play',
                    relaunch = false,
                    loop = false,
                    volume = 1,
                    ...otherParams
                } = obj;

                if (!mappedCfg[obj.soundKey])
                    mappedCfg[obj.soundKey] = {
                        events: {}
                    };

                mappedCfg[obj.soundKey].events[obj.event] = {
                    ...otherParams,
                    action,
                    relaunch,
                    loop,
                    volume,
                };;
            });
        });

        return mappedCfg;
    };

    _getUploadedSounds(audiospriteData) {
        const newAudiospriteData = {};

        for (const key in audiospriteData) {
            if (!this._loadedSounds[key]) {
                this._loadedSounds[key] = audiospriteData[key];
                newAudiospriteData[key] = audiospriteData[key];
            }
        }

        return newAudiospriteData;
    };


    _getLoadedAudiospritesData() {
        const allAudiosprites = Urso.cache.assetsList.sound;
        const audiospriteData = {};

        for (let [key, audiosprite] of Object.entries(allAudiosprites)) {
            const audiospriteKey = key.replace('_audiospriteSound', '');
            const jsonKey = audiospriteKey + '_audiospriteJson';
            const json = Urso.cache.assetsList.json[jsonKey];

            if (!json)
                continue;

            audiospriteData[audiospriteKey] = { json: json.data, audiosprite: audiosprite.data };
        }

        return audiospriteData;
    }

    _groupLoadedHandler() {
        const audiospriteData = this._getLoadedAudiospritesData();

        if (Object.keys(audiospriteData).length === 0)
            return false;

        const uploadedAudiospriteData = this._getUploadedSounds(audiospriteData);

        if (Object.keys(uploadedAudiospriteData).length === 0)
            return false;

        const eventsCfg = this._parseConfig();
        const soundData = { sounds: { ...uploadedAudiospriteData }, eventsCfg };

        this.emit(Urso.events.MODULES_SOUND_MANAGER_UPDATE_CFG, soundData);
        return true;
    };

    _subscribe() {
        this.addListener(Urso.events.MODULES_ASSETS_GROUP_LOADED, this._groupLoadedHandler.bind(this), true);
    };
}

module.exports = ModulesLogicSounds;
