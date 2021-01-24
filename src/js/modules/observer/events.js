class ModulesObserverConfig {
    constructor() {
        this.singleton = true;

        this.list = {
            MODULES_ASSETS_GROUP_LOADED: 'modules.assets.group.loaded',
            MODULES_ASSETS_LAZYLOAD_FINISHED: 'modules.assets.lazyLoad.finished',
            MODULES_OBJECTS_BUTTON_PRESS: 'modules.objects.button.press',
            MODULES_OBJECTS_HIT_AREA_PRESS: 'modules.objects.hitArea.press',
            MODULES_SOUND_MANAGER_SOUNDS_UPDATE_CFG: 'soundManager.updateCfg',
            MODULES_STATES_MANAGER_STATE_CHANGE: 'modules.statesManager.stateChange',
            MODULES_SCENES_ORIENTATION_CHANGE: 'modules.scenes.orientation.change',
            MODULES_SCENES_NEW_RESOLUTION: 'modules.scenes.newResolution',
            MODULES_SCENES_NEW_SCENE_INIT: 'modules.scenes.newSceneInit',
            MODULES_SCENES_DISPLAY_START: 'modules.scenes.display.start',
            MODULES_SCENES_DISPLAY_FINISHED: 'modules.scenes.display.finished',
            EXTRA_BROWSEREVENTS_WINDOW_RESIZE: 'extra.browserEvents.window.resize',
            EXTRA_BROWSEREVENTS_WINDOW_VISIBILITYCHANGE: 'extra.browserEvents.window.visibilitychange'
        }
    }
}

module.exports = ModulesObserverConfig;
