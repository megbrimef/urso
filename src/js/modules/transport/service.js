class ModulesTransportService {
    constructor() {
        this._callbacks = {};
        this._config = this.getInstance('Config').getConfig();
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
        if (!this._checkCommunicatorReady())
            return false;

        const decoratedMessage = this.getInstance('Decorator', { callbacks: this._callbacks }).toServer(message);

        if(!decoratedMessage) {
            return false;
        }

        const validatedMessage = this._validateMessage(decoratedMessage);

        if(!validatedMessage) {
            return false;
        }

        this._communicator.send(validatedMessage);

        return true;
    };

    reconnect() {
        if (!this._checkCommunicatorReady())
            return false;

        this._communicator.reconnect(this._getAutoReconnetionDelay());

        return true;
    };

    close() {
        if (!this._checkCommunicatorReady())
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

    _checkCommunicatorReady() {
        if (!this._communicator) {
            Urso.logger.error('Communicator was not created!');
            return false;
        }
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
                const decoratedMessage = this.getInstance('Decorator', { callbacks: this._callbacks }).toFront(data);

                if(!decoratedMessage) {
                    return;
                }

                return this._validateMessage(decoratedMessage);

            case 'close':
            case 'error':
                this._tryReconnect();;
            default:
                return data;
        }
    };

    _autoReconnectCheck() {
        return this._config.reconnectTimeout;
    }

    _getAutoReconnetionDelay() {
        return this._config.autoReconnect || 0;
    }

    _tryReconnect() {
        if (!this._autoReconnectCheck())
            return false;

        this._communicator.reconnect(this._getAutoReconnetionDelay());
    };

    _setCallback(event, callback) {
        this._callbacks[event] = this._prepareCallback(event, callback);
    };

    _validateMessage(message) {
        // TODO : SET VALIDATION MODELS
        return { ...message };
    };

    _getHost() {
        return this._config.host;
    };

    _getType() {
        return this._config.type;
    }

    _createConnection() {
        const host = this._getHost();
        const type = this._getType();
        const callbacks = this._callbacks;
        const capitalizedType = Urso.helper.capitaliseFirstLetter(type);
        
        this._communicator = this.getInstance(`ConnectionTypes.${capitalizedType}`, { callbacks, host });

        if (!this._communicator)
            Urso.logger.error(`Transport type: '${capitalizedType}' was not found!`);
    };
}

module.exports = ModulesTransportService;
