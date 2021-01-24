class ModulesTransportConnectionTypesWebsocket extends Urso.Core.Modules.Transport.BaseConnectionType {
    constructor(params){
        super(params);

        this._reconnectTimeout = null;
        this._socket = null;
        this._createSocket();
    }

    close(){
        this._socket.close();
        log('[SOCKET]: CLOSED')
    };

    reconnect(delay){
        log('[SOCKET]: RECONNECTING in ', delay)
        
        if(this._ready)
            this.close();
        

        // TODO: REPLACE TO ENGINE TIMEOUT LOGIC
        this._reconnectTimeout = setTimeout(() => {
            this._clearTimeout();
            this._createSocket();
            log('[SOCKET]: RECONNECTED')
        }, delay);
    };

    send(message){
        const preparedMessage = JSON.stringify(message);
        this._socket.send(preparedMessage);
        log('[SOCKET]: SEND:', preparedMessage)
    };

    _clearTimeout(){
        clearTimeout(this._reconnectTimeout);
        this._reconnectTimeout = null;
    }

    _createSocket(){
        this._socket = new WebSocket(this._host);
        this._socket.onopen = this._onOpen.bind(this);
        this._socket.onmessage = this._onMessage.bind(this);
        this._socket.onerror = this._onError.bind(this);
        this._socket.onclose = this._onClose.bind(this);
        log('[SOCKET]: CREATED')
    };

    _onOpen(){
        this._ready = true;
        this._runCallback('ready');
        log('[SOCKET]: READY')
    };

    _onMessage(message){
        // const res = JSON.parse(message.data);
        log('[SOCKET]: RECEIVED ', message.data)
        this._runCallback('response', message.data);
    };

    _onClose(){
        this._ready = false;
        this._socket = null;
        this._runCallback('close');
    };

    _onError(){
        this._ready = false;
        this._runCallback('error');
        log('[SOCKET]: ERROR')
    };
}

module.exports = ModulesTransportConnectionTypesWebsocket;