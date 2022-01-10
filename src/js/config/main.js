let ConfigMain = {
    title: 'Urso', //game title
    mode: "development", // development/production/testing
    extendingChain: ['Urso.Core'], //chain that will be set as Urso.Game
    defaultScene: 'play', //default scene to display
    useBinPath: false, // use assets from bin directory
    useTransport: false // use transport module for connetcting with server
};

module.exports = ConfigMain;
