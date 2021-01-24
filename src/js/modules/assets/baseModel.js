class ModulesAssetsBaseModel {
    constructor(params) {
        this.id = Urso.helper.recursiveGet('id', params, false);
        this.type = Urso.helper.recursiveGet('type', params, null);
        this.key = Urso.helper.recursiveGet('key', params, false);
        this.path = Urso.helper.recursiveGet('path', params, false);
        this.useBinPath = Urso.helper.recursiveGet('useBinPath', params, false) || Urso.config.mode !== 'development'; //or true if we want to use asset from assetsBin
        //lazy load params
        this.loadingGroup = Urso.helper.recursiveGet('loadingGroup', params, false); //initial or some extra name
        this.placeHolder = Urso.helper.recursiveGet('placeHolder', params, false); //placeHolder assets model //TODO
        this._templatePath = false;
    }
}

module.exports = ModulesAssetsBaseModel;