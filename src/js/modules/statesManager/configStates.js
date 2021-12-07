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
                    { action: 'showPickGame' },        //showPickGame --> addActionGuard(showPickGame, funk)
                    { action: 'showBIGWin' }
                ],
                nextState: ["PICK_GAME2", "PICK_GAME1", "IDLE"]  //nextState is optional //setGuardState(PICK_GAME2, func)
            },

            PICK_GAME2: {
                sequence: [
                    { action: 'showWheel' },          //showWheel --> addActionGuard(showWheel, funk)
                    { action: 'showBIGWin' }
                ],
                nextState: ["PICK_GAME1", "IDLE"]        //nextState is optional
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
    }

    get() {
        return this.contents;
    };

}

module.exports = ModulesStatesManagerConfigStates;
