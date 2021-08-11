class ComponentsFullscreenDesktop {
  init() {}

  get isFullscreen() {
    return (
      document.webkitIsFullScreen ||
      document.mozFullScreen ||
      document.fullscreen
    );
  }

  _requestFullscreen() {
    if (document.body.webkitRequestFullScreen)
      document.body.webkitRequestFullScreen();
    else if (document.body.mozRequestFullScreen)
      document.body.mozRequestFullScreen();
    else if (document.body.requestFullScreen)
      document.body.requestFullScreen();
  }

  _cancelFullscreen() {
    if (document.webkitCancelFullScreen)
      document.webkitCancelFullScreen();
    else if (document.mozCancelFullScreen)
      document.mozCancelFullScreen();
    else if (document.cancelFullScreen)
      document.cancelFullScreen();
  }

  _switchFullscreen(needGoFullscreen = null) {
    if (needGoFullscreen === null)
      needGoFullscreen = !this.isFullscreen;

    if (needGoFullscreen)
      this._requestFullscreen();
    else
      this._cancelFullscreen();
  }

  _fullscreenSwitchHandler(needGoFullscreen = null) {
    this._switchFullscreen(needGoFullscreen);
  }

  _subscribeOnce() {
    this.addListener('components.fullscreen.switch', this._fullscreenSwitchHandler.bind(this));
  }
}

module.exports = ComponentsFullscreenDesktop;
