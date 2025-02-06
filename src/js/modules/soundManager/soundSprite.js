const DUMMY_SOUND_DELAY = 500; // ms
class SoundSprite {
    constructor({ name, sprite, audiosprite, codec }) {
        this._player = null;
        this._totalVolume = 0;

        this._name = name;
        this._sprite = sprite;
        this._codec = codec;

        this._eventsCfg = {};
        this._fadeTweens = {};
        this._eventsQueue = [];
        this._isAudioUnlocked = false;
        this._timeout = null;
        this._dummy = null;

        this._reactToEvent = this._reactToEvent.bind(this);
        this._audioUnlockHandler = this._audioUnlockHandler.bind(this);

        this._makePlayer(sprite, audiosprite);
        this._soundsState = this._initSoundsState();
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

    _makePlayer_Bak(sprite, audiosprite) {
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

    _makePlayer(sprite, audiosprite) {
        if (!this._codec) {
            return;
        }

        const reader = new FileReader();
        const blob = new Blob([audiosprite], { type: `audio/${this._codec}` });

        reader.onloadend = () => {
            var { result: src } = reader;
            this._player = new Howl({ src, sprite });
            this._subscribePlayerEvents();
        }

        reader.readAsDataURL(blob);
    };

    _audioUnlockHandler() {
        this._isAudioUnlocked = true;
        this._onUnlock();
        this.emit(Urso.events.MODULES_SOUND_MANAGER_CONTEXT_UNLOCKED);
    }

    _subscribePlayerEvents() {
        if (UrsoUtils.Howler._audioUnlocked) {
            this._audioUnlockHandler();
        } else {
            this._player.on('unlock', () => setTimeout(() => {
                this._audioUnlockHandler();
            }, 1000));
        }

        this._player.on('end', id => {
            const soundState = this._getSoundStateById(id);

            if (!soundState)
                return Urso.logger.error(`SoundSprite error: soundState for id '${id}' not found!`);

            if (!soundState.loop)
                soundState.id = null;
        });
    };

    _getSoundStateById(soundId) {
        return Object.values(this._soundsState).find(({ id }) => id === soundId);
    }

    canPlayCheck() {
        return this._isAudioUnlocked;
    };

    play({ soundKey, loop = false, volume = this._volume, relaunch = false, resetVolume = true }) {
        if (!this.canPlayCheck() || (this._soundsState[soundKey].id !== null && !relaunch))
            return false;

        this.stop({ soundKey });

        this._soundsState[soundKey].id = this._player.play(soundKey);

        this.setRelaunch(soundKey, relaunch);
        this.setLoop(soundKey, loop);

        if (!resetVolume) //set saved volume value
            volume = this._soundsState[soundKey].volume

        this.setVolume({ soundKey, volume });

        return true;
    };

    setLoop(soundKey, loop = false) {
        this._soundsState[soundKey].loop = loop;
        this._player.loop(loop, this._soundsState[soundKey].id);
    };

    setVolume({ soundKey, volume = 1, saveVolumeState = true }) {
        this._player.volume(volume, this._soundsState[soundKey].id);

        if (volume === 0) {
            this._changeSoundMute(true, soundKey);
            return;
        } else if (this._soundsState[soundKey]._muted) {
            this._changeSoundMute(false, soundKey);
        }

        if (saveVolumeState) {
            this._soundsState[soundKey].volume = volume;
        }
    };

    setAllVolume(volume) {
        this._totalVolume = volume;

        if (this._player) {
            this._player._volume = volume;
        }

        if (this.canPlayCheck()) {
            this._updateVolume();
        }
    }

    _updateVolume() {
        const soundKeys = Object.keys(this._soundsState);
        this._player._volume = this._totalVolume;
        soundKeys.forEach(soundKey => {
            const soundVolume = this._soundsState[soundKey].volume * this._totalVolume;
            this.setVolume({ soundKey, volume: soundVolume, saveVolumeState: false });
        });
    }

    _changeSoundMute(needMute, soundKey) {
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
        if (this._fadeTweens[soundKey]) {
            this._fadeTweens[soundKey].kill();
        }

        delete this._fadeTweens[soundKey];
    }

    _startFade({ fadeTo, fadeDuration, soundKey }) {
        const fadeFrom = this._soundsState[soundKey].volume;
        const delta = fadeTo - fadeFrom;

        const onUpdate = () => {
            const volume = (fadeFrom + (delta * this._fadeTweens[soundKey].ratio)) * this._totalVolume;
            this.setVolume({ soundKey, volume });
        };

        this._fadeTweens[soundKey] = gsap.to({}, fadeDuration / 1000, { onUpdate });
    }

    fade({ fadeTo = 1, fadeDuration = 200, startSound = false, soundKey, ...others }) {
        if (startSound) {
            this.play({ ...others, soundKey });
        }
        if (this._soundsState[soundKey].id === null) {
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

    playDummy() {
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }

        if (!Urso.device.iOS) {
            return;
        }

        this._timeout = setTimeout(() => {
            if (this._dummy) {
                this._dummy.stop();
                this._dummy.unload();
            }

            this._dummy = new Howl({
                src: `data:audio/x-wav;base64,UklGRooWAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YWYWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`,
                html5: true
            });

            this._dummy.play();
        }, DUMMY_SOUND_DELAY);
    }
};

module.exports = SoundSprite;