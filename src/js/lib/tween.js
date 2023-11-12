/**
 * @deprecated
 * tween interface over gsap timeline
 */
class LibTween {

    constructor() {
        this.singleton = true;

        this._tweenIndex = 0;
        this._tweens = {};
    }

    removeAll() {
        for (let k in this._tweens)
            this._tweens[k].stop();

        this._tweens = {};
    };

    add(object) {
        const key = this._keyGenerate();

        const tl = gsap.timeline({
            repeat: 1,
            onComplete: () => { this._onCompleteHandler(key) },
            onUpdate: () => { this._onUpdateHandler(key) }
        });

        const tween = {
            id: key,
            isRunning: false,
            target: object,
            to: this._to,
            start: this._start,
            pause: this._pause,
            resume: this._resume,
            stop: this._stop,

            _timeScale: 1,
            get timeScale() {
                return this._timeScale;
            }, set timeScale(a) {
                return this._timeScale;
            },
            _timeline: tl,
            _complete: false,
            _paused: true,
            _functions: {
                onStart: [],
                onUpdate: [],
                onComplete: []
            }
        };

        //need to add some functions
        tween.onComplete = {
            add: (f) => {
                tween._functions.onComplete.push(f);
                return tween;
            }
        };

        tween.onStart = {
            add: (f) => {
                tween._functions.onStart.push(f);
                return tween;
            }
        };

        tween.onUpdate = {
            add: (f) => {
                tween._functions.onUpdate.push(f);
                return tween;
            }
        };

        this._tweens[key] = tween;

        return tween;
    };

    _keyGenerate() {
        this._tweenIndex++;
        return (new Date()).getTime() + '_' + this._tweenIndex;
    };

    //todo easing
    _to(propsTo, duration, easing = undefined, autostart = false, startDelay = 0) {
        const params = Urso.helper.objectClone(propsTo, 10);
        params.duration = duration / 1000;
        params.easing = easing;
        params.delay = startDelay;

        this._timeline.to(this.target, params);
        //this.pause();

        if (autostart)
            this.start();

        return this;
    };

    _start() {
        for (let i = 0; i < this._functions.onStart.length; i++)
            this._functions.onStart[i]();

        this.resume();
        return this;
    };

    _pause() {
        this._paused = true;
        this.isRunning = false;
        this._timeline.pause();

        return this;
    };

    _resume() {
        this._paused = false;
        this.isRunning = true;
        this._timeline.resume();

        return this;
    };

    _stop() {
        this.pause();
        this._timeline.kill();
        this._complete = true;

        return this;
    };

    _onUpdateHandler(tweenKey) {
        const tween = this._tweens[tweenKey];
        const percentage = ~~(tween._timeline.progress() * 100);

        for (let i = 0; i < tween._functions.onUpdate.length; i++)
            tween._functions.onUpdate[i](tween, percentage);
    }

    _onCompleteHandler(tweenKey) {
        const tween = this._tweens[tweenKey];
        const onComplete = tween._functions.onComplete;

        for (let i = 0; i < onComplete.length; i++)
            onComplete[i]();
    }
}

module.exports = LibTween;