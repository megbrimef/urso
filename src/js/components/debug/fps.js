class ComponentsDebugFps {

    constructor() {
        this._coordsText;

        this.create = this.create.bind(this);
        this.update = this.update.bind(this);

        this.lastUpdateTime = 0;
        this.frames = 0;
    }

    create() {
        this._coordsText = this.common.findOne('^debugFps')
        this.update();
        return true;
    };

    update() {
        const currentTime = Urso.time.get();
        this.frames++;

        if (currentTime - this.lastUpdateTime < 1000)
            return;

        const fps = Math.round(1000 * this.frames / (currentTime - this.lastUpdateTime));
        this.lastUpdateTime = currentTime;
        this.frames = 0;

        const fpsData = Urso.scenes.getFpsData();
        this._coordsText.text = `fps: ${fps}, sceneFps: ${fpsData.fps}, limit: ${fpsData.limit}`;
    };

}

module.exports = ComponentsDebugFps;
