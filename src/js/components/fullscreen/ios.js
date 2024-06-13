class ComponentsFullscreenIos {
  constructor() {
    this._div = null;
    this._orientation = null;
    this._scrollTimeout = null;
  }

  init() {
    this._createDom();
    this._addListeners();
    this._updateResize();
  }

  _createDom() {
    this._div = document.createElement('div');
    this._div.className = 'fullscreen fullscreen-ios';
    document.body.prepend(this._div);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'fullscreen-info';
    this._div.appendChild(infoDiv);

    const image = document.createElement('img');
    image.src = `${Urso.config.gamePath}assets/images/fullscreen/scroll.png`;
    const span = document.createElement('span');
    span.innerText = 'Swipe up to enter fullscreen';

    infoDiv.appendChild(image);
    infoDiv.appendChild(span);
  }

  _addListeners() {
    window.addEventListener('touchmove', (e) => {
      this._updateResize();

      if (e.touches.length > 1) {
        e.preventDefault();
        return;
      }
    });
  }

  get isFullscreen() {
    return this._isFullscreen;
  }

  get _isFullscreen() {
    const minFactor = 0.51;
    const deviceFactor = screen.width / screen.height;
    const factor = this._isPortrait ?
      innerWidth / innerHeight :
      innerHeight / innerWidth;

    return !(
      this._isPortrait ?
        factor - deviceFactor < 0.1 :
        factor > minFactor
    );
  }

  _updateOrientation() {
    this._orientation = innerWidth > innerHeight ? Urso.device.ScreenOrientation.LANDSCAPE : Urso.device.ScreenOrientation.PORTRAIT;
  }

  _updateResize() {
    this._updateOrientation();
    this.isVisible = this._needShowOnCurrentOrientation && this._isFullscreen;
  }

  get _orientationsConfig() {
    return Urso.getInstance('Modules.Scenes.ResolutionsConfig').contents || [];
  }

  get _isPortrait() {
    return this._orientation === Urso.device.ScreenOrientation.PORTRAIT;
  }

  get _needShowOnCurrentOrientation() {
    return (this._isPortrait && this._showOnPortrait) || (!this._isPortrait && this._showOnLandscape);
  }

  get _showOnLandscape() {
    return this._orientationsConfig.find(resolution => resolution.orientation === Urso.device.ScreenOrientation.LANDSCAPE);
  }

  get _showOnPortrait() {
    return this._orientationsConfig.find(resolution => resolution.orientation === Urso.device.ScreenOrientation.PORTRAIT);
  }

  set isVisible(needShowDiv) {
    this._div.style.zIndex = needShowDiv ? 1 : -1;
    clearTimeout(this._scrollTimeout)
    this._scrollTimeout = setTimeout(() => {
      if (needShowDiv)
        window.scrollTo(0, 0);
    }, 200);
  }

  _resizeHandler() {
    this._updateResize();
  }

  _fullscreenSwitchHandler(needGoFullscreen = null) {
    this._switchFullscreen(needGoFullscreen);
  }

  _subscribeOnce() {
    this.addListener(
      Urso.events.EXTRA_BROWSEREVENTS_WINDOW_RESIZE,
      this._resizeHandler.bind(this)
    );
  }
}

module.exports = ComponentsFullscreenIos;
