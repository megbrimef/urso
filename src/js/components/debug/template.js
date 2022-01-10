class ComponentsDebugTemplate {

    constructor() {
        this.objects = [
            {
                type: Urso.types.objects.CONTAINER,
                name: 'debugContainer',
                contents:[
                    {
                        type: Urso.types.objects.TEXT,
                        name: 'debugCoords',
                        text: 'x:0, y:0',
                        fontFamily: 'Helvetica',
                        fontSize: 15,
                        fill: '#00FF00'
                    },
                    {
                        type: Urso.types.objects.TEXT,
                        name: 'debugFps',
                        text: 'fps: 0',
                        y: 15,
                        fontFamily: 'Helvetica',
                        fontSize: 15,
                        fill: '#00FF00'
                    },
                    {
                        type: Urso.types.objects.TEXT,
                        name: 'debugTimescaleValue',
                        text: '1',
                        x: '50%',
                        y: '30%',
                        visible: false,
                        anchorX: 0.5,
                        anchorY: 0.5,
                        fontFamily: 'Verdana',
                        fontSize: 100,
                        fontStyle: 'italic',
                        fontWeight: 'bold',
                        fill: ['#ffffff', '#00ff99'], // gradient
                        stroke: '#4a1850',
                        strokeThickness: 5,
                        dropShadow: true,
                        dropShadowColor: '#000000',
                        dropShadowBlur: 4,
                        dropShadowAngle: Math.PI / 6,
                        dropShadowDistance: 6,
                    }
                ]
            }
        ]
    }

}

module.exports = ComponentsDebugTemplate;
