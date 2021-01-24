class LibLogger {

    constructor() {
        //log
        window.log = console.log.bind(console);  //todo this.log ?!
    }

    //todo set log level (dev/prod)

    log() {
        console.log.apply(console, arguments);
    }

    warn() {
        console.warn.apply(this, arguments);
    }

    error() {
        console.error.apply(this, arguments);
    }
}

module.exports = LibLogger;