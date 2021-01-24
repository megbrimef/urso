class ModulesLogicConfigSounds {
    constructor(){
        this.singleton = true;
        this.soundsConfig = this.getSoundsConfig();
    }

    getSoundsConfig(){
        return {
            main: [
                { s: 'sound1', e: 'sound1.play.once', action: 'play' },
                { s: 'sound_check', e: 'soundCheck.play.once', action: 'play' },
                { s: 'sound_check', e: 'soundCheck.stop', action: 'stop' },
                { s: 'sound_check', e: 'soundCheck.pause', action: 'pause' },
                { s: 'sound_check', e: 'soundCheck.resume', action: 'resume' },
                { s: 'sound_check', e: 'soundCheck.play.loop', action: 'play', relaunch: true, loop: true }
            ]
        };
    };

};

module.exports = ModulesLogicConfigSounds;

