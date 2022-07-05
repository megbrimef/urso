let ConfigMain = {
    title: 'Urso', //game title
    appVersion: 0, //app version to load valid resources
    mode: "development", // development/production/testing
    extendingChain: ['Urso.Core'], //chain that will be set as Urso.Game
    defaultScene: 'play', //default scene to display
    useBinPath: false, // use assets from bin directory
    useTransport: false // use transport module for connetcting with server
};

module.exports = ConfigMain;
