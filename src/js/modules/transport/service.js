class ModulesTransportService {
    constructor() {
        this._callbacks = {};
        this._config = this.getInstance('Config').getConfig();

        this.WEBSOCKET = 'websocket';
        this.XHR = 'xhr';

        this._communicator = null;
    }

    on(event, callback, force) {
        if (!this._checkCallback(event) || force)
            this._setCallback(event, callback);
    };

    init() {
        this._createConnection();
    };

    send(message) {
        if (!this._checkCommunicator() || !this._checkCommunicatorReady())
            return false;

        const decoratedMessage = this.getInstance('Decorator').toServer(message);
        const validatedMessage = this._validateMessage(decoratedMessage);
        this._communicator.send(validatedMessage);

        return true;
    };

    reconnect() {
        if (!this._checkCommunicator())
            return false;

        this._communicator.reconnect(this._config.autoReconnectionDelay || 0);

        return true;
    };

    close() {
        if (!this._checkCommunicator())
            return false;

        this._communicator.close();

        return true;
    };

    _checkCallback(event) {
        const result = !!this._callbacks[event];

        if (result)
            Urso.logger.error(`Overwrite ${event} event detected!`);

        return result;
    };

    _checkCommunicator() {
        if (!this._communicator)
            Urso.logger.error('Communicator was not created!');

        return true;
    }

    _checkCommunicatorReady() {
        return this._communicator.readyCheck();
    };

    _destroyCommunicator() {
        this._communicator = null;
    };

    _prepareCallback(event, callback) {
        const func = message => {
            const data = this._runMiddleWare(event, message);
            return callback(data);
        };

        return func;
    }

    _runMiddleWare(event, data) {
        switch (event) {
            case 'response':
                const decoratedMessage = this.getInstance('Decorator').toFront(JSON.parse(data));
                return this._validateMessage(decoratedMessage);

            case 'close':
            case 'error':
                this._tryReconnect();;
            default:
                return data;
        }
    };

    _tryReconnect() {
        if (!this._config.autoReconnection)
            return false;

        this._communicator.reconnect(this._config.autoReconnectionDelay);
    };

    _setCallback(event, callback) {
        this._callbacks[event] = this._prepareCallback(event, callback);
    };

    _validateMessage(message) {
        // TODO : SET VALIDATION MODELS
        return { ...message };
    };

    _getHost(type) {
        const hosts = this._config.hosts;

        switch (type) {
            case this.WEBSOCKET:
                return hosts.wsHost;
            case this.XHR:
                return hosts.xhrHost;
            default:
                return false;
        }
    };

    _createConnection(type = this.WEBSOCKET) {
        const host = this._getHost(type);
        const callbacks = this._callbacks;
        const capitalizedType = Urso.helper.capitaliseFirstLetter(type);

        this._communicator = this.getInstance(`ConnectionTypes.${capitalizedType}`, { callbacks, host });

        if (!this._communicator)
            Urso.logger.error(`Transport type: '${capitalizedType}' was not found!`);
    };
}

module.exports = ModulesTransportService;
