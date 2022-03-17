class ComponentsLayersSwitcherController extends Urso.Core.Components.Base.Controller {

    constructor(...args) {
        super(...args);
        this._config = this.getInstance('Config');
    }

    /**
     * disable all layers from the list of managed layers (config.allLayers) and enables layers corresponding to the desired group (config.groupsLayers[groupName])
     * @param {String} groupName 
     */
    _showGroup(groupName) {
        const configLayersGroup = this._config.groupsLayers[groupName];

        if (configLayersGroup) {
            this._config.allLayers.forEach(selectorLayers => {
                const layerVisibleStatus = (configLayersGroup.includes(selectorLayers)) ? true : false;

                Urso.findAll(selectorLayers).forEach((selectorObject) => {
                    selectorObject.visible = layerVisibleStatus;
                });
            });

        } else {
            Urso.logger.error(`ComponentsLayersSwitcherController: group '${groupName}' was not found!`);
        }
    }

    _subscribeOnce() {
        this.addListener(Urso.events.COMPONENTS_LAYERS_SWITCHER_SWITCH, (groupName) => { this._showGroup(groupName) });
    }
}

module.exports = ComponentsLayersSwitcherController;
