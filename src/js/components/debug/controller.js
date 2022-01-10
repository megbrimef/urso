ComponentsBaseController = require('./../base/controller.js');

class ComponentsDebugController extends ComponentsBaseController {
    constructor(params) {
        super(params);

        this._logicBlocks = [
            'coords', 'fps', 'timescale' /*'renderStats', 'resolution'*/ //TODO
        ];

        this._visible = true;
        this._comObject = false;
        this._created;
    }

    create() {
        this._created = true;

        this._comObject = this.common.findOne('^debugContainer');
        this._show(true);

        Urso.helper.logicBlocksDo(this, 'create');
        return true;
    };

    update() {
        if (!this._created)
            return;

        Urso.helper.logicBlocksDo(this, 'update');
    };

    _show(visMode) {
        this._visible = (typeof visMode !== 'undefined') ? visMode : !this._visible;
        this._comObject.visible = this._visible;
    };
}

module.exports = ComponentsDebugController;