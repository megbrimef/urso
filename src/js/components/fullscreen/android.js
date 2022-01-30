class ComponentsFullscreenAndroid {

  constructor() {
    this._div = null;
    this._orientation = null;
  }

  init() {
    this._createDom();
    this._addListeners();

    this._updateOrientation();
    this._updateResize();
  }

  _createDom() {
    this._div = document.createElement('div');
    this._div.className = 'fullscreen fullscreen-android';
    document.body.prepend(this._div);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'fullscreen-info';
    this._div.appendChild(infoDiv);

    const image = document.createElement('img');
    image.src = '/assets/images/fullscreen/hand.png'
    const span = document.createElement('span');
    span.innerText = 'Tap to enter fullscreen';

    infoDiv.appendChild(image);
    infoDiv.appendChild(span);

  }

  _updateOrientation() {
    this._orientation = innerWidth > innerHeight ? Urso.device.ScreenOrientation.LANDSCAPE : Urso.device.ScreenOrientation.PORTRAIT;
  }

  get isFullscreen() {
    return (
      document.webkitIsFullScreen ||
      document.mozFullScreen ||
      document.fullscreen
    );
  }

  get _orientationsConfig() {
    return Urso.getInstance('Modules.Scenes.ResolutionsConfig').contents || [];
  }

  get _isPortrait() {
    return this._orientation === Urso.device.ScreenOrientation.PORTRAIT;
  }

  get _needShowOnCurrentOrientation() {
    return (this._isPortrait && this._showOnPortrait) ||
      (!this._isPortrait && this._showOnLandscape);
  }

  get _showOnLandscape() {
    return this._orientationsConfig.find(resolution => resolution.orientation === Urso.device.ScreenOrientation.LANDSCAPE);
  }

  get _showOnPortrait() {
    return this._orientationsConfig.find(resolution => resolution.orientation === Urso.device.ScreenOrientation.PORTRAIT);
  }

  set isVisible(needShowDiv) {
    this._div.style.visibility = needShowDiv ? 'visible' : 'hidden';
  }

  _requestFullscreen() {
    if (document.body.webkitRequestFullScreen)
      document.body.webkitRequestFullScreen();
    else if (document.body.mozRequestFullScreen)
      document.body.mozRequestFullScreen();
    else if (document.body.requestFullScreen)
      document.body.requestFullScreen();
  }

  _updateResize() {
    this.isVisible = this._needShowOnCurrentOrientation && !this.isFullscreen;
  }

  _resizeHandler() {
    this._updateOrientation();
    this._updateResize();
  }

  _addListeners() {
    window.addEventListener('touchend', (e) => {
      if (!this.isFullscreen)
        this._requestFullscreen();

      this._updateResize();
    });
  }

  _subscribeOnce() {
    this.addListener(Urso.events.EXTRA_BROWSEREVENTS_WINDOW_RESIZE, this._resizeHandler.bind(this));
  }
}

module.exports = ComponentsFullscreenAndroid;
