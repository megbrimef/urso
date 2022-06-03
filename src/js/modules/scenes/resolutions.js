class ModulesScenesResolutions {

    constructor() {
        this.singleton = true;
        this._activeResolution = false; //object
        this._templateSize = { orientation: 0, width: 0, height: 0 };
        this._currentOrientation = null;

        this.refreshSceneSize = this.refreshSceneSize.bind(this);
        this.preResize = this.preResize.bind(this);
        this.refreshSceneSize();

        //TODO optimization (performance)
        /*if (devicePixelRatio > 2)
            devicePixelRatio = 2;*/ // when we are calculating canvas size
    }

    _subscribeOnce() {
        this.addListener(Urso.events.EXTRA_BROWSEREVENTS_WINDOW_PRE_RESIZE, this.preResize, true);
        this.addListener(Urso.events.EXTRA_BROWSEREVENTS_WINDOW_RESIZE, this.refreshSceneSize, true);
        this.addListener(Urso.events.MODULES_SCENES_NEW_SCENE_INIT, this.refreshSceneSize, true);
    }

    getTemplateSize() {
        return this._templateSize;
    }

    preResize() {
        if (Urso.helper.mobileAndTabletCheck())
            this.getInstance('PixiWrapper').hideCanvas();
    }

    refreshSceneSize() {
        let windowSize = this._getWindowSize();
        let orientation = this._getOrientation(windowSize);
        let configResolution = this._getResolutionConfig(windowSize);

        let windowRatio = windowSize.width / windowSize.height;
        let optimalRatio = this._getOptimalRatio(configResolution, windowRatio, orientation);

        let currentResolution = Urso.helper.objectClone(configResolution);
        currentResolution.name = 'currentResolution';
        currentResolution.base = configResolution;
        currentResolution.width = (optimalRatio > windowRatio) ? Math.floor(windowSize.width) : Math.floor(Math.floor(windowSize.height) * optimalRatio);
        currentResolution.height = (optimalRatio > windowRatio) ? Math.floor(Math.floor(windowSize.width) / optimalRatio) : Math.floor(windowSize.height);

        this._templateSize = this._calculateTemplateSize(currentResolution);
        this._applyResolutionToPixi(currentResolution);

        console.log('[SCENE] New Orientation', orientation);
        console.log('[SCENE] New Resolution', currentResolution, 'windowSize:', windowSize);
        console.log('[SCENE] New Template Size', this._templateSize);

        if (this._currentOrientation !== this._templateSize.orientation) {
            this._currentOrientation = this._templateSize.orientation;

            //update InstancesModes
            Object.values(Urso.device.ScreenOrientation).forEach((orientationValue) => Urso.removeInstancesMode(orientationValue + 'Orientation', true));
            Urso.addInstancesMode(this._templateSize.orientation + 'Orientation');

            this.emit(Urso.events.MODULES_SCENES_ORIENTATION_CHANGE, this._templateSize.orientation);
        }

        //send new resolution event
        this.emit(Urso.events.MODULES_SCENES_NEW_RESOLUTION, { resolution: currentResolution, template: this._templateSize });

        return true;
    };

    _getWindowSize() {
        let windowSize = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        if (window.devicePixelRatio && window.devicePixelRatio !== 1) {
            windowSize.width *= window.devicePixelRatio;
            windowSize.height *= window.devicePixelRatio;
        }

        return windowSize;
    }

    _getOrientation(windowSize) {
        return windowSize.width > windowSize.height ? Urso.device.ScreenOrientation.LANDSCAPE : Urso.device.ScreenOrientation.PORTRAIT;
    }

    _getResolutionConfig(windowSize) {
        let orientation = this._getOrientation(windowSize);
        let mainDimension = windowSize.width > windowSize.height ? 'width' : 'height'; //todo move to constants
        let config = this.getInstance('ResolutionsConfig').get();
        let currentResolution = config[0];

        //select optimal resolution from config
        for (let resolution of config) {
            if (resolution.orientation !== orientation)
                continue;

            if (
                (currentResolution.orientation !== orientation) ||
                (
                    currentResolution[mainDimension] < resolution[mainDimension] &&
                    resolution[mainDimension] < windowSize[mainDimension]
                ) ||
                (
                    windowSize[mainDimension] < currentResolution[mainDimension] &&
                    resolution[mainDimension] < currentResolution[mainDimension]
                )
            )
                currentResolution = resolution;
        }

        return currentResolution;
    }

    _getOptimalRatio(configResolution, windowRatio, orientation) {
        let optimalRatio = configResolution.width / configResolution.height;

        if (configResolution.adaptive) {
            let display = !Urso.helper.mobileAndTabletCheck() ? 'desktop' : 'mobile'; //todo move to constants
            let adaptiveParams = this.getInstance('ResolutionsConfig').getAdaptive()[display];

            if (adaptiveParams.supported) {
                let limits = adaptiveParams.limits[orientation];
                optimalRatio = Urso.math.intMakeBetween(windowRatio, limits.min, limits.max);
            }
        }

        return optimalRatio;
    }

    _calculateTemplateSize(resolution) {
        this._templateSize.orientation = resolution.orientation;
        this._templateSize.width = resolution.base.width;
        this._templateSize.height = resolution.base.height;

        let dimensionsArray = ['width', 'height'];

        //adaptive corrections
        if (resolution.adaptive) {
            let dimensionsPassiveKey = (resolution.width / resolution.height > resolution.base.width / resolution.base.height) ? 0 : 1;
            let dimensionsMainKey = (dimensionsPassiveKey === 1) ? 0 : 1;

            this._templateSize[dimensionsArray[dimensionsPassiveKey]] =
                ~~(
                    resolution[dimensionsArray[dimensionsPassiveKey]] *
                    resolution.base[dimensionsArray[dimensionsMainKey]] / resolution[dimensionsArray[dimensionsMainKey]]
                );
        }

        return this._templateSize;
    }

    _applyResolutionToPixi(resolution) {
        let maxResolutionFactor = Math.min(this.getInstance('ResolutionsConfig').maxSize() / Math.max(resolution.width, resolution.height), 1);
        let dp = window.devicePixelRatio;
        let canvasSize = {
            width: ~~(resolution.width * maxResolutionFactor),
            height: ~~(resolution.height * maxResolutionFactor)
        };

        this.getInstance('PixiWrapper').showCanvas();
        this.getInstance('PixiWrapper').resize(canvasSize.width, canvasSize.height);
        this.getInstance('PixiWrapper').setWorldScale(canvasSize.width / this._templateSize.width, canvasSize.height / this._templateSize.height);
        this.getInstance('PixiWrapper').setCanvasWidth(resolution.width / dp);
        this.getInstance('PixiWrapper').setCanvasHeight(resolution.height / dp);

        this._activeResolution = resolution;
        return true;
    };
}

module.exports = ModulesScenesResolutions;
