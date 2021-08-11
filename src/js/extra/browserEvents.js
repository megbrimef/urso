class ExtraBrowserEvents {
    constructor() {
        this.singleton = true;

        this.RESIZE_DELAY = 250; //delay for resize event (browser will refresh his own params)

        this.resizeHandler = this.resizeHandler.bind(this);
        this.visibilitychangeHandler = this.visibilitychangeHandler.bind(this);

        this.init();
    }

    init() {
        document.addEventListener("visibilitychange", this.visibilitychangeHandler);

        window.addEventListener('resize', this.resizeHandler);
        window.addEventListener('orientationchange', this.resizeHandler);
        document.addEventListener('fullscreenchange', this.resizeHandler);
        document.addEventListener('webkitfullscreenchange', this.resizeHandler);
        document.addEventListener('mozfullscreenchange', this.resizeHandler);
    }

    visibilitychangeHandler() {
        this.emit(Urso.events.EXTRA_BROWSEREVENTS_WINDOW_VISIBILITYCHANGE, document.visibilityState);
    }

    resizeHandler() {
        this.emit(Urso.events.EXTRA_BROWSEREVENTS_WINDOW_RESIZE, false, this.RESIZE_DELAY);
    }
}

module.exports = ExtraBrowserEvents;
