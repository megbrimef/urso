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
    image.src = '/assets/images/fullscreen/scroll.png';
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

    window.addEventListener('touchend', (e) => {
      setTimeout(() => {
        this._updateResize();
        this._scrollY = 0;
      }, 50);
    });
  }

  get _isFullscreen() {
    const minFactor = 0.513;
    const deviceFactor = screen.width / screen.height;
    const factor = this._isPortrait ?
      innerWidth / innerHeight :
      innerHeight / innerWidth;

    return !(
      this._isPortrait ?
        factor - deviceFactor < 0.1:
        factor > minFactor
    );
  }

  _updateOrientation() {
    this._orientation = innerWidth > innerHeight ? 'landscape' : 'portrait';
  }

  _updateResize() {
    this._updateOrientation();
    this.isVisible = this._needShowOnCurrentOrientation && this._isFullscreen;
  }

  get _orientationsConfig() {
    return Urso.getInstance('Modules.Scenes.ResolutionsConfig').contents || [];
  }

  get _isPortrait() {
    return this._orientation === 'portrait';
  }

  get _needShowOnCurrentOrientation() {
    return (this._isPortrait && this._showOnPortrait) || (!this._isPortrait && this._showOnLandscape);
  }

  get _showOnLandscape() {
    return this._orientationsConfig.find(resolution => resolution.orientation === 'landscape');
  }

  get _showOnPortrait() {
    return this._orientationsConfig.find(resolution => resolution.orientation === 'portrait');
  }

  set isVisible(needShowDiv) {
    this._div.style.visibility = needShowDiv ? 'visible' : 'hidden';
  }

  set _scrollY(toY) {
    clearTimeout(this._scrollTimeout);
    this._scrollTimeout = setTimeout(() => {
      scrollTo(0, toY);
    }, 20);
  }

  _resizeHandler() {
    this._updateResize();
    this._scrollY = 0;
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
