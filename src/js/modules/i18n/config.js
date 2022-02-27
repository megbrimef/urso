class ModulesI18nConfig {
    constructor() {
        this.singleton = true;

        /**
         * example of locales. Set please your keys and paths
         */
        this.locales = {
            'de': 'i18n/de.json',
            'en': 'i18n/en.json',
            'ru': 'i18n/ru.json'
        }
    }
};

module.exports = ModulesI18nConfig;

