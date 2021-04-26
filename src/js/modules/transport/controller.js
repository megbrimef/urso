class ModulesTransportController {
    constructor() {
        this._service = null;
    }

    _updateService() {
        this._service = this.getInstance('Service');
    };

    init(){
        this._updateService();
        this._service.init();
    };

    setOnConnectionHandler(handler){
        this._service.on('connection', handler);
    };

    setReadyHandler(handler){
        this._service.on('ready', handler);
    };

    setErrorHandler(handler){
        this._service.on('error', handler);
    };

    setResponseHandler(handler){
        this._service.on('response', handler);
    };

    setOnCloseHandler(handler){
        this._service.on('close', handler);
    };

    send(message){
        this._service.send(message);
    };

    reconnect(){
        this._service.reconnect();
    };

    close(){
        this._service.close();
    };
}

module.exports = ModulesTransportController;
