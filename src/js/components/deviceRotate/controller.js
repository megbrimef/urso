ComponentsBaseController = require('./../base/controller.js');

class ComponentsDeviceRotateController extends ComponentsBaseController {
  constructor(params) {
    super(params);

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
  }

  _createDom() {
    this._div = document.createElement('div');
    this._div.className = 'fullscreen';
    this._div.style.touchAction = 'none';
    this._div.style.visibility = 'hidden';

    document.body.prepend(this._div);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'fullscreen-info';
    this._div.appendChild(infoDiv);

    const image = document.createElement('img');
    image.src = '/assets/images/fullscreen/rotate.png';
    const span = document.createElement('span');
    span.innerText = 'Please rotate device';

    infoDiv.appendChild(image);
    infoDiv.appendChild(span);
  }

  get _showOnLandscape() {
    return !this._resolutionsConfig.find(resolution => resolution.orientation === 'landscape');
  }

  get _showOnPortrait() {
    return !this._resolutionsConfig.find(resolution => resolution.orientation === 'portrait');
  }

  get _isPortrait() {
    return this._orientation === 'portrait';
  }

  get _needShow() {
    return (this._orientation === 'portrait' && this._showOnPortrait) ||
      (this._orientation !== 'portrait' && this._showOnLandscape)
  }

  set _isVisible(needShowDiv) {
    this._div.style.visibility = needShowDiv ? 'visible' : 'hidden';
  }

  _updateOrientation() {
    this._orientation = innerWidth > innerHeight ? 'landscape' : 'portrait';
  }

  _updateVisibility() {
      this._isVisible = this._needShow;
  }

  _resizeHandler() {
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
