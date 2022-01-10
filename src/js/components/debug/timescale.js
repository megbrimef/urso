class ComponentsDebugTimescale {

    constructor() {
        this._timescaleText;

        this.create = this.create.bind(this);

        this.scaleStep = 0.5;
        this.scaleInfoDuration = 2000;

        this._minusButtonsCodes = [109, 189];
        this._plusButtonsCodes = [107, 187];
        this._hideId;
    }

    create() {
        document.addEventListener('keydown', this.keyPressTest.bind(this));
        this._timescaleText = this.common.findOne('^debugTimescaleValue');
        return true;
    };

    keyPressTest(e) {
        const evtobj = window.event ? event : e;

        if (!evtobj.altKey) //alt and +/-
            return;

        let factor = 0;

        if (this._minusButtonsCodes.includes(evtobj.keyCode)) {
            factor = -1;
        }

        if (this._plusButtonsCodes.includes(evtobj.keyCode)) {
            factor = 1;
        }

        if (!factor)
            return;

        const timescaleDiff = Urso.scenes.timeScale >= 1 ? this.scaleStep * factor : (this.scaleStep * factor) * 0.1;
        let timescaleNewValue = Urso.scenes.timeScale + timescaleDiff;

        if (timescaleNewValue < 0.1)
            timescaleNewValue = 0.1;

        Urso.scenes.timeScale = Urso.math.roundToDigits(timescaleNewValue, 2);

        this._timescaleText.text = Urso.scenes.timeScale;
        this._timescaleText.visible = true;

        if (this._hideId)
            clearTimeout(this._hideId);

        this._hideId = setTimeout(() => this._timescaleText.visible = false, this.scaleInfoDuration);
    }

}

module.exports = ComponentsDebugTimescale;
