/**
 * Urso.App.Modules.Assets.Config — Worked Example of Lazy-Loading Groups
 *
 * This file demonstrates how to override the Core assets configuration to enable
 * lazy-loading of asset groups. When you override a config class by placing it at
 * the same namespace path in Urso.App, the entire class is replaced wholesale
 * (not subclassed), so this must declare every field the Core version declares.
 *
 * === HOW LAZY LOADING WORKS ===
 *
 * At boot, Urso preloads all assets in the 'initial' group (value: 0) and any
 * assets without a loadingGroup specified. Once that preload finishes, the engine
 * walks lazyLoadGroups in order and loads each group in the background. There are
 * no Web Workers involved — it is the same loader, run after the initial preload.
 *
 * A game without this configuration will skip lazy loading entirely. A game with
 * it can then tag assets in scene templates with loadingGroup: 'groupName' to
 * defer their load until requested.
 *
 * === NOTE: NO ASSETS IN THIS DEMO ===
 *
 * This repository ships no asset files. The lazy groups declared below are wired
 * correctly, but they will remain empty unless the demo adds actual asset files
 * tagged with matching loadingGroup values. The purpose of this file is to show
 * the configuration structure and point to the runtime API.
 */

class AppModulesAssetsConfig {
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
            initial: 0, //will load on preload; untagged assets also load here
            ui: 'ui',
            particles: 'particles'
            // A real game would add more groups here, e.g.:
            // bosses: 'bosses',
            // world1: 'world1'
            // Keep this map FLAT — the engine matches a group by looking the value up in
            // Object.values(loadingGroups), so a nested object would never resolve.
        };

        /**
         * Ordered list of group names (values from loadingGroups) to load in the background after preload.
         * Groups load sequentially in this order. A missing or unknown group name is skipped silently.
         * Use this to prioritize which lazy assets load first, or leave empty for manual loadGroup() control.
         *
         * NOTE: The groups declared above will load in this order if they contain assets, but this demo
         * has no asset files, so these groups remain empty. To exercise lazy loading in a real game:
         * 1. Add asset files to the server
         * 2. Tag them in your scene templates with loadingGroup: 'ui' or loadingGroup: 'particles'
         * 3. The engine will load them in the order listed here
         *
         * Example: lazyLoadGroups = [ this.loadingGroups.ui, this.loadingGroups.particles ]
         */
        this.lazyLoadGroups = [
            this.loadingGroups.ui,
            this.loadingGroups.particles
        ];
    }
}

/**
 * RUNTIME API — how a game script uses lazy groups
 * (These methods are on Urso.assets, the singleton instance of ModulesAssetsController)
 *
 * await Urso.assets.loadGroup('ui')
 *   - Loads the group 'ui' immediately and returns a Promise
 *   - Also takes optional callback and updateCallback parameters
 *   - Never rejects. A group that is already loaded resolves immediately without
 *     reloading; a group already in flight resolves when that load completes.
 *   - A group with no registered assets resolves quietly, so a config may list
 *     groups that a given scene does not populate
 *
 * Urso.assets.isGroupLoaded('ui')
 *   - Returns boolean; true if the group has finished loading
 *   - Useful for UI to check asset availability without triggering loads
 *
 * Urso.assets.isGroupLoading('ui')
 *   - Returns boolean; true if the group is currently loading
 *   - Useful for showing loading spinners or disabling buttons until assets arrive
 *
 * await Urso.assets.unloadGroup('ui')
 *   - Releases the group's GPU resources and drops its entries from Urso.cache,
 *     so a bonus round can be freed when the game returns to the base game
 *   - Returns false if the group was never loaded, true once it is cleaned up
 *   - The group can be loaded again afterwards
 *
 * EVENTS — listen for when groups finish loading (see Urso.events, from ModulesObserverConfig)
 *
 * Urso.events.MODULES_ASSETS_GROUP_LOADED
 *   - Fired when any group finishes loading (preload, lazy, or manual)
 *   - Event data will include the group name
 *
 * Urso.events.MODULES_ASSETS_LAZYLOAD_FINISHED
 *   - Fired when all groups in lazyLoadGroups have finished loading
 *   - Signals that the background loader is done
 */

export default AppModulesAssetsConfig;
