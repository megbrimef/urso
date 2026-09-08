//setup custom log level with:  ?logLevel=1,2,3,4  OR  ?logLevel=ERROR,WARNING,INFO,LOG

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
        // FIXED: Added production mode detection — in production, default to ERROR-only unless URL parameter overrides it
        const urlLogLevel = Urso.helper.parseGetParams('logLevel');
        const defaultLevel = Urso.config.mode === 'production' && !urlLogLevel ? '0' : Urso.config.defaultLogLevel;
        const logLevelsString = urlLogLevel || defaultLevel;
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

export default LibLogger;
