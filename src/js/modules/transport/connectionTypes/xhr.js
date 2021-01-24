class ModulesTransportConnectionTypesXhr extends Urso.Core.Modules.Transport.BaseConnectionType {
    constructor(params){
        super(params);

        this._xhr = null;
        this._ready = true;
    }

    send(message){
        this._createXhr();
        const preparedMessage = JSON.stringify(message);
        this._xhr.send(preparedMessage);
        log('[XHR] SEND:', preparedMessage);
    };


    _createXhr(){
        this._xhr = new XMLHttpRequest();
        this._xhr.onerror = this._onError.bind(this);
        this._xhr.onreadystatechange = this._onReadyStateChange.bind(this);
        this._xhr.open('GET', this._host, true);
        log('[XHR]: CREATED');
    };

    _onMessage(message){
        const res = JSON.parse(message);
        this._runCallback('response', res);
        log('[XHR] RESPONSE RECEIVED', message);
    };

    _onError(){
        this._runCallback('error');
        log('[XHR] ERROR')
    };

    _onReadyStateChange({ target }){
        if(target.readyState === 4)
            this._onMessage(target.response);
    };
}

module.exports = ModulesTransportConnectionTypesXhr;