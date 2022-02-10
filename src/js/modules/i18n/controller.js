class ModulesI18nController {

    #vocabulary = null;

    /**
     * get text by localeId
     * @param {String} localeId 
     * @param {Object} [localeVariables] - variables for locale string
     */
    get(localeId, localeVariables = {}) {
        if (this.#vocabulary && this.#vocabulary[localeId]) {
            return this._interpolate(this.#vocabulary[localeId], localeVariables);
        }

        return localeId;
    }

    /**
     * set alredy loaded as asset locale
     * @param {String} localeKey - loaded json asset key with locale
     */
    setLocale(localeKey) {
        const jsonResource = Urso.cache.getJson(localeKey);

        if (!jsonResource)
            return Urso.logger.error('ModulesI18nController setLocale error, no loaded json:' + localeKey + '. Check assets please');

        this.#vocabulary = jsonResource.data;
        this.emit(Urso.events.MODULES_I18N_NEW_LOCALE_WAS_SET, localeKey);
    }

    /**
     * load json with locale, store as asset witn localeKey as key and set locale
     * @param {String} localeKey 
     * @param {String} [pathToLocaleJson] if this param will not used - we will check localeKey in config
     */
    loadAndSetLocale(localeKey, pathToLocaleJson) {
        //check if localeKey was alredy loaded
        const jsonResource = Urso.cache.getJson(localeKey);

        if (jsonResource) {
            this.setLocale(localeKey);
        }

        //load locale by path
        if (pathToLocaleJson) {
            this._loadLocaleByPath(localeKey, pathToLocaleJson);
        } else { //we will check localeKey in config
            this._loadLocaleByConfig(localeKey);
        }
    }

    _loadLocaleByConfig(localeKey) {
        const locales = this.getInstance('Config').locales;
        const pathToLocaleJson = locales[localeKey];

        if (!pathToLocaleJson)
            return Urso.logger.error('ModulesI18nController _loadLocaleByConfig error, no locale data in config:' + localeKey + '. Check ModulesI18nConfig please');

        this._loadLocaleByPath(localeKey, pathToLocaleJson);
    }

    _loadLocaleByPath(localeKey, pathToLocaleJson) {
        const localeAsset = { type: Urso.types.assets.JSON, key: localeKey, path: pathToLocaleJson };
        Urso.assets.preload(localeAsset, () => this.setLocale(localeKey));
    }

    _interpolate(string, params) {
        const names = Object.keys(params);
        const vals = Object.values(params);
        return new Function(...names, `return \`${string}\`;`)(...vals);
    }
}

module.exports = ModulesI18nController;
