class SoundSprite {
    constructor({ name, url, format }) {
        this._player = this._makePlayer(url, format);
        this._name = name;

        this._id = null;
        this._loop = false;
        this._volume = 1;
        this._relaunch = false;
        this._events = [];
        this._eventsQueue = [];
        this._isAudioUnlocked = false;

        this._reactToEvent = this._reactToEvent.bind(this);

        this._subscribePlayerEvents();
    };

    _makePlayer(url, extension) {
        return new Howl({
            src: [url],
            format: extension,
            preload: true
        });
    };

    _subscribePlayerEvents() {
        this._player.on('unlock', () => {
            this._isAudioUnlocked = true;
            this._onUnlock(this._name);
        });

        this._player.on('end', id => {
            if (id === this._id && !this._loop)
                this._id = null;
        });
    };

    canPlayCheck() {
        return this._isAudioUnlocked;
    };

    play({ loop = false, volume = this._volume, relaunch = false }) {
        if (!this.canPlayCheck() || (this._id && !relaunch))
            return false;

        this.stop();

        const soundName = this._player._sprite[name] ? name : '__default';
        this._id = this._player.play(soundName);

        this.setRelaunch(relaunch);
        this.setLoop(loop);
        this.setVolume(volume);

        return true;
    };

    setLoop(loop = false) {
        this._loop = loop;
        this._player.loop(loop, this._id);
    };

    setVolume(volume = 1) {
        this._volume = volume;
        this._player.volume(volume, this._id);
    };

    setRelaunch(needRelaunch = false) {
        this._relaunch = needRelaunch;
    };

    stop() {
        if (!this._id)
            return;

        this._player.stop(this._id);
        this._id = null;
    };

    pause() {
        if (this.canPlayCheck() || this._player.playing(this._id))
            this._player.pause(this._id);
    };

    resume() {
        if (this.canPlayCheck() && !this._player.playing(this._id))
            this._player.play(this._id);
    };

    updateEvents(events) {
        this._customUnsubscribe();

        this._events = events;

        this._customSubscribe();
    };

    _setEventCallback(event) {
        return function () {
            const params = this._events[event];
            this._reactToEvent(params);
        };
    };

    _onUnlock(){
        this._runEventsFromQueue();
    };

    _runEventsFromQueue(){
        this._eventsQueue.forEach(this._reactToEvent);
        this._eventsQueue = [];
    };

    _addEventToQueue(data){
        this._eventsQueue.push(data);
    };

    _reactToEvent({ action, loop, relaunch }) {
        const self = this;
        const params = { loop, relaunch };

        if (!self[action])
            Urso.logger.error(`Sound action '${action}' not found!`);

        if(!this._isAudioUnlocked)
            this._addEventToQueue({ action, loop, relaunch });

        self[action](params);
    };

    _customSubscribe() {
        for (const event in this._events) {
            this.addListener(event, this._setEventCallback(event).bind(this), true);
        }
    };

    _customUnsubscribe() {
        for (const event in this._events) {
            this.removeListener(event, this._setEventCallback(event).bind(this), true);
        }
    };
};

module.exports = SoundSprite;