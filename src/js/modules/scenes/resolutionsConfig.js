class ModulesScenesResolutionsConfig {
    constructor() {
        this.singleton = true;

        this._orientations = [Urso.device.ScreenOrientation.LANDSCAPE, Urso.device.ScreenOrientation.PORTRAIT]; //you can use only one orientation for config contents

        this.contents = [
            {
                "name": 'default',
                "width": 1920,
                "height": 1080,
                "orientation": Urso.device.ScreenOrientation.LANDSCAPE,
                "adaptive": true
            }
        ];

        this.adaptiveConfig = {//works only if "adaptive": true  for current resolution
            desktop: {
                supported: true,
                limits: {
                    landscape: {
                        min: 1, // width:height factor
                        max: 2
                    },
                    portrait: {
                        min: 0.5,
                        max: 1
                    }
                }
            },
            mobile: {
                supported: true,
                limits: {
                    landscape: {
                        min: 1, // width:height factor
                        max: 2
                    },
                    portrait: {
                        min: 0.5,
                        max: 1
                    }
                }
            }
        };
    }

    get() {
        return this.contents;
    };


    getAdaptive() {
        return this.adaptiveConfig;
    };

    maxSize() {
        return Math.max(this.maxWidth(), this.maxHeight());
    };

    maxWidth() {
        return this._maxDimension.call(this, 'width');
    };

    maxHeight() {
        return this._maxDimension.call(this, 'height');
    };

    _maxDimension(dim) {
        return this.contents.reduce((result, resolution) => resolution[dim] > result ? resolution[dim] : result, 0);
    };
}

module.exports = ModulesScenesResolutionsConfig;
