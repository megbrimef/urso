class ComponentsLayersSwitcher {
    
    constructor() {

        //allLayers config example
        this.allLayers = [
            '^granny',
            '^mainButton',
            '^logo',
            '.backround',
            '^bonusPopup',
            '.baseGame',
            '.bonusGame'
        ];

        //layers config example
        this.layers = {
            'mainElements': ['^logo', '^mainButton', '.baseGame'],
            'background': ['.backround'],
            'granny': ['^granny'],
            'bonusGame': ['.bonusGame', '^bonusPopup']
        };
    }
}

module.exports = ComponentsLayersSwitcher;
