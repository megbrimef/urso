const ComponentsBaseController = require('./../base/controller');

class ComponentsLoaderController extends ComponentsBaseController {

    constructor(options) {
        super(options);

        //load own assets

        //then create loader objects
        Urso.objects.create(this.getInstance('Template').objects);
    }

    assetsMount() {
        return false;
    }

    objectsMount() {
        return false;
    }

    loadUpdate(loadProgress) {
        this.setLoadProgress(loadProgress);
    }

    create() {
        this.setMask();
        //todo remove all objects
    }

    setMask() {
        if (this.loaderBg && this.loaderBgMask)
            this.loaderBg._baseObject.mask = this.loaderBgMask._baseObject
    }

    formatAmountText(text) {
        return `${text}%`;
    }

    setLoadProgress(val) {
        if (!this.componentCreated)
            return;

        this.loaderBgMask._baseObject.scale.x = val;
        this.loadAmountText.text = this.formatAmountText(val);
    }

    get componentCreated() {
        return !!this.loadAmountText && !!this.loaderBg && !!this.loaderBgMask;
    }

    get loadAmountText() {
        return Urso.findOne('.loadAmountText');
    }

    get loaderBg() {
        return Urso.findOne('^loaderBg');
    }

    get loaderBgMask() {
        return Urso.findOne('^loaderBgMask');
    }

}

module.exports = ComponentsLoaderController;
