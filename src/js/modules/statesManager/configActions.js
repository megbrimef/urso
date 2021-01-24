class ModulesStatesManagerConfigActions {
    constructor() {
        this.singleton = true;

        this.contents = {
            startSpin: {
                name: 'startSpin',
                /*events: {
                    onStart: 'action.showWinPopup.start',
                    toComplete: 'winPopup.display.finished'
                },*/
                isTerminable: true,
                /*terminateEvents: {
                    onStart: 'action.showWinPopup.terminate',
                    toComplete: 'winPopup.display.terminated'
                }*/
            },
            showWinPopup: {
                name: 'showWinPopup',
                /*events: {
                    onStart: 'action.showWinPopup.start',
                    toComplete: 'winPopup.display.finished'
                },
                isTerminable: true,
                terminateEvents: {
                    onStart: 'action.showWinPopup.terminate',
                    toComplete: 'winPopup.display.terminated'
                }*/
            },
            showWinlinesAnimationAll: {//full view ---> action model
                events: {
                    onStart: 'components.winlines.animateAll.start',
                    toComplete: 'components.winlines.animateAll.finished'
                },
                isTerminable: true,
                terminateEvents: {
                    onStart: 'components.winlines.animateAll.terminate',
                    toComplete: 'components.winlines.animateAll.terminated'
                }
            },
            showWinlinesAnimationAll: { //simple view --->  action model
                eventBlank: 'components.winlines.animateAll',
                isTerminable: false
            }
        };
    }

    get() {
        return this.contents;
    };

}

module.exports = ModulesStatesManagerConfigActions;
