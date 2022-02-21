ComponentsBaseController = require('./../base/controller.js');

class ComponentsFullscreenController extends ComponentsBaseController {

  constructor(params) {
    super(params);

    this._fullscreenActivator = null;
    this._resolutionsConfig = null;
    this.lastResizeFullscreenResult;

    this.createActivator();
    this._resizeHandler();
  }

  createActivator() {
    if (this._isCriOS)
      return;

    this._resolutionsConfig = Urso.getInstance('Modules.Scenes.ResolutionsConfig').contents || [];

    if (Urso.device.desktop)
      this._fullscreenActivator = this.getInstance('Desktop');
    else if (Urso.device.iOS)
      this._fullscreenActivator = this.getInstance('Ios');
    else if (Urso.device.android)
      this._fullscreenActivator = this.getInstance('Android');

    if (this._fullscreenActivator)
      this._fullscreenActivator.init();
  }

  get _isCriOS() {
    return navigator.userAgent.indexOf('CriOS') !== -1;
  }

  get _orientationsConfig() {
    return Urso.getInstance('Modules.Scenes.ResolutionsConfig')._orientations || [];
  }

  get _showOnLandscape() {
    return this._resolutionsConfig.find(resolution => resolution.orientation === Urso.device.ScreenOrientation.LANDSCAPE);
  }

  get _showOnPortrait() {
    return this._resolutionsConfig.find(resolution => resolution.orientation === Urso.device.ScreenOrientation.PORTRAIT);
  }

  get _isPortrait() {
    return innerWidth > innerHeight ? Urso.device.ScreenOrientation.PORTRAIT : Urso.device.ScreenOrientation.LANDSCAPE;
  }

  get isFullscreen() {
    return this._fullscreenActivator.isFullscreen;
  }

  _resizeHandler() {
    const isFullscreen = this.isFullscreen;

    if (this.lastResizeFullscreenResult === isFullscreen)
      return;

    this.lastResizeFullscreenResult = isFullscreen;
    Urso.localData.set('fullscreen.isFullscreen', isFullscreen);
    this.emit(Urso.events.COMPONENTS_FULLSCREEN_CHANGE, isFullscreen);
  }

  _subscribeOnce() {
    this.addListener(Urso.events.EXTRA_BROWSEREVENTS_WINDOW_RESIZE, this._resizeHandler.bind(this));
  }
}

module.exports = ComponentsFullscreenController;
