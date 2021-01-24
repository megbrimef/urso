class ExtraBrowserEvents {
    constructor() {
        this.singleton = true;

        this.resizeHandler = this.resizeHandler.bind(this);
        this.visibilitychangeHandler = this.visibilitychangeHandler.bind(this);

        this.init();
    }

    init() {
        document.addEventListener("visibilitychange", this.visibilitychangeHandler);
        window.addEventListener('resize', this.resizeHandler);
        window.addEventListener('orientationchange', this.resizeHandler);

    }

    visibilitychangeHandler(){
        this.emit(Urso.events.EXTRA_BROWSEREVENTS_WINDOW_VISIBILITYCHANGE, document.visibilityState);
    }

    resizeHandler(){
        this.emit(Urso.events.EXTRA_BROWSEREVENTS_WINDOW_RESIZE);
    }
}

module.exports = ExtraBrowserEvents;
