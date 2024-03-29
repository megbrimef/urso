/**
 * ModulesObjectsModelsText  fillCustomColors patch
 */


/**
 * Render the text with letter-spacing.
 *
 * @param text - The text to draw
 * @param x - Horizontal position to draw the text
 * @param y - Vertical position to draw the text
 * @param isStroke - Is this drawing for the outside stroke of the
 *  text? If not, it's for the inside fill
 */

PIXI.Text.prototype.drawLetterSpacing = function (text, x, y, isStroke) {
    if (isStroke === void 0) { isStroke = false; }
    var style = this._style;
    // letterSpacing of 0 means normal
    var letterSpacing = style.letterSpacing;
    // Checking that we can use moddern canvas2D api
    // https://developer.chrome.com/origintrials/#/view_trial/3585991203293757441
    // note: this is unstable API, Chrome less 94 use a `textLetterSpacing`, newest use a letterSpacing
    // eslint-disable-next-line max-len
    var supportLetterSpacing = PIXI.Text.experimentalLetterSpacing
        && ('letterSpacing' in CanvasRenderingContext2D.prototype
            || 'textLetterSpacing' in CanvasRenderingContext2D.prototype);

    if ((letterSpacing === 0 || supportLetterSpacing) && (!this.fillCustomColors || this.fillCustomColors.length === 0)) { //colors patch in if state
        if (supportLetterSpacing) {
            this.context.letterSpacing = letterSpacing;
            this.context.textLetterSpacing = letterSpacing;
        }
        if (isStroke) {
            this.context.strokeText(text, x, y);
        }
        else {
            this.context.fillText(text, x, y);
        }
        return;
    }

    var currentPosition = x;

    var textIndexOffset = this.text.indexOf(text); //colors patch block
    var allTextLength = this.text.length;
    var customColors = new Array(allTextLength);

    if (this.fillCustomColors) {
        for (var k in this.fillCustomColors) {
            var colorsParams = this.fillCustomColors[k];
            //customColors[colorsParams.position] = colorsParams.color;
            customColors.fill(colorsParams.color, colorsParams.position, allTextLength);
        }
    }

    // Using Array.from correctly splits characters whilst keeping emoji together.
    // This is not supported on IE as it requires ES6, so regular text splitting occurs.
    // This also doesn't account for emoji that are multiple emoji put together to make something else.
    // Handling all of this would require a big library itself.
    // https://medium.com/@giltayar/iterating-over-emoji-characters-the-es6-way-f06e4589516
    // https://github.com/orling/grapheme-splitter
    var stringArray = Array.from ? Array.from(text) : text.split('');
    var previousWidth = this.context.measureText(text).width;
    var currentWidth = 0;

    for (var i = 0; i < stringArray.length; ++i) {
        var currentChar = stringArray[i];

        if (isStroke) {
            this.context.strokeText(currentChar, currentPosition, y);
        }
        else {
            if (customColors[textIndexOffset + i]) { //colors patch block
                this.context.fillStyle = customColors[textIndexOffset + i];
            }

            this.context.fillText(currentChar, currentPosition, y);
        }

        currentWidth = this.context.measureText(text.substring(i + 1)).width;
        currentPosition += previousWidth - currentWidth + letterSpacing;
        previousWidth = currentWidth;
    }
};

/**
 * Ignoring parent mask on render by ignoreParentMask flag.
 * @param { Object } renderer 
 */
PIXI.Container.prototype.renderAdvanced = function (renderer) {
    var filters = this.filters;
    var mask = this._mask;
    let excludedFromMaskChildsIndexes = [];
    // push filter first as we need to ensure the stencil buffer is correct for any masking
    if (filters) {

        if (!this._enabledFilters) {
            this._enabledFilters = [];
        }

        this._enabledFilters.length = 0;

        for (var i = 0; i < filters.length; i++) {
            if (filters[i].enabled) {
                this._enabledFilters.push(filters[i]);
            }
        }
    }

    var flush = (filters && this._enabledFilters && this._enabledFilters.length)
        || (mask && (!mask.isMaskData || (mask.enabled && (mask.autoDetect || mask.type !== constants.MASK_TYPES.NONE))));

    if (flush) {
        renderer.batch.flush();
    }

    if (filters && this._enabledFilters && this._enabledFilters.length) {
        renderer.filter.push(this, this._enabledFilters);
    }

    if (mask) {
        renderer.mask.push(this, this._mask);
    }

    if (this.cullable) {
        this._renderWithCulling(renderer);
    } else {
        this._render(renderer);

        for (var i = 0, j = this.children.length; i < j; ++i) {
            if (!this.children[i].ignoreParentMask || !mask) {
                this.children[i].render(renderer);
            } else if (mask) {
                excludedFromMaskChildsIndexes.push(i);
            }
        }
    }

    if (flush) {
        renderer.batch.flush();
    }

    if (mask) {
        renderer.mask.pop(this);
    }

    if (excludedFromMaskChildsIndexes.length > 0) {
        excludedFromMaskChildsIndexes.forEach(index => this.children[index].render(renderer));
        renderer.batch.flush();
    }

    if (filters && this._enabledFilters && this._enabledFilters.length) {
        renderer.filter.pop();
    }
}

//MeshMaterial for spine with initial(setup) sequence fix
Object.defineProperty(PIXI.MeshMaterial.prototype, "texture", {
    get: function () {
        return this.uniforms.uSampler
    },
    set: function (value) {
        if (this.uniforms.uSampler !== value) {
            this.uniforms.uSampler = value;
            this.uvMatrix.texture = value;
        }
    },
    enumerable: !1,
    configurable: !0
});
