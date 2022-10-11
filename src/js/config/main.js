let ConfigMain = {
    title: 'Urso', //game title
    appVersion: 0, //app version, also used as anticache  "appVersion=${appVersion}" when not 0
    mode: "development", // development/production/testing
    defaultLogLevel: 'ERROR,WARNING,INFO,LOG', //setup custom log level with:  ?logLevel=1,2,3,4  OR  ?logLevel=ERROR,WARNING,INFO,LOG
    extendingChain: ['Urso.Core'], //chain that will be set as Urso.Game
    defaultScene: 'play', //default scene to display
    useBinPath: false, // use assets from bin directory
    useTransport: false, // use transport module for connetcting with server
    fps: {
        limit: 60, //max fps limit
        optimizeLowPerformance: true //down to 30 fps if lower 60
    }
};

module.exports = ConfigMain;
