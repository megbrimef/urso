const ComponentsBaseController = require('./../base/controller');

class ComponentsDeviceRotateController extends ComponentsBaseController {

  constructor(params) {
    super(params);

    this._created = false;
    this._div = null;
    this._orientation = null;
    this._resolutionsConfig = null;
  }

  create() {
    if (Urso.device.desktop)
      return;

    this._resolutionsConfig = Urso.getInstance('Modules.Scenes.ResolutionsConfig').contents || [];

    this._createDom();
    this._updateOrientation();
    this._updateVisibility();
    this._created = true;
  }

  _createDom() {
    this._div = document.createElement('div');
    this._div.className = 'fullscreen device-rotate';
    this._div.style.touchAction = 'none';
    this._div.style.visibility = 'hidden';

    document.body.prepend(this._div);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'fullscreen-info';
    this._div.appendChild(infoDiv);
    const image = document.createElement('img');
    image.src = `${Urso.config.gamePath}assets/images/fullscreen/rotate.png`;
    const span = document.createElement('span');
    span.innerText = 'Please rotate device';

    infoDiv.appendChild(image);
    infoDiv.appendChild(span);
  }

  get _showOnLandscape() {
    if (!this._resolutionsConfig) return false;

    return !this._resolutionsConfig.find(resolution => resolution.orientation === Urso.device.ScreenOrientation.LANDSCAPE);
  }

  get _showOnPortrait() {
    if (!this._resolutionsConfig) return false;

    return !this._resolutionsConfig.find(resolution => resolution.orientation === Urso.device.ScreenOrientation.PORTRAIT);
  }

  get _isPortrait() {
    return this._orientation === Urso.device.ScreenOrientation.PORTRAIT;
  }

  get _needShow() {
    return (this._orientation === Urso.device.ScreenOrientation.PORTRAIT && this._showOnPortrait) ||
      (this._orientation !== Urso.device.ScreenOrientation.PORTRAIT && this._showOnLandscape)
  }

  set _isVisible(needShowDiv) {
    this._div.style.visibility = needShowDiv ? 'visible' : 'hidden';
  }

  _updateOrientation() {
    this._orientation = innerWidth > innerHeight ? Urso.device.ScreenOrientation.LANDSCAPE : Urso.device.ScreenOrientation.PORTRAIT;
  }

  _updateVisibility() {
    this._isVisible = this._needShow;
  }

  _resizeHandler() {
    if (!this._created)
      return;

    this._updateOrientation();
    this._updateVisibility();
  }

  _subscribeOnce() {
    if (Urso.device.desktop)
      return;

    this.addListener(Urso.events.EXTRA_BROWSEREVENTS_WINDOW_RESIZE, this._resizeHandler.bind(this));
  }
}

module.exports = ComponentsDeviceRotateController;
