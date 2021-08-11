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
                const params = {
                    action: obj.action || 'play',
                    relaunch: obj.relaunch || false,
                    loop: obj.loop || false
                };

                if (!mappedCfg[obj.soundKey])
                    mappedCfg[obj.soundKey] = {
                        events: {}
                    };

                mappedCfg[obj.soundKey].events[obj.event] = params;
            });
        });

        return mappedCfg;
    };

    _getUploadedSounds(allSounds) {
        const newSounds = {};

        for (const key in allSounds) {
            const { data, extension, name, url } = allSounds[key];

            if (this._loadedSounds[key] && this._loadedSounds[key] !== url)
                Urso.logger.error('Duplicate sound key detected!')

            if (!this._loadedSounds[key]) {
                this._loadedSounds[key] = url;
                newSounds[key] = { data, extension, name };
            }
        }

        return newSounds;
    };

    _groupLoadedHandler() {
        const allSounds = Urso.cache.assetsList.sound;

        if (Object.keys(allSounds).length === 0)
            return false;

        const uploadedSounds = this._getUploadedSounds(allSounds);

        if (Object.keys(uploadedSounds).length === 0)
            return false;

        const mappedCfg = this._parseConfig();
        const mergedSoundsCfg = {};

        for (const soundKey in uploadedSounds) {
            const uplodedSound = uploadedSounds[soundKey];
            const soundCfg = mappedCfg[soundKey];

            if (uplodedSound && soundCfg)
                mergedSoundsCfg[soundKey] = { ...uplodedSound, ...soundCfg };
        }

        this.emit(Urso.events.MODULES_SOUND_MANAGER_UPDATE_CFG, mergedSoundsCfg);
        return true;
    };

    _subscribe() {
        this.addListener(Urso.events.MODULES_ASSETS_GROUP_LOADED, this._groupLoadedHandler.bind(this), true);
    };
}

module.exports = ModulesLogicSounds;
