class SoundManagerController {
    constructor() {
        this._howler = null;
        this._codecsToCheck = ['ogg', 'm4a', 'mp3', 'wav'];
        this._selectedCodec = null;
        this._sounds = {};

        this._setCodec();

        this._updateSoundsCfgHandler = this._updateSoundsCfgHandler.bind(this);
        this._doHandler = this._doHandler.bind(this);
    }

    _setCodec() {
        for (const codec of this._codecsToCheck) {
            if (Howler.Howler.codecs(codec)) {
                this._selectedCodec = codec;
                return;
            }
        }
    };

    _checkCodec(codec) {
        const checkResult = Howler.Howler.codecs(codec);

        if (!checkResult)
            Urso.logger.error(`Codec ${codec} is not supperted!`);

        return checkResult;
    };

    _createSounds(sounds) {
        for (const soundKey in sounds) {
            const { data, extension, events = [] } = sounds[soundKey];

            if (!this._sounds[soundKey] && this._checkCodec(extension)) {
                const blob = new Blob([data], { type: `audio/${extension}` });
                const url = URL.createObjectURL(blob);

                const soundSprite = this.getInstance('SoundSprite', {
                    name: soundKey,
                    url: url,
                    format: extension
                });

                this._sounds[soundKey] = soundSprite;

                this._sounds[soundKey].updateEvents(events);
            }
        }
    };

    _setEventsHandler() {
        const soundsCfg = Urso.localData.get('sounds.cfg') || {};

        for (const key in this._sounds)
            if (soundsCfg[key])
                this._sounds[key].updateEvents(soundsCfg[key]);
    };

    _checkSoundExists(name) {
        if (this._sounds[name])
            return true;

        Urso.logger.error(`Sound with key ${name} wasn't found!`);
    };

    _updateSoundsCfgHandler(soundsCfg) {
        this._createSounds(soundsCfg);
    };

    _doHandler({ action, name, behavior }) {
        if (this._checkSoundExists(name))
            this._sounds[name][action](behavior);
    };

    /**
     * 
     * @param {Number} volume (0-1)
     */
    _globalVolumeChange(volume) {
        volume = Urso.math.intMakeBetween(volume, 0, 1);

        for (const key in this._sounds)
            this._sounds[key].setVolume(volume);
    }

    _subscribe() {
        this.addListener(Urso.events.MODULES_SOUND_MANAGER_UPDATE_CFG, this._updateSoundsCfgHandler, true);
        this.addListener(Urso.events.MODULES_LOGIC_SOUNDS_DO, this._doHandler, true);
        this.addListener(Urso.events.MODULES_SOUND_MANAGER_SET_GLOBAL_VOLUME, this._globalVolumeChange.bind(this), true);
    };
};

module.exports = SoundManagerController;
