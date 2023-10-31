const ComponentsBaseController = require('./../base/controller');

class ComponentsSoundInitialPopupController extends ComponentsBaseController {

    constructor() {
        super();

        this.yesButton = null;
        this.noButton = null;
    }

    create() {
        this.yesButton = this.common.findOne('^soundInitialPopupButtonYesGraphics');
        this.noButton = this.common.findOne('^soundInitialPopupButtonNoGraphics');
    }

    _tintHandler({ buttonName, pointerOver }) {
        let button = buttonName === 'yes' ? this.yesButton : this.noButton;
        button._baseObject.tint = (pointerOver) ? 0xd4be69 : 0xFFFFFF;
    }

    _buttonPressHandler({ name }) {
        switch (name) {
            case 'soundInitialPopupButtonYesHit':
                this.emit(Urso.events.MODULES_SOUND_MANAGER_SET_GLOBAL_VOLUME, 1);
                break;
            case 'soundInitialPopupButtonNoHit':
                this.emit(Urso.events.MODULES_SOUND_MANAGER_SET_GLOBAL_VOLUME, 0);
                break;
            default:
                return;
        }

        this.common.object.visible = false;
    }

    _subscribeOnce() {
        this.addListener('components.soundInitialPopup.pointerAction.popupButton', this._tintHandler.bind(this));
        this.addListener(Urso.events.MODULES_OBJECTS_HIT_AREA_PRESS, this._buttonPressHandler.bind(this));
    }
}

module.exports = ComponentsSoundInitialPopupController;