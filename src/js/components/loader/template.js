class ComponentsLoaderTemplate {
    constructor() {
        this.styles = {
            '.loadingTextStyle': {
                fill: 0xFFFFFF,
                fontSize: 32,
                fontWeight: 'bold',
                fontStyle: 'italic',
            }
        };

        this.assets = [];

        this.objects = [
            // {
            //     type: Urso.types.objects.GRAPHICS,
            //     x: 100,
            //     y: 100,
            //     name: 'qqqq',
            //     figure: {
            //         rectangle: [0, 0, 100, 100],
            //         fillColor: 0x66f542
            //     }
            // },
            // {
            //     type: Urso.types.objects.CONTAINER,
            //     name: 'loaderContainer',
            //     visible: false, 
            //     contents: [
            //         {
            //             type: Urso.types.objects.GRAPHICS,
            //             name: 'bgLoader',
            //             figure: {
            //                 rectangle: [0, 20, 500, 20],
            //                 fillColor: 0x66f542
            //             }
            //         },
            //         {
            //             type: Urso.types.objects.CONTAINER,
            //             contents: [
            //                 {
            //                     type: Urso.types.objects.GRAPHICS,
            //                     figure: {
            //                         rectangle: [4, 24, 492, 13],
            //                     }
            //                 },
            //                 {
            //                     type: Urso.types.objects.GRAPHICS,
            //                     name: 'loaderBg',
            //                     figure: {
            //                         rectangle: [4, 24, 492, 13],
            //                         fillColor: 0x66f542
            //                     }
            //                 },
            //                 {
            //                     type: Urso.types.objects.GRAPHICS,
            //                     name: 'loaderBgMask',
            //                     figure: {
            //                         rectangle: [4, 24, 492, 13]
            //                     }
            //                 },
            //                 {
            //                     type: Urso.types.objects.CONTAINER,
            //                     x: 260,
            //                     y: 50,
            //                     contents: [
            //                         {
            //                             type: Urso.types.objects.TEXT,
            //                             class: 'loadingTextStyle loadAmountText',
            //                             anchorX: 0.5,
            //                             text: '100%'
            //                         }
            //                     ]
            //                 }
            //             ]
            //         }
            //     ]
            // }
        ];
    };
};

export default ComponentsLoaderTemplate;