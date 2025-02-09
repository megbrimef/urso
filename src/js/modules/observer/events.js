class ModulesObserverConfig {

    constructor() {
        this.singleton = true;
    }

    list = {
        COMPONENTS_FULLSCREEN_CHANGE: 'components.fullscreen.change',
        COMPONENTS_FULLSCREEN_SWITCH: 'components.fullscreen.switch',
        COMPONENTS_LAYERS_SWITCHER_SWITCH: 'components.layersSwitcher.switch',
        EXTRA_BROWSEREVENTS_KEYPRESS_EVENT: 'extra.browserEvents.window.keypress.event',
        EXTRA_BROWSEREVENTS_POINTER_EVENT: 'extra.browserEvents.window.pointer.event',
        EXTRA_BROWSEREVENTS_WINDOW_PRE_RESIZE: 'extra.browserEvents.window.pre.resize',
        EXTRA_BROWSEREVENTS_WINDOW_RESIZE: 'extra.browserEvents.window.resize',
        EXTRA_BROWSEREVENTS_WINDOW_VISIBILITYCHANGE: 'extra.browserEvents.window.visibilitychange',
        MODULES_ASSETS_GROUP_LOADED: 'modules.assets.group.loaded',
        MODULES_ASSETS_LOAD_PROGRESS: 'modules.assets.load.progress',
        MODULES_ASSETS_LAZYLOAD_FINISHED: 'modules.assets.lazyLoad.finished',
        MODULES_I18N_NEW_LOCALE_WAS_SET: 'modules.i18n.new.locale.was.set',
        MODULES_INSTANCES_MODES_CHANGED: 'modules.instances.modes.changed',
        MODULES_OBJECTS_BUTTON_PRESS: 'modules.objects.button.press',
        MODULES_OBJECTS_DRAGCONTAINER_DRAG_STARTED: 'modules.objects.dragContainer.dragStarted',
        MODULES_OBJECTS_DRAGCONTAINER_DRAG_FINISHED: 'modules.objects.dragContainer.dragFinished',
        MODULES_OBJECTS_DRAGCONTAINER_SCROLL: 'modules.objects.dragContainer.scroll',
        MODULES_OBJECTS_DRAGCONTAINER_SETSLIDER: 'modules.objects.dragContainer.setSlider',
        MODULES_OBJECTS_DRAGCONTAINER_SWITCHBLOCK: 'modules.objects.dragContainer.switchBlock',
        MODULES_OBJECTS_HIT_AREA_PRESS: 'modules.objects.hitArea.press',
        MODULES_OBJECTS_SLIDER_HANDLE_MOVE: 'modules.objects.slider.handleMove',
        MODULES_OBJECTS_SLIDER_HANDLE_DROP: 'modules.objects.slider.handleDrop',
        MODULES_OBJECTS_SPINE_EVENT: 'modules.objects.spine.event',
        MODULES_OBJECTS_TOGGLE_PRESS: 'modules.objects.toggle.press',
        MODULES_OBJECTS_TEXTINPUT_BLUR: 'modules.objects.textinput.blur',
        MODULES_OBJECTS_TEXTINPUT_INPUT: 'modules.objects.textinput.input',
        MODULES_OBJECTS_CHECKBOX_PRESS: 'modules.objects.checkbox.press',
        MODULES_LOGIC_SOUNDS_DO: 'modules.soundManager.do',
        MODULES_SOUND_MANAGER_CONTEXT_UNLOCKED: 'modules.soundManager.contextUnlocked',
        MODULES_SOUND_MANAGER_UPDATE_CFG: 'modules.soundManager.updateCfg',
        MODULES_SOUND_MANAGER_SET_GLOBAL_VOLUME: 'modules.soundManager.setGlobalVolume',
        MODULES_STATES_MANAGER_STATE_CHANGE: 'modules.statesManager.stateChange',
        MODULES_STATES_MANAGER_ACTION_START: 'modules.statesManager.actionStart',
        MODULES_STATES_MANAGER_ACTION_FINISH: 'modules.statesManager.actionFinish',
        MODULES_STATES_MANAGER_STOP: 'modules.statesManager.stop',
        MODULES_SCENES_ORIENTATION_CHANGE: 'modules.scenes.orientation.change',
        MODULES_SCENES_NEW_RESOLUTION: 'modules.scenes.newResolution',
        MODULES_SCENES_NEW_SCENE_INIT: 'modules.scenes.newSceneInit',
        MODULES_SCENES_DISPLAY_START: 'modules.scenes.display.start',
        MODULES_SCENES_DISPLAY_FINISHED: 'modules.scenes.display.finished',
        MODULES_SCENES_MOUSE_NEW_POSITION: 'modules.scenes.mouse.newPosition',
        MODULES_SCENES_PAUSE: 'modules.scenes.pause',
        MODULES_SCENES_RESUME: 'modules.scenes.resume',
        MODULES_SCENES_UPDATE: 'modules.scenes.update',
    }

}

module.exports = ModulesObserverConfig;
