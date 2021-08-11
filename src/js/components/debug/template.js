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
                    }
                ]
            }
        ]
    }

}

module.exports = ComponentsDebugTemplate;
