class ComponentsDebugCoords {

    constructor() {
        this._coordsText;

        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
    }

    create() {
        this._coordsText = this.common.findOne('^debugCoords')
        this.update();
        return true;
    };

    update() {
        let coords = Urso.scenes.getMouseCoords();
        this._coordsText.text = 'x:' + Math.floor(coords.x) + '; y:' + Math.floor(coords.y);
    };

}

module.exports = ComponentsDebugCoords;
