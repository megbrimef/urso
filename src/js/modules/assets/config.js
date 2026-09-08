class ModulesAssetsConfig {
    constructor() {
        this.singleton = true;

        this.defaultQualityFactor = 1;
        this.addFolderPathInAtlasTextureKey = true; //or false for simple textures names

        /**
         * quality settings for resource loading selection
         */
        this.qualityFactors = {
            medium: 0.5,
            hd: 0.75,
            high: 1
        };


        /**
         * Group names for asset organization. Override this in Urso.App.Modules.Assets.Config.
         * Each key is a friendly name; each value is the string used in asset templates' loadingGroup property.
         * The 'initial' group (value: 0) is mandatory — all untagged assets and preload-priority assets use it.
         * Other groups can be added for deferred loading via lazyLoadGroups or manual loadGroup() calls.
         * Example:
         *   loadingGroups = { initial: 0, ui: 'ui', particles: 'particles', bosses: 'bosses' }
         *   Then in asset templates: loadingGroup: 'ui', loadingGroup: 'particles', etc.
         */
        this.loadingGroups = {
            initial: 0 //will load on the preload
            /*lazyPart1: 'lazyPart1',
            lazyPart2: 'lazyPart2'*/
        };

        /**
         * Ordered list of group names (values from loadingGroups) to load in the background after preload.
         * Groups load sequentially in this order. A missing or unknown group name is skipped silently.
         * Use this to prioritize which lazy assets load first, or leave empty for manual loadGroup() control.
         * Example: lazyLoadGroups = [ this.loadingGroups.ui, this.loadingGroups.particles, this.loadingGroups.bosses ]
         */
        this.lazyLoadGroups = [
            /*this.loadingGroups.lazyPart1,
            this.loadingGroups.lazyPart2*/
        ];
    }
}

export default ModulesAssetsConfig;
