class ComponentsSoundInitialPopupTemplate {
    constructor(){

        this.objects = [
            { 
                type: Urso.types.objects.HITAREA,
                x: -50,
                y: -50,
                width: 2000,
                height: 1200
            },
            { 
                type: Urso.types.objects.GRAPHICS,
                figure: {
                    rectangle: [0, 0, 1920, 1080],
                    fillColor: 'black'
                }
            },
            { 
                type: Urso.types.objects.TEXT,
                y: -100,
                alignX: 'center',
                alignY: 'center',
                anchorX: 0.5,
                anchorY: 0.5,
                fill: 'gray',
                fontFamilu: 'Helvetica',
                fontSize: 72,
                fontWeight: 800,
                text: 'Enable sound?'
            },
            { 
                type: Urso.types.objects.CONTAINER,
                x: 600,
                y: 650,
                with: 200,
                height: 70,
                contents: [
                    { 
                        type: Urso.types.objects.GRAPHICS,
                        name: 'soundInitialPopupButtonYesGraphics',
                        figure: {
                            rectangle: [0, 0, 200, 70],
                            fillColor: 0xd8ac03
                        }
                    },
                    { 
                        type: Urso.types.objects.TEXT,
                        anchorX: 0.5,
                        anchorY: 0.5,
                        x: 100,
                        alignY: 'center',
                        fill: 'black',
                        fontFamilu: 'Helvetica',
                        fontSize: 40,
                        fontWeight: 800,
                        text: 'YES'
                    },
                    { 
                        type: Urso.types.objects.HITAREA,
                        name: 'soundInitialPopupButtonYesHit',
                        width: 200,
                        height: 70,
                        onOverCallback: () => this.emit('components.soundInitialPopup.pointerAction.popupButton', {buttonName: 'yes', pointerOver: true}),
                        onOutCallback: () => this.emit('components.soundInitialPopup.pointerAction.popupButton', {buttonName: 'yes', pointerOver: false}),
                    },
                ]
            },
            { 
                type: Urso.types.objects.CONTAINER,
                x: 1150,
                y: 650,
                with: 200,
                height: 70,
                contents: [
                    { 
                        type: Urso.types.objects.GRAPHICS,
                        name: 'soundInitialPopupButtonNoGraphics',
                        figure: {
                            rectangle: [0, 0, 200, 70],
                            fillColor: 0xd8ac03
                        }
                    },
                    { 
                        type: Urso.types.objects.TEXT,
                        anchorX: 0.5,
                        anchorY: 0.5,
                        x: 100,
                        alignY: 'center',
                        fill: 'black',
                        fontFamilu: 'Helvetica',
                        fontSize: 40,
                        fontWeight: 800,
                        text: 'NO'
                    },
                    { 
                        type: Urso.types.objects.HITAREA,
                        name: 'soundInitialPopupButtonNoHit',
                        width: 200,
                        height: 70,
                        onOverCallback: () => this.emit('components.soundInitialPopup.pointerAction.popupButton', {buttonName: 'no', pointerOver: true}),
                        onOutCallback: () => this.emit('components.soundInitialPopup.pointerAction.popupButton', {buttonName: 'no', pointerOver: false}),
                    },
                ]
            }
        ]
    }
};

module.exports = ComponentsSoundInitialPopupTemplate;