class AppTemplatesScenesPlay {
    // === EXAMPLE: Using Lazy-Loaded Assets ===
    //
    // This section is commented out because the demo repo has no asset files.
    // To exercise lazy loading, uncomment this and add actual image/atlas files,
    // then tag them in the assets array with loadingGroup: 'ui' or similar.
    //
    // The loadingGroup field must match a key from Urso.App.Modules.Assets.Config.loadingGroups.
    // Groups in lazyLoadGroups load automatically after preload; others can load manually via
    // await Urso.assets.loadGroup('groupName')
    //
    // Asset `type` must be a constant from Urso.types.assets (a number) — a bare string
    // falls through the switch in ModulesAssetsService._addAsset and logs an asset type error.
    // Object `type` must likewise come from Urso.types.objects; note the object type for a
    // plain image is IMAGE (there is no SPRITE type in this engine).
    //
    // assets = [
    //     {
    //         type: Urso.types.assets.IMAGE,
    //         key: 'myImage',
    //         path: 'path/to/image.png',
    //         loadingGroup: 'ui'  // defers loading until the 'ui' group is requested
    //     }
    // ];
    //
    // Example object referencing a lazy asset:
    // {
    //     type: Urso.types.objects.IMAGE,
    //     x: 500,
    //     y: 250,
    //     assetKey: 'myImage'
    // }

    objects = [
        {
            type: Urso.types.objects.GRAPHICS,
            x: 910,
            y: 490,
            figure: {
                rectangle: [0, 0, 100, 100],
                fillColor: 0xff0000
            }
        }
    ];
}

export default AppTemplatesScenesPlay;
