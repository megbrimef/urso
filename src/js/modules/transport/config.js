class ModulesTransportConfig {
    constructor() {
        this._setDefaultConfig();
    }

    getConfig() {
        return this._config;
    };

    _setDefaultConfig() {
        this._config = {
            autoReconnection: true,
            autoReconnectionDelay: 5000,
            hosts: {
                wsHost: 'ws://localhost:9100/',
                xhrHost: 'https://reqres.in/api/users/2'
            }
        };
    };
}

module.exports = ModulesTransportConfig;
