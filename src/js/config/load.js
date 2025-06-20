// Import all modules at the top
import ComponentsBaseController from "../components/base/controller";
import ComponentsDebugController from "../components/debug/controller";
import ComponentsDebugCoords from "../components/debug/coords";
import ComponentsDebugFps from "../components/debug/fps";
import ComponentsDebugTemplate from "../components/debug/template";
import ComponentsDebugTimescale from "../components/debug/timescale";
import ComponentsDeviceRotateController from "../components/deviceRotate/controller";
import ComponentsEditorController from "../components/editor/controller";
import ComponentsEditorApi from "../components/editor/api";
import ComponentsFullscreenAndroid from "../components/fullscreen/android";
import ComponentsFullscreenController from "../components/fullscreen/controller";
import ComponentsFullscreenDesktop from "../components/fullscreen/desktop";
import ComponentsFullscreenIos from "../components/fullscreen/ios";
import ComponentsLayersSwitcherController from "../components/layersSwitcher/controller";
import ComponentsLayersSwitcherConfig from "../components/layersSwitcher/config";
import ComponentsLoaderController from "../components/loader/controller";
import ComponentsLoaderTemplate from "../components/loader/template";
import ComponentsSoundInitialPopupController from "../components/soundInitialPopup/controller";
import ComponentsSoundInitialPopupTemplate from "../components/soundInitialPopup/template";
import ComponentsStateDrivenController from "../components/stateDriven/controller";

import ConfigMain from "../config/main";

import ExtraBrowserEvents from "../extra/browserEvents";
import ExtraMain from "../extra/main";
// import ExtraPixiPatch from '../extra/pixiPatch'; //FIXME

import LibCache from "../lib/cache";
import LibComposition from "../lib/composition";
import LibDevice from "../lib/device";
import LibHelper from "../lib/helper";
import LibLoader from "../lib/loader";
import LibLocalData from "../lib/localData";
import LibLogger from "../lib/logger";
import LibMath from "../lib/math";
import LibObjectPool from "../lib/objectPool";
import LibTime from "../lib/time";
import LibTween from "../lib/tween";

import ModulesAssetsBaseModel from "../modules/assets/baseModel";
import ModulesAssetsConfig from "../modules/assets/config";
import ModulesAssetsController from "../modules/assets/controller";
import ModulesAssetsService from "../modules/assets/service";
import ModulesAssetsModelsAtlas from "../modules/assets/models/atlas";
import ModulesAssetsModelsAudiosprite from "../modules/assets/models/audiosprite";
import ModulesAssetsModelsBitmapFont from "../modules/assets/models/bitmapFont";
import ModulesAssetsModelsContainer from "../modules/assets/models/container";
import ModulesAssetsModelsFont from "../modules/assets/models/font";
import ModulesAssetsModelsHtml from "../modules/assets/models/html";
import ModulesAssetsModelsImage from "../modules/assets/models/image";
import ModulesAssetsModelsJson from "../modules/assets/models/json";
import ModulesAssetsModelsJsonAtlas from "../modules/assets/models/jsonAtlas";
import ModulesAssetsModelsSound from "../modules/assets/models/sound";
import ModulesAssetsModelsSpine from "../modules/assets/models/spine";
import ModulesAssetsModelsSpineAtlas from "../modules/assets/models/spineAtlas";

import ModulesI18nConfig from "../modules/i18n/config";
import ModulesI18nController from "../modules/i18n/controller";

import ModulesInstancesController from "../modules/instances/controller";

import ModulesLogicController from "../modules/logic/controller";
import ModulesLogicMain from "../modules/logic/main";
import ModulesLogicSounds from "../modules/logic/sounds";
import ModulesLogicConfigSounds from "../modules/logic/config/sounds";

import ModulesObjectsBaseModel from "../modules/objects/baseModel";
import ModulesObjectsCache from "../modules/objects/cache";
import ModulesObjectsConfig from "../modules/objects/config";
import ModulesObjectsController from "../modules/objects/controller";
import ModulesObjectsFind from "../modules/objects/find";
import ModulesObjectsPool from "../modules/objects/pool";
import ModulesObjectsPropertyAdapter from "../modules/objects/propertyAdapter";
import ModulesObjectsProxy from "../modules/objects/proxy";
import ModulesObjectsSelector from "../modules/objects/selector";
import ModulesObjectsService from "../modules/objects/service";
import ModulesObjectsStyles from "../modules/objects/styles";
import ModulesObjectsModelsBitmapText from "../modules/objects/models/bitmapText";
import ModulesObjectsModelsButton from "../modules/objects/models/button";
import ModulesObjectsModelsButtonComposite from "../modules/objects/models/buttonComposite";
import ModulesObjectsModelsCheckbox from "../modules/objects/models/checkbox";
import ModulesObjectsModelsCollection from "../modules/objects/models/collection";
import ModulesObjectsModelsComponent from "../modules/objects/models/component";
import ModulesObjectsModelsContainer from "../modules/objects/models/container";
import ModulesObjectsModelsEmitterFx from "../modules/objects/models/emitterFx";
import ModulesObjectsModelsGraphics from "../modules/objects/models/graphics";
import ModulesObjectsModelsGroup from "../modules/objects/models/group";
import ModulesObjectsModelsHitArea from "../modules/objects/models/hitArea";
import ModulesObjectsModelsImage from "../modules/objects/models/image";
import ModulesObjectsModelsImagesAnimation from "../modules/objects/models/imagesAnimation";
import ModulesObjectsModelsMask from "../modules/objects/models/mask";
import ModulesObjectsModelsNineSlicePlane from "../modules/objects/models/nineSlicePlane";
import ModulesObjectsModelsSlider from "../modules/objects/models/slider";
import ModulesObjectsModelsSpine from "../modules/objects/models/spine";
import ModulesObjectsModelsText from "../modules/objects/models/text";
import ModulesObjectsModelsToggle from "../modules/objects/models/toggle";
import ModulesObjectsModelsWorld from "../modules/objects/models/world";

import ModulesObserverController from "../modules/observer/controller";
import ModulesObserverEvents from "../modules/observer/events";

import ModulesScenesController from "../modules/scenes/controller";
import ModulesScenesModel from "../modules/scenes/model";
import ModulesScenesPixiWrapper from "../modules/scenes/pixiWrapper";
import ModulesScenesResolutions from "../modules/scenes/resolutions";
import ModulesScenesResolutionsConfig from "../modules/scenes/resolutionsConfig";
import ModulesScenesService from "../modules/scenes/service";

import ModulesSoundManagerController from "../modules/soundManager/controller";
import ModulesSoundManagerSoundSprite from "../modules/soundManager/soundSprite";

import ModulesStatesManagerAction from "../modules/statesManager/action";
import ModulesStatesManagerAll from "../modules/statesManager/all";
import ModulesStatesManagerConfigStates from "../modules/statesManager/configStates";
import ModulesStatesManagerController from "../modules/statesManager/controller";
import ModulesStatesManagerFunctionsStorage from "../modules/statesManager/functionsStorage";
import ModulesStatesManagerHelper from "../modules/statesManager/helper";
import ModulesStatesManagerRace from "../modules/statesManager/race";
import ModulesStatesManagerSequence from "../modules/statesManager/sequence";

import ModulesTemplateController from "../modules/template/controller";
import ModulesTemplateModel from "../modules/template/model";
import ModulesTemplateService from "../modules/template/service";
import ModulesTemplateTypes from "../modules/template/types";

import ModulesTransportBaseConnectionType from "../modules/transport/baseConnectionType";
import ModulesTransportConfig from "../modules/transport/config";
import ModulesTransportController from "../modules/transport/controller";
import ModulesTransportDecorator from "../modules/transport/decorator";
import ModulesTransportService from "../modules/transport/service";
import ModulesTransportConnectionTypesWebsocket from "../modules/transport/connectionTypes/websocket";
import ModulesTransportConnectionTypesXhr from "../modules/transport/connectionTypes/xhr";

import App from "../app";

//Urso namespace
window.Urso = {
  Core: {
    Components: {
      Base: {
        Controller: ComponentsBaseController,
      },
      Debug: {
        Controller: ComponentsDebugController,
        Coords: ComponentsDebugCoords,
        Fps: ComponentsDebugFps,
        Template: ComponentsDebugTemplate,
        Timescale: ComponentsDebugTimescale,
      },
      DeviceRotate: {
        Controller: ComponentsDeviceRotateController,
      },
      Editor: {
        Controller: ComponentsEditorController,
        Api: ComponentsEditorApi,
      },
      Fullscreen: {
        Android: ComponentsFullscreenAndroid,
        Controller: ComponentsFullscreenController,
        Desktop: ComponentsFullscreenDesktop,
        Ios: ComponentsFullscreenIos,
      },
      LayersSwitcher: {
        Controller: ComponentsLayersSwitcherController,
        Config: ComponentsLayersSwitcherConfig,
      },
      Loader: {
        Controller: ComponentsLoaderController,
        Template: ComponentsLoaderTemplate,
      },
      SoundInitialPopup: {
        Controller: ComponentsSoundInitialPopupController,
        Template: ComponentsSoundInitialPopupTemplate,
      },
      StateDriven: {
        Controller: ComponentsStateDrivenController,
      },
    },
    Config: {
      Main: ConfigMain,
    },
    Extra: {
      BrowserEvents: ExtraBrowserEvents,
      Main: ExtraMain,
      // PixiPatch: ExtraPixiPatch //FIXME
    },
    Lib: {
      Cache: LibCache,
      Composition: LibComposition,
      Device: LibDevice,
      Helper: LibHelper,
      Loader: LibLoader,
      LocalData: LibLocalData,
      Logger: LibLogger,
      Math: LibMath,
      ObjectPool: LibObjectPool,
      Time: LibTime,
      Tween: LibTween,
    },
    Modules: {
      Assets: {
        BaseModel: ModulesAssetsBaseModel,
        Config: ModulesAssetsConfig,
        Controller: ModulesAssetsController,
        Service: ModulesAssetsService,
        Models: {
          Atlas: ModulesAssetsModelsAtlas,
          Audiosprite: ModulesAssetsModelsAudiosprite,
          BitmapFont: ModulesAssetsModelsBitmapFont,
          Container: ModulesAssetsModelsContainer,
          Font: ModulesAssetsModelsFont,
          Html: ModulesAssetsModelsHtml,
          Image: ModulesAssetsModelsImage,
          Json: ModulesAssetsModelsJson,
          JsonAtlas: ModulesAssetsModelsJsonAtlas,
          Sound: ModulesAssetsModelsSound,
          Spine: ModulesAssetsModelsSpine,
          SpineAtlas: ModulesAssetsModelsSpineAtlas,
        },
      },
      I18n: {
        Config: ModulesI18nConfig,
        Controller: ModulesI18nController,
      },
      Instances: {
        Controller: ModulesInstancesController,
      },
      Logic: {
        Controller: ModulesLogicController,
        Main: ModulesLogicMain,
        Sounds: ModulesLogicSounds,
        Config: {
          Sounds: ModulesLogicConfigSounds,
        },
      },
      Objects: {
        BaseModel: ModulesObjectsBaseModel,
        Cache: ModulesObjectsCache,
        Config: ModulesObjectsConfig,
        Controller: ModulesObjectsController,
        Find: ModulesObjectsFind,
        Pool: ModulesObjectsPool,
        PropertyAdapter: ModulesObjectsPropertyAdapter,
        Proxy: ModulesObjectsProxy,
        Selector: ModulesObjectsSelector,
        Service: ModulesObjectsService,
        Styles: ModulesObjectsStyles,
        Models: {
          BitmapText: ModulesObjectsModelsBitmapText,
          Button: ModulesObjectsModelsButton,
          ButtonComposite: ModulesObjectsModelsButtonComposite,
          Checkbox: ModulesObjectsModelsCheckbox,
          Collection: ModulesObjectsModelsCollection,
          Component: ModulesObjectsModelsComponent,
          Container: ModulesObjectsModelsContainer,
          EmitterFx: ModulesObjectsModelsEmitterFx,
          Graphics: ModulesObjectsModelsGraphics,
          Group: ModulesObjectsModelsGroup,
          HitArea: ModulesObjectsModelsHitArea,
          Image: ModulesObjectsModelsImage,
          ImagesAnimation: ModulesObjectsModelsImagesAnimation,
          Mask: ModulesObjectsModelsMask,
          NineSlicePlane: ModulesObjectsModelsNineSlicePlane,
          Slider: ModulesObjectsModelsSlider,
          Spine: ModulesObjectsModelsSpine,
          Text: ModulesObjectsModelsText,
          Toggle: ModulesObjectsModelsToggle,
          World: ModulesObjectsModelsWorld,
        },
      },
      Observer: {
        Controller: ModulesObserverController,
        Events: ModulesObserverEvents,
      },
      Scenes: {
        Controller: ModulesScenesController,
        Model: ModulesScenesModel,
        PixiWrapper: ModulesScenesPixiWrapper,
        Resolutions: ModulesScenesResolutions,
        ResolutionsConfig: ModulesScenesResolutionsConfig,
        Service: ModulesScenesService,
      },
      SoundManager: {
        Controller: ModulesSoundManagerController,
        SoundSprite: ModulesSoundManagerSoundSprite,
      },
      StatesManager: {
        Action: ModulesStatesManagerAction,
        All: ModulesStatesManagerAll,
        ConfigStates: ModulesStatesManagerConfigStates,
        Controller: ModulesStatesManagerController,
        FunctionsStorage: ModulesStatesManagerFunctionsStorage,
        Helper: ModulesStatesManagerHelper,
        Race: ModulesStatesManagerRace,
        Sequence: ModulesStatesManagerSequence,
        Actions: {
          //put your custom actions here
        },
      },
      Template: {
        Controller: ModulesTemplateController,
        Model: ModulesTemplateModel,
        Service: ModulesTemplateService,
        Types: ModulesTemplateTypes,
      },
      Transport: {
        BaseConnectionType: ModulesTransportBaseConnectionType,
        Config: ModulesTransportConfig,
        Controller: ModulesTransportController,
        Decorator: ModulesTransportDecorator,
        Service: ModulesTransportService,
        ConnectionTypes: {
          Websocket: ModulesTransportConnectionTypesWebsocket,
          Xhr: ModulesTransportConnectionTypesXhr,
        },
      },
    },
    Templates: {
      Groups: {
      },
      Scenes: {
        Play: class {
          objects = [
            {
              type: Urso.types.objects.COMPONENT,
              componentName: "loader",
            },
          ];
        },
      },
    },
    App: App,
  },
};
