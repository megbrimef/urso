class ModulesLogicConfigSounds {
    constructor(){
        this.singleton = true;
        this.soundsConfig = this.getSoundsConfig();
    }

    getSoundsConfig(){
        return {
            main: [
                { soundKey: 'sound1', event: 'sound1.play.once', action: 'play' },
                { soundKey: 'sound_check', event: 'soundCheck.play.once', action: 'play' },
                { soundKey: 'sound_check', event: 'soundCheck.stop', action: 'stop' },
                { soundKey: 'sound_check', event: 'soundCheck.pause', action: 'pause' },
                { soundKey: 'sound_check', event: 'soundCheck.resume', action: 'resume' },
                { soundKey: 'sound_check', event: 'soundCheck.play.loop', action: 'play', relaunch: true, loop: true }
            ]
        };
    };

};

module.exports = ModulesLogicConfigSounds;

