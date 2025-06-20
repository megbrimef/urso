class ModulesTransportDecorator {
    constructor({ callbacks }) {
        this._callbacks = callbacks;
        this.singleton = true;
    }

    toServer(message) {
        return message;
    };

    toFront(message) {
        return message;
    };

}

export default ModulesTransportDecorator;
