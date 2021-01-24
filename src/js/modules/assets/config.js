class ModulesAssetsConfig {
    constructor() {
        this.singleton = true;

        /**
         * initial is the default and will load on the preload
         * also you can call preload manualy by assets.loadGroup('groupName')
         */
        this.loadingGroups = {
            initial: 0 //will load on the preload
            /*lazyPart1: 'lazyPart1',
            lazyPart2: 'lazyPart2'*/
        }

        /**
         * you can make lazy load groups priority here
         */
        this.lazyLoadGroups = [
            /*this.loadingGroups.lazyPart1,
            this.loadingGroups.lazyPart2*/
        ];
    }
}

module.exports = ModulesAssetsConfig;
