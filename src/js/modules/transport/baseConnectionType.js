class ModulesTransportBaseConnectionType {
    constructor({ callbacks, host }) {
        this._host = host || false;
        this._callbacks = callbacks || {};
        this._ready = false;
    }
    
    close(){};

    readyCheck(){
        return this._ready;
    };

    reconnect(){};

    send(message){};

    _runCallback(name, params){
        if(this._callbacks[name])
            this._callbacks[name](params);
    };
}

module.exports = ModulesTransportBaseConnectionType;
