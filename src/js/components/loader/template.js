class ComponentsLoaderTemplate {
    constructor() {
        this.styles = {
            '.loadingTextStyle': {
                fill: 0xFFFFFF,
                fontSize: 32,
                fontWeight: 'bold'
            }
        };
        this.assets = [];
        this.objects = [
            {
                type: Urso.types.objects.CONTAINER,
                name: 'loaderContainer',
                contents: [
                    {
                        type: Urso.types.objects.GRAPHICS,
                        name: 'bgLoader',
                        figure: {
                            rectangle: [0, 20, 500, 20],
                            fillColor: 0x66f542
                        }
                    },
                    {
                        type: Urso.types.objects.CONTAINER,
                        contents: [
                            {
                                type: Urso.types.objects.GRAPHICS,
                                figure: {
                                    rectangle: [4, 24, 492, 13],
                                }
                            },
                            {
                                type: Urso.types.objects.GRAPHICS,
                                name: 'loaderBg',
                                figure: {
                                    rectangle: [4, 24, 492, 13],
                                    fillColor: 0x66f542
                                }
                            },
                            {
                                type: Urso.types.objects.GRAPHICS,
                                name: 'loaderBgMask',
                                figure: {
                                    rectangle: [4, 24, 492, 13]
                                }
                            },
                            {
                                type: Urso.types.objects.CONTAINER,
                                x: 260,
                                y: 50,
                                contents: [
                                    {
                                        type: Urso.types.objects.TEXT,
                                        class: 'loadingTextStyle loadAmountText',
                                        anchorX: 0.5,
                                        text: '100%'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];
    };
};

module.exports = ComponentsLoaderTemplate;