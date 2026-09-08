import ComponentsBaseController from "./../base/controller";

class ComponentsLoaderController extends ComponentsBaseController {
  constructor(options) {
    super(options);
    // FIXED: cache getters to avoid repeated global searches — initialize private fields for lazy loading
    this._loadAmountText = null;
    this._loaderBg = null;
    this._loaderBgMask = null;
  }

  loadUpdate(loadProgress) {
    this.setLoadProgress(loadProgress);
  }

  create() {
    this.setMask();
  }

  setMask() {
    if (this.loaderBg && this.loaderBgMask)
      this.loaderBg._baseObject.mask = this.loaderBgMask._baseObject;
  }

  formatAmountText(text) {
    return `${text}%`;
  }

  setLoadProgress(val) {
    if (!this.componentCreated) return;

    // FIXED: val is 0-100, not 0-1 — divide by 100 to get correct scale
    this.loaderBgMask._baseObject.scale.x = val / 100;
    this.loadAmountText.text = this.formatAmountText(val);
  }

  get componentCreated() {
    return !!this.loadAmountText && !!this.loaderBg && !!this.loaderBgMask;
  }

  get loadAmountText() {
    // FIXED: cache result to avoid repeated global searches — use component-scoped search instead
    if (!this._loadAmountText) this._loadAmountText = this.common.findOne(".loadAmountText");
    return this._loadAmountText;
  }

  get loaderBg() {
    // FIXED: cache result to avoid repeated global searches — use component-scoped search instead
    if (!this._loaderBg) this._loaderBg = this.common.findOne("^loaderBg");
    return this._loaderBg;
  }

  get loaderBgMask() {
    // FIXED: cache result to avoid repeated global searches — use component-scoped search instead
    if (!this._loaderBgMask) this._loaderBgMask = this.common.findOne("^loaderBgMask");
    return this._loaderBgMask;
  }
}

export default ComponentsLoaderController;
