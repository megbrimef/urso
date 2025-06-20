import ComponentsBaseController from "./../base/controller";

class ComponentsLoaderController extends ComponentsBaseController {
  loadUpdate(loadProgress) {
    this.setLoadProgress(loadProgress);
  }

  create() {
    this.setMask();

    this.tween = Urso.getInstance("Lib.Tween");
    const obj = Urso.findOne("^qqqq");
    let from = { y: 100 };
    let to = { y: 500 };

    // debugger
    const run = () => {
        const t = gsap.timeline();

        t.to(from, { 
            ...to,
            duration: 1,
            onUpdate: () => {
                obj.y = from.y
            },
            onComplete: () => {
                obj.y = 100;
                from = { y: 100 }
                to = { y: 500 }
                run();
            }
        })
    };
    run();
    //todo remove all objects
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

    this.loaderBgMask._baseObject.scale.x = val;
    this.loadAmountText.text = this.formatAmountText(val);
  }

  get componentCreated() {
    return !!this.loadAmountText && !!this.loaderBg && !!this.loaderBgMask;
  }

  get loadAmountText() {
    return Urso.findOne(".loadAmountText");
  }

  get loaderBg() {
    return Urso.findOne("^loaderBg");
  }

  get loaderBgMask() {
    return Urso.findOne("^loaderBgMask");
  }
}

export default ComponentsLoaderController;
