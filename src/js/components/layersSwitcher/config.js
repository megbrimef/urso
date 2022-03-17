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

        //groups layers config example
        this.groupsLayers = {
            'mainElements': ['^logo', '^mainButton', '.baseGame'],
            'background': ['.backround'],
            'granny': ['^granny'],
            'bonusGame': ['.bonusGame', '^bonusPopup']
        };
    }
}

module.exports = ComponentsLayersSwitcher;
