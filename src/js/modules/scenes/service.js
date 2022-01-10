class ModulesScenesService {
    constructor() {
        this.singleton = true;

        this._displayInProgress = false;
        this._currentSceneName = false;
        this._currentSceneTemplate = false;
        this._sceneModel;

        this.timeScale = 1;

        this._pixiWrapper;

        this.init();

        this._assetsLoadedHandler = this._assetsLoadedHandler.bind(this);
    }

    init() {
        this._pixiWrapper = this.getInstance('PixiWrapper');
        this._pixiWrapper.init();
    }

    setTimeScale(value) {
        this.timeScale = value;
        gsap.globalTimeline.timeScale(this.timeScale);
    }

    display(name) {
        if (this._displayInProgress) {
            console.warn("Scenes.display is busy ", this._currentSceneName);
            return false;
        }

        let template = Urso.template.scene(name);

        if (!template) {
            console.error('Scenes.display error: no template for scene', name);
            return false;
        }

        console.log('[SCENE] display:', name);
        this._displayInProgress = true;
        this.emit(Urso.events.MODULES_SCENES_DISPLAY_START, name);

        //destroy all components, if _sceneModel exists. Not exists only in first call
        if (this._sceneModel)
            this._sceneModel.destroy();

        this._currentSceneName = name;
        Urso.observer.clearAllLocal();
        Urso.observer.setPrefix(name);

        //parse template
        this._currentSceneTemplate = Urso.template.parse(template);

        console.log('[SCENE] current template:', this._currentSceneTemplate)
        this._sceneModel = this.getInstance('Model');

        //write model by template (functions)  //todo set in model (this.getInstance('Model', params);)
        this._sceneModel.loadUpdate = (loadProgress) => { this._currentSceneTemplate.components.forEach(component => component.loadUpdate(loadProgress)); }
        this._sceneModel.create = () => { this._currentSceneTemplate.components.forEach(component => component.create()); }
        this._sceneModel.update = (deltaTime) => { this._currentSceneTemplate.components.forEach(component => component.update(deltaTime)); }
        this._sceneModel.destroy = () => { this._currentSceneTemplate.components.forEach(component => component.destroy()); }

        //start new scene by wrapper
        this.getInstance('PixiWrapper').setNewScene(this._sceneModel);
        this.emit(Urso.events.MODULES_SCENES_NEW_SCENE_INIT, name);

        Urso.assets.preload(this._currentSceneTemplate.assets, this._assetsLoadedHandler);

    }

    loadUpdate(loadProgress) {
        if (!this._sceneModel)
            return;
        this._sceneModel.loadUpdate(loadProgress);
        this.emit(Urso.events.MODULES_ASSETS_LOAD_PROGRESS, loadProgress);
    }

    _assetsLoadedHandler() {
        Urso.objects.create(this._currentSceneTemplate.objects);

        //call all components create
        this._sceneModel.create();

        this.emit(Urso.events.MODULES_SCENES_DISPLAY_FINISHED);
        this._displayInProgress = false;
    }
}

module.exports = ModulesScenesService;
