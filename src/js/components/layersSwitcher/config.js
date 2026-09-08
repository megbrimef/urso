class ComponentsLayersSwitcher {

    constructor() {

        // CHANGED: Game-specific layer selectors replaced with empty array — removed game coupling
        // Example from reference slot game (note: .backround typo fixed to .background):
        /*
        this.allLayers = [
            '^granny',
            '^mainButton',
            '^logo',
            '.background',
            '^bonusPopup',
            '.baseGame',
            '.bonusGame'
        ];
        */
        this.allLayers = [];

        // CHANGED: Game-specific layer groups replaced with empty object — removed game coupling
        // Example from reference slot game (note: .backround typo fixed to .background):
        /*
        this.groupsLayers = {
            'mainElements': ['^logo', '^mainButton', '.baseGame'],
            'background': ['.background'],
            'granny': ['^granny'],
            'bonusGame': ['.bonusGame', '^bonusPopup']
        };
        */
        this.groupsLayers = {};
    }
}

export default ComponentsLayersSwitcher;
