class ModulesTransportConfig {

    getConfig() {
        return {
                autoReconnect: true,
                reconnectTimeout: 5000,
                type: 'websocket', // websocket | xhr
                host: Urso.helper.parseGetParams('wsHost')
            }
        }
}

module.exports = ModulesTransportConfig;
