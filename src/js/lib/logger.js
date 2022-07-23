//setup custom log level with:  ?logLevel=1,2,3,4  OR  ?logLevel=ERROR,WARNING,INFO,LOG

const DEFAULT_LOG_LEVEL = 'ERROR,WARNING,INFO,LOG'; //also can be 0,1,2,3

const LEVELS = [
    'ERROR',
    'WARNING',
    'INFO',
    'LOG'
];

class LibLogger {
    constructor() {
        this._logLevel = {};
        this._setupLevels();

        //log
        if (this._logLevel['LOG']) {
            window.log = console.log.bind(console);
        } else {
            window.log = console.log = () => { }
        }
    }

    //todo set log level (dev/prod)

    log() {
        if (!this._logLevel['LOG']) return;

        console.log.apply(console, arguments);
    }

    info() {
        if (!this._logLevel['INFO']) return;

        console.info.apply(this, arguments);
    }

    warn() {
        if (!this._logLevel['WARNING']) return;

        console.warn.apply(this, arguments);
    }

    error() {
        if (!this._logLevel['ERROR']) return;

        console.error.apply(this, arguments);
    }

    /**
     * setup logging levels
     */
    _setupLevels() {
        const logLevelsString = Urso.helper.parseGetParams('logLevel') || DEFAULT_LOG_LEVEL;
        const logLevelsArray = logLevelsString.split(',');

        for (const [index, level] of Object.entries(LEVELS)) {
            let levelValue = false;

            if (logLevelsArray.includes(index) || logLevelsArray.includes(level))
                levelValue = true;

            this._logLevel[level] = levelValue;
        }

        console.log(`LibLogger log Level: ${JSON.stringify(this._logLevel)}`);
    }
}

module.exports = LibLogger;