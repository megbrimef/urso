class SoundSprite {
    constructor({ name, sprite, audiosprite }) {
        this._player = null;
        this._totalVolume = 0;
        this._makePlayer(sprite, audiosprite);

        this._name = name;
        this._sprite = sprite;

        this._soundsState = this._initSoundsState();

        this._eventsCfg = {};
        this._fadeTweens = {};
        this._eventsQueue = [];
        this._isAudioUnlocked = false;

        this._reactToEvent = this._reactToEvent.bind(this);
    };


    _initSoundsState() {
        const soundsNames = Object.keys(this._sprite);
        const soundsStateObj = {};

        soundsNames.forEach(soundName => {
            soundsStateObj[soundName] = {
                id: null,
                loop: false,
                volume: 1,
                relaunch: false,
                _muted: false
            }
        });

        return soundsStateObj;
    }

    _makePlayer(sprite, audiosprite) {
        var reader = new FileReader();
        reader.readAsDataURL(audiosprite);
        reader.onloadend = () => {
            var base64data = reader.result;
            this._player = new Howl({
                src: base64data,
                sprite
            });
            this._subscribePlayerEvents();
        }
    };

    _subscribePlayerEvents() {
        this._player.on('unlock', () => setTimeout(() => {
            this._isAudioUnlocked = true;
            this._onUnlock();
        }, 1000));

        this._player.on('end', id => {
            const soundState = this._getSoundStateById(id);

            if (!soundState)
                return Urso.logger.error(`SoundSprite error: soundState for id '${id}' not found!`);

            if (!soundState.loop)
                soundState.id = null;
        });
    };

    _getSoundStateById(id) {
        for (const [name, state] of Object.entries(this._soundsState)) {
            if (state.id === id) {
                return {
                    id: { ...state, name }
                }
            }
        }
    }

    canPlayCheck() {
        return this._isAudioUnlocked;
    };

    play({ loop = false, volume = this._volume, relaunch = false, soundKey }) {
        if (!this.canPlayCheck() || (this._soundsState[soundKey].id !== null && !relaunch))
            return false;

        this.stop({ soundKey });

        this._soundsState[soundKey].id = this._player.play(soundKey);

        this.setRelaunch(soundKey, relaunch);
        this.setLoop(soundKey, loop);
        this.setVolume(soundKey, volume);

        return true;
    };

    setLoop(soundKey, loop = false) {
        this._soundsState[soundKey].loop = loop;
        this._player.loop(loop, this._soundsState[soundKey].id);
    };

    setVolume(soundKey, volume = 1, saveVolumeState = true) {
        this._player.volume(volume, this._soundsState[soundKey].id);
        
        if(volume === 0) {
            this._changeSoundMute(true);
            return;
        }else if(this._soundsState[soundKey]._muted) {
            this._changeSoundMute(false);
        }

        if(saveVolumeState) {
            this._soundsState[soundKey].volume = volume;
        }
    };

    setAllVolume(volume) {
        this._totalVolume = volume;
        this._player._volume = volume;

        if (this.canPlayCheck()) {
            this._updateVolume();
        }
    }

    _updateVolume() {
        const soundKeys = Object.keys(this._soundsState);
        this._player._volume = this._totalVolume;
        soundKeys.forEach(soundKey => {
            const soundVolume = this._soundsState[soundKey].volume * this._totalVolume;
            this.setVolume(soundKey, soundVolume, false);
        });
    }

    _changeSoundMute(needMute) {
        this._player.mute(needMute, soundKey);
        this._soundsState[soundKey]._muted = needMute;
    }

    setRelaunch(soundKey, needRelaunch = false) {
        this._soundsState[soundKey].relaunch = needRelaunch;
    };

    stop({ soundKey }) {
        if (!this._soundsState[soundKey].id)
            return;

        this._player.stop(this._soundsState[soundKey].id);
        this._soundsState[soundKey].id = null;
    };

    pause({ soundKey }) {
        if (this.canPlayCheck() || this._player.playing(this._soundsState[soundKey].id))
            this._player.pause(this._soundsState[soundKey].id);
    };

    resume({ soundKey }) {
        if (this.canPlayCheck() && !this._player.playing(this._soundsState[soundKey].id))
            this._player.play(this._soundsState[soundKey].id);
    };

    updateEvents(eventsCfg) {
        this._customUnsubscribe();
        this._saveEvents(eventsCfg);
        this._customSubscribe();
    };

    _stopPrevFade(soundKey) {
        if(this._fadeTweens[soundKey]) {
            this._fadeTweens[soundKey].kill();
        }

        delete this._fadeTweens[soundKey];
    }

    _startFade({ fadeTo, fadeDuration, soundKey }) {
        const fadeFrom = this._soundsState[soundKey].volume;
        const delta = fadeTo - fadeFrom;

        const onUpdate = () => {
            const volume  = (fadeFrom + (delta * this._fadeTweens[soundKey].ratio)) * this._totalVolume;
            this.setVolume(soundKey, volume);
        };

        this._fadeTweens[soundKey] = gsap.to({}, fadeDuration / 1000, { onUpdate });
    }

    fade({ fadeTo = 1, fadeDuration = 200, startSound = false, soundKey, ...others }) {
        if(startSound) {
            this.play({ ...others, soundKey });
        }
        if(this._soundsState[soundKey].id === null) {
            return;
        }

        this._stopPrevFade(soundKey);
        this._startFade({ fadeTo, fadeDuration, soundKey });
    }

    _saveEvents(eventsCfg) {
        this._eventsCfg = eventsCfg;
    }

    _setEventCallback(soundKey, event) {
        return function () {
            const params = this._eventsCfg[soundKey].events[event];

            this._reactToEvent(soundKey, params);
        };
    };

    _onUnlock() {
        this._runEventsFromQueue();
        this._updateVolume();
    };

    _runEventsFromQueue() {
        this._eventsQueue.forEach(event => this._reactToEvent(event.soundKey, event));
        this._eventsQueue = [];
    };

    _addEventToQueue(data) {
        this._eventsQueue.push(data);
    };

    _reactToEvent(soundKey, { action, volume, ...otherParams }) {
        volume *= this._totalVolume;
        const self = this;
        const params = { ...otherParams, action, soundKey, volume };

        if (!self[action])
            return Urso.logger.error(`SoundSprite error: Sound action '${action}' not found!`);

        if (!this._isAudioUnlocked)
            this._addEventToQueue({ ...params, action });

        self[action](params);
    };

    _customSubscribe() {
        for (const soundKey in this._eventsCfg) {
            const { events = {} } = this._eventsCfg[soundKey];

            for (const event in events) {
                this.addListener(event, this._setEventCallback(soundKey, event).bind(this), true);
            }
        }
    };

    _customUnsubscribe() {
        for (const event in this._eventsCfg) {
            this.removeListener(event, this._setEventCallback(event).bind(this), true);
        }
    };
};

module.exports = SoundSprite;