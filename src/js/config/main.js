let ConfigMain = {
    title: 'Urso', //game title
    appVersion: 0, //app version, also used as anticache  "appVersion=${appVersion}" when not 0
    mode: "development", // development/production/testing
    defaultLogLevel: 'ERROR,WARNING,INFO,LOG', //setup custom log level with:  ?logLevel=1,2,3,4  OR  ?logLevel=ERROR,WARNING,INFO,LOG
    extendingChain: ['Urso.Core'], //chain that will be set as Urso.Game
    defaultScene: 'play', //default scene to display
    gamePath: '', //use assets from some gamePath directory, not from page was loaded
    useBinPath: false, // use assets from bin directory,
    useAvifAtlases: false, // bin/ only: load atlases from images/<quality>/avif/ where the browser decodes AVIF; ?avif=0 turns it off
    useUberJson: false, // bin/ only: take every json of bin/ from one bin/uber.json fetched before the first assets; ?uber=0 turns it off
    useTransport: false, // use transport module for connetcting with server
    gameContainerSelector: false, // CSS selector for element the canvas is appended to; falls back to document.body if not set
    sizeContainerSelector: false, // CSS selector for element whose size the scene follows (e.g. a wrapper's UI box); falls back to the window if not set or not laid out
    // FIXED: added silenceConsoleLog flag to gate overwriting the global console.log — this affects the entire host page, not just the engine, so it is disabled by default. Only enable when a production build deliberately wants total silence.
    silenceConsoleLog: false, // when the LOG level is disabled, also overwrite the global console.log for the entire host page; defaults to false to not break host page console
    fps: {
        limit: 60, //max fps limit; 0 = a frame on every screen refresh (PIXI's maxFPS compares whole ms with 16.67, so 60 drops a frame now and then on 60 Hz and draws unevenly on 90/120 Hz)
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
        culling: false, // enable occlusion culling plugin; trades CPU (bounds checks) for GPU (skip rendering), profile before enabling
        autoGenerateMipmaps: undefined, // mipmaps for every loaded texture (smoother art drawn smaller than its pixels); undefined uses Pixi default (false)
        additiveBatching: false // draw 'add' and 'normal' blended sprites in one batch (premultiplied textures only); ?addBatch=0 turns it off
    },
    maxCanvasSize: 0 // max canvas side in device pixels; 0 = the largest resolution in ResolutionsConfig (as before)
};

export default ConfigMain;
