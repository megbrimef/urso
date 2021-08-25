class SoundManagerController {
    constructor() {
        this._systemVolume = 1;
        this._globalVolume = 0;

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

    _createSounds(soundData) {
        const { eventsCfg, sounds } = soundData;

        for (const soundKey in sounds) {

            if (this._sounds[soundKey])
                continue;

            const { audiosprite, json } = sounds[soundKey];

            const soundSptite = this.getInstance('SoundSprite', {
                sprite: json.sprite,
                name: soundKey,
                audiosprite
            });

            this._sounds[soundKey] = soundSptite;

            soundSptite.updateEvents(eventsCfg);
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
        this._globalVolume = Urso.math.intMakeBetween(volume, 0, 1);
        this._updateSoundVolume();
    }

    _visibilityChange(state) {
        this._systemVolume = ~~(state === 'visible');
        this._updateSoundVolume();
    }
    _updateSoundVolume() {
        const totalVolume = this._globalVolume * this._systemVolume;
        for (const key in this._sounds)
            this._sounds[key].setAllVolume(totalVolume);
    }

    _subscribe() {
        this.addListener(Urso.events.MODULES_SOUND_MANAGER_UPDATE_CFG, this._updateSoundsCfgHandler, true);
        this.addListener(Urso.events.MODULES_LOGIC_SOUNDS_DO, this._doHandler, true);
        this.addListener(Urso.events.MODULES_SOUND_MANAGER_SET_GLOBAL_VOLUME, this._globalVolumeChange.bind(this), true);
        this.addListener(Urso.events.EXTRA_BROWSEREVENTS_WINDOW_VISIBILITYCHANGE, this._visibilityChange.bind(this), true);
    };
};

module.exports = SoundManagerController;
