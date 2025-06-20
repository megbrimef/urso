import ComponentsBaseController from './../base/controller';

class ComponentsEditorController extends ComponentsBaseController {
    constructor(params) {
        super(params);

        this._api = this.getInstance('Api');
        Urso.helper.recursiveSet('_dev.editorApi', this._api, Urso);
    }

}

export default ComponentsEditorController;