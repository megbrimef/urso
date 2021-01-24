class ModulesLogicConfigButtons {
    constructor(){
        this.singleton = true;
        this.buttonStates = this.setButtonStates();
        this.eventsCfgBlank = this.setEventsCfgBlanks();
        this.eventsCfg = this.setEventsCfg();
    }

    setButtonStates(){
        return {
            spin: {
                default: { //base
                    'title': '',
                    'callback': function () {
                        this.emit('slotMachine.spinCommand');
                    },
                    'enabled': true,
                    'visible': true
                },
                //default extend 
                inactive: {
                    'enabled': false
                },
                stop: {
                    'callback': function () {
                        this.emit('slotMachine.stopCommand');
                    }
                },
                stopInactive: {
                    'base': 'stop',
                    'enabled': false
                }
            }
        };
    };

    setEventsCfgBlanks(){
        return {
            globalUiGroup: [
                {id: 1, event: 'Transport.close', state: false, priority: 100, removeEvents: [10, 11, 12, 13]},
                {id: 2, event: 'freespinsStart', state: 'inactive', priority: 10},
                {id: 3, event: 'freespinsStop', state: false, priority: 10, removeEvents: [1]}
            ]
        };
    };

    setEventsCfg(){
        return {
            spin: [
                {id: 1, event: 'Transport.close', state: false, priority: 100, removeEvents: [10, 11, 12, 13]},
                {id: 10, event: 'freespinsStart', state: 'inactive', priority: 40},
                {id: 11, event: 'freespinsStop', state: false, priority: 40, removeEvents: [10]},
                {id: 12, event: 'SpinStart', state: 'inactive', priority: 20},
                {id: 13, event: 'SpinResponce', state: 'stop', priority: 20},
                {id: 14, event: 'StopPress', state: 'stopInactive', priority: 20},
                {id: 15, event: 'SpinStop', state: false, priority: 20, removeEvents: [12]}
            ]
        };
    };

};

module.exports = ModulesLogicConfigButtons;
