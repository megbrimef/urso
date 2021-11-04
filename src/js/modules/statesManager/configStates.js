class ModulesStatesManagerConfigStates {
    constructor() {
        this.singleton = true;

        this.contents = {
            IDLE: { action: 'startSpin' },

            SPIN_START: {
                all: [
                    { action: 'serverSpinRequest' },
                    { action: 'slotMachineSpinStart' }
                ]
            },

            SPIN_FINISHING: { action: 'spin' },

            WINLINES_ANIMATE_ALL: { action: 'showWinlinesAnimationAll' },

            PICK_GAME1: {
                sequence: [
                    { action: 'someAction' },
                    { action: 'showPickGame' },        //showPickGame --> setGuardAction, setGuardState(PICK_GAME1)
                    { action: 'showBIGWin' }
                ],
                nextState: ["PICK_GAME2", "PICK_GAME1", "IDLE"]
            },

            PICK_GAME2: {
                sequence: [
                    { action: 'showWheel' },          //showWheel --> setGuardAction, setGuardState(PICK_GAME2)
                    { action: 'showBIGWin' }
                ],
                nextState: ["PICK_GAME1", "IDLE"]
            },

            WINLINES_ANIMATE_BY_ONE: { action: 'showWinlinesAnimation' },

            GAMBLE: {
                race: [
                    { action: 'playerLooseinGamble' },
                    { action: 'playerCollectMoney' }
                ]
            },

            UPDATE_BALANCE: {
                race: [
                    {
                        all: [
                            {
                                sequence: [
                                    { action: 'showWinPopup' },
                                    { action: 'closeWinPopup' }
                                ]
                            },
                            { action: 'counterUpdate' }
                        ]
                    },
                    { action: 'playerPressSpace' },
                    { action: 'playerPressSPIN' }
                ]
            }
        };

        // this.actionsParams = {
        //     showWinPopup: {
        //         name: 'showWinPopup',
        //         events: {
        //             onStart: 'action.showWinPopup.start',
        //             toComplete: 'winPopup.display.finished'
        //         },
        //         isTerminable: true,
        //         terminateEvents: {
        //             onStart: 'action.showWinPopup.terminate',
        //             toComplete: 'winPopup.display.terminated'
        //         }
        //     }
        // };
    }

    get() {
        return this.contents;
    };

}

module.exports = ModulesStatesManagerConfigStates;
