let ConfigMain = {
    title: 'Urso', //game title
    appVersion: 0, //app version, also used as anticache  "appVersion=${appVersion}" when not 0
    mode: "development", // development/production/testing
    defaultLogLevel: 'ERROR,WARNING,INFO,LOG', //setup custom log level with:  ?logLevel=1,2,3,4  OR  ?logLevel=ERROR,WARNING,INFO,LOG
    extendingChain: ['Urso.Core'], //chain that will be set as Urso.Game
    defaultScene: 'play', //default scene to display
    gamePath: '', //use assets from some gamePath directory, not from page was loaded
    useBinPath: false, // use assets from bin directory,
    useTransport: false, // use transport module for connetcting with server
    gameContainerSelector: false, // CSS selector for element the canvas is appended to; falls back to document.body if not set
    fps: {
        limit: 60, //max fps limit
        optimizeLowPerformance: false //down to 30 fps if lower 60
    },
    // ADDED: renderer options — tuning for hardware profiling and performance optimization
    renderer: {
        background: "0x222222", // canvas background color (default black: 0x000000)
        antialias: false, // enable antialiasing; costs GPU time, profile on target hardware before enabling
        powerPreference: undefined, // GPU power preference: 'high-performance' or 'low-power'; undefined lets browser decide
        preference: undefined, // renderer preference: 'webgl' or 'webgpu'; undefined lets Pixi auto-detect
        gcActive: undefined, // garbage collection enabled; undefined uses Pixi default (true)
        gcMaxUnusedTime: undefined, // max unused time in ms before GC; undefined uses Pixi default (60000ms)
        gcFrequency: undefined, // GC frequency in ms; undefined uses Pixi default (30000ms)
        culling: false // enable occlusion culling plugin; trades CPU (bounds checks) for GPU (skip rendering), profile before enabling
    }
};

export default ConfigMain;
