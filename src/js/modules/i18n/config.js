class ModulesI18nConfig {
    constructor() {
        this.singleton = true;

        // CHANGED: Game-specific locale configuration replaced with empty object — removed game coupling
        // Example from reference game showing key-value pairs of locale keys to locale JSON file paths:
        /*
        this.locales = {
            'de': 'i18n/de.json',
            'en': 'i18n/en.json',
            'ru': 'i18n/ru.json'
        };
        */
        this.locales = {};
    }
};

export default ModulesI18nConfig;

