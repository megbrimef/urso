//Urso namespace
window.Urso = {
    //Core namespace
    Core: {
        Components: {
            Base: {
                Controller: require('../components/base/controller')
            },
            Debug: {
                Controller: require('../components/debug/controller'),
                Coords: require('../components/debug/coords'),
                Fps: require('../components/debug/fps'),
                Template: require('../components/debug/template'),
                Timescale: require('../components/debug/timescale')
            },
            DeviceRotate: {
                Controller: require('../components/deviceRotate/controller')
            },
            Editor: {
                Controller: require('../components/editor/controller'),
                Api: require('../components/editor/api')
            },
            Fullscreen: {
                Android: require('../components/fullscreen/android'),
                Controller: require('../components/fullscreen/controller'),
                Desktop: require('../components/fullscreen/desktop'),
                Ios: require('../components/fullscreen/ios')
            },
            LayersSwitcher: {
                Controller: require('../components/layersSwitcher/controller'),
                Config: require('../components/layersSwitcher/config')
            },
            Loader: {
                Controller: require('../components/loader/controller'),
                Template: require('../components/loader/template')
            },
            SoundInitialPopup: {
                Controller: require('../components/soundInitialPopup/controller'),
                Template: require('../components/soundInitialPopup/template')
            },
            StateDriven: {
                Controller: require('../components/stateDriven/controller')
            }
        },
        Config: {
            Main: require('../config/main')
        },
        Extra: {
            BrowserEvents: require('../extra/browserEvents'),
            Main: require('../extra/main'),
            PixiPatch: require('../extra/pixiPatch')
        },
        Lib: {
            Cache: require('../lib/cache'),
            Composition: require('../lib/composition'),
            Device: require('../lib/device'),
            Helper: require('../lib/helper'),
            Loader: require('../lib/loader'),
            LocalData: require('../lib/localData'),
            Logger: require('../lib/logger'),
            Math: require('../lib/math'),
            ObjectPool: require('../lib/objectPool'),
            Time: require('../lib/time'),
            Tween: require('../lib/tween')
        },
        Modules: {
            Assets: {
                BaseModel: require('../modules/assets/baseModel'),
                Config: require('../modules/assets/config'),
                Controller: require('../modules/assets/controller'),
                Service: require('../modules/assets/service'),
                Models: {
                    Atlas: require('../modules/assets/models/atlas'),
                    Audiosprite: require('../modules/assets/models/audiosprite'),
                    BitmapFont: require('../modules/assets/models/bitmapFont'),
                    Container: require('../modules/assets/models/container'),
                    Font: require('../modules/assets/models/font'),
                    Html: require('../modules/assets/models/html'),
                    Image: require('../modules/assets/models/image'),
                    Json: require('../modules/assets/models/json'),
                    JsonAtlas: require('../modules/assets/models/jsonAtlas'),
                    Sound: require('../modules/assets/models/sound'),
                    Spine: require('../modules/assets/models/spine')
                }
            },
            I18n: {
                Config: require('../modules/i18n/config'),
                Controller: require('../modules/i18n/controller')
            },
            Instances: {
                Controller: require('../modules/instances/controller')
            },
            Logic: {
                Controller: require('../modules/logic/controller'),
                Main: require('../modules/logic/main'),
                Sounds: require('../modules/logic/sounds'),
                Config: {
                    Sounds: require('../modules/logic/config/sounds')
                }
            },
            Objects: {
                BaseModel: require('../modules/objects/baseModel'),
                Cache: require('../modules/objects/cache'),
                Config: require('../modules/objects/config'),
                Controller: require('../modules/objects/controller'),
                Find: require('../modules/objects/find'),
                Pool: require('../modules/objects/pool'),
                PropertyAdapter: require('../modules/objects/propertyAdapter'),
                Proxy: require('../modules/objects/proxy'),
                Selector: require('../modules/objects/selector'),
                Service: require('../modules/objects/service'),
                Styles: require('../modules/objects/styles'),
                Models: {
                    AtlasImage: require('../modules/objects/models/atlasImage'),
                    BitmapText: require('../modules/objects/models/bitmapText'),
                    Button: require('../modules/objects/models/button'),
                    ButtonComposite: require('../modules/objects/models/buttonComposite'),
                    Checkbox: require('../modules/objects/models/checkbox'),
                    Collection: require('../modules/objects/models/collection'),
                    Component: require('../modules/objects/models/component'),
                    Container: require('../modules/objects/models/container'),
                    DragContainer: require('../modules/objects/models/dragContainer'),
                    Emitter: require('../modules/objects/models/emitter'),
                    EmitterFx: require('../modules/objects/models/emitterFx'),
                    Graphics: require('../modules/objects/models/graphics'),
                    Group: require('../modules/objects/models/group'),
                    HitArea: require('../modules/objects/models/hitArea'),
                    Image: require('../modules/objects/models/image'),
                    ImagesAnimation: require('../modules/objects/models/imagesAnimation'),
                    Mask: require('../modules/objects/models/mask'),
                    NineSlicePlane: require('../modules/objects/models/nineSlicePlane'),
                    Scrollbox: require('../modules/objects/models/scrollbox'),
                    Slider: require('../modules/objects/models/slider'),
                    Spine: require('../modules/objects/models/spine'),
                    Text: require('../modules/objects/models/text'),
                    TextInput: require('../modules/objects/models/textInput'),
                    Toggle: require('../modules/objects/models/toggle'),
                    World: require('../modules/objects/models/world')
                }
            },
            Observer: {
                Controller: require('../modules/observer/controller'),
                Events: require('../modules/observer/events')
            },
            Scenes: {
                Controller: require('../modules/scenes/controller'),
                Model: require('../modules/scenes/model'),
                PixiWrapper: require('../modules/scenes/pixiWrapper'),
                Resolutions: require('../modules/scenes/resolutions'),
                ResolutionsConfig: require('../modules/scenes/resolutionsConfig'),
                Service: require('../modules/scenes/service')
            },
            SoundManager: {
                Controller: require('../modules/soundManager/controller'),
                SoundSprite: require('../modules/soundManager/soundSprite')
            },
            StatesManager: {
                Action: require('../modules/statesManager/action'),
                All: require('../modules/statesManager/all'),
                ConfigStates: require('../modules/statesManager/configStates'),
                Controller: require('../modules/statesManager/controller'),
                FunctionsStorage: require('../modules/statesManager/functionsStorage'),
                Helper: require('../modules/statesManager/helper'),
                Race: require('../modules/statesManager/race'),
                Sequence: require('../modules/statesManager/sequence'),
                Actions: {
                    //put your custom actions here
                }
            },
            Template: {
                Controller: require('../modules/template/controller'),
                Model: require('../modules/template/model'),
                Service: require('../modules/template/service'),
                Types: require('../modules/template/types')
            },
            Transport: {
                BaseConnectionType: require('../modules/transport/baseConnectionType'),
                Config: require('../modules/transport/config'),
                Controller: require('../modules/transport/controller'),
                Decorator: require('../modules/transport/decorator'),
                Service: require('../modules/transport/service'),
                ConnectionTypes: {
                    Websocket: require('../modules/transport/connectionTypes/websocket'),
                    Xhr: require('../modules/transport/connectionTypes/xhr')
                }
            }
        },
        Templates: {
            Groups: {},
            Scenes: {}
        },
        App: require('../app')
    }
};
