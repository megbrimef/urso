const ModulesTransportBaseConnectionType = require('../baseConnectionType');

class ModulesTransportConnectionTypesXhr extends ModulesTransportBaseConnectionType {
    constructor(params) {
        super(params);

        this._xhr = null;
        this._ready = true;
        this._runCallback('ready');
    }

    send(message) {
        this._createXhr();
        const preparedMessage = JSON.stringify(message);
        this._xhr.send(preparedMessage);
        log('[XHR] SEND:', preparedMessage);
    };

    _getMethod() {
        return 'POST';
    };

    _createXhr() {
        this._xhr = new XMLHttpRequest();
        this._xhr.onerror = this._onError.bind(this);
        this._xhr.onreadystatechange = this._onReadyStateChange.bind(this);
        this._xhr.open(this._getMethod(), this._host, true);
    };

    _onMessage(message) {
        const res = JSON.parse(message);
        this._runCallback('response', res);
        log('[XHR] RESPONSE RECEIVED', message);
    };

    _onError() {
        this._runCallback('error');
        log('[XHR] ERROR')
    };

    _onReadyStateChange({ target }) {
        if (target.readyState === 4)
            this._onMessage(target.response);
    };
}

module.exports = ModulesTransportConnectionTypesXhr;