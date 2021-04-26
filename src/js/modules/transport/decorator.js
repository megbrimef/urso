class ModulesTransportDecorator {
    constructor() {
        this.singleton = true;
    }

    toServer(message) {
        return message;
    };

    toFront(message) {
        return message;
    };

}

module.exports = ModulesTransportDecorator;
