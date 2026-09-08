import AppTemplatesScenesPlay from '../templates/scenes/play.js';
import AppModulesAssetsConfig from '../modules/assets/config.js';

window.Urso.App = {
    Modules: {
        Assets: {
            // Overrides Urso.Core.Modules.Assets.Config entirely; any class at this path in Urso.App replaces the Core version
            Config: AppModulesAssetsConfig
        }
    },
    Templates: {
        Scenes: {
            Play: AppTemplatesScenesPlay
        }
    }
};
