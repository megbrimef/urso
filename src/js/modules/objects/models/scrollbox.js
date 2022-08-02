class ModulesObjectsModelsScrollbox extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.SCROLLBOX;
        this._addBaseObject();
        this._createScrollContent();
    }

    setupParams(params) {
        super.setupParams(params);

        this.scrollContent = Urso.helper.recursiveGet('scrollContent', params, []);
        this.dragScroll = Urso.helper.recursiveGet('dragScroll', params, true);
        this.scrollType = Urso.helper.recursiveGet('scrollType', params, 'auto'); // hidden / hiddenVertical / hiddenHorizontal / auto

        this.width = Urso.helper.recursiveGet('width', params, false); //number format
        this.height = Urso.helper.recursiveGet('height', params, false); //number format
    }

    _getScrollboxParams() {
        return {
            boxWidth: this.width,
            boxHeight: this.height,
            dragScroll: this.dragScroll,
            fade: false,
            fadeScrollbarTime: 300
        }
    }

    _setScrollWidth() {
        if (this.scrollType === 'hiddenHorizontal' || this.scrollType === 'hidden') {
            this._baseObject.scrollWidth = this.width;
            this._baseObject.overflowX = 'hidden';
        }
    }

    _setScrollHeight() {
        if (this.scrollType === 'hiddenVertical' || this.scrollType === 'hidden') {
            this._baseObject.scrollHeight = this.height;
            this._baseObject.overflowY = 'hidden';
        }
    }

    _createScrollContent() {
        this.scrollContent.forEach(child => {
            let object = Urso.objects.create(child);
            this._baseObject.content.addChild(object._baseObject);
        });

        this._baseObject.update();
    }

    _addBaseObject() {
        const params = this._getScrollboxParams();

        const Scrollbox = require('pixi-scrollbox').Scrollbox;
        this._baseObject = new Scrollbox(params);

        this._setScrollHeight();
        this._setScrollWidth();
    };
}

module.exports = ModulesObjectsModelsScrollbox