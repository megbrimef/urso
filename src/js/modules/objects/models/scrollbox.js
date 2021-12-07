class ModulesObjectsModelsScrollbox extends Urso.Core.Modules.Objects.BaseModel {
    constructor(params) {
        super(params);

        this.type = Urso.types.objects.SCROLLBOX;
        this._addBaseObject();
        this._createContent();
    }

    setupParams(params) {
        super.setupParams(params);

        this.content = Urso.helper.recursiveGet('content', params, []);
        this.dragScroll = Urso.helper.recursiveGet('dragScroll', params, true);
        this.scrollType = Urso.helper.recursiveGet('scrollType', params, 3);
    }

    _getScrollboxParams(){
        return {
            boxWidth: this.width,
            boxHeight: this.height,
            dragScroll: this.dragScroll,
            fade: true,
            fadeScrollbarTime: 300
        }
    }

    _setScrollWidth(){
        if(this.scrollType === 1 || this.scrollType === 0){
            this._baseObject.scrollWidth = this.width;
            this._baseObject.overflowX = 'hidden';
        }
    }

    _setScrollHeight(){
        if(this.scrollType === 2 || this.scrollType === 0){
            this._baseObject.scrollHeight = this.height;
            this._baseObject.overflowY = 'hidden'
        }
    }

    _createContent(){
        this.content.forEach(child => {
            let object = Urso.objects.create(child)
            this._baseObject.content.addChild(object._baseObject)
        })

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