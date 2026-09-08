class ModulesTemplateTypes {
    constructor() {
        this.list = {
            assets: {
                ATLAS: 1,
                AUDIOSPRITE: 2,
                BITMAPFONT: 3,
                CONTAINER: 4,
                FONT: 5,
                IMAGE: 6,
                JSON: 7,
                JSONATLAS: 8,
                SOUND: 9,
                SPINE: 10,
                SPINEATLAS: 11,
                HTML: 100
            },

            objects: {
                // REMOVED: ATLASIMAGE — never implemented, redundant now that atlas frames are cached by name
                // 1 is reserved (DO NOT REUSE - part of public API and reverse-mapped at runtime)
                BITMAPTEXT: 2,
                BUTTON: 3,
                BUTTONCOMPOSITE: 4,
                CHECKBOX: 5,
                COLLECTION: 6,
                COMPONENT: 7,
                CONTAINER: 8,
                // REMOVED: DRAGCONTAINER — never implemented
                // 9 is reserved (DO NOT REUSE - part of public API and reverse-mapped at runtime)
                // REMOVED: EMITTER — never implemented
                // 10 is reserved (DO NOT REUSE - part of public API and reverse-mapped at runtime)
                EMITTERFX: 11,
                GRAPHICS: 12,
                GROUP: 13,
                HITAREA: 14,
                IMAGE: 15,
                IMAGESANIMATION: 16,
                MASK: 17,
                NINESLICEPLANE: 18,
                // REMOVED: SCROLLBOX — never implemented
                // 19 is reserved (DO NOT REUSE - part of public API and reverse-mapped at runtime)
                SLIDER: 20,
                SPINE: 21,
                TEXT: 22,
                // REMOVED: TEXTINPUT — never implemented
                // 23 is reserved (DO NOT REUSE - part of public API and reverse-mapped at runtime)
                TOGGLE: 24,
                WORLD: 25
            }
        }
    }
};

export default ModulesTemplateTypes;