import ModulesObjectsBaseModel from './../baseModel';

class ModulesObjectsModelsText extends ModulesObjectsBaseModel {
  constructor(params) {
    super(params);

    this.type = Urso.types.objects.TEXT;
    this._addBaseObject();
  }

  setupParams(params) {
    super.setupParams(params);

    this.text = Urso.helper.recursiveGet('text', params, false);
    this.localeId = Urso.helper.recursiveGet('localeId', params, false); //you can use this instead text for localization

    this.localeVariables = Urso.helper.recursiveGet('localeVariables', params, {}); //optional variables for localization by localeId

    this.lineHeight = Urso.helper.recursiveGet('lineHeight', params, 0);
    this.fontFamily = Urso.helper.recursiveGet('fontFamily', params, 'Arial');
    this.fontSize = Urso.helper.recursiveGet('fontSize', params, false);
    //FIXME 'normal'
    this.fontStyle = Urso.helper.recursiveGet('fontStyle', params, 'normal'); //'italic'
    this.fontWeight = Urso.helper.recursiveGet('fontWeight', params, 'normal'); // 'bold'

    this.fill = Urso.helper.recursiveGet('fill', params, '#000000'); // gradient  ['#ffffff', '#00ff99']
    this.fillCustomColors = Urso.helper.recursiveGet('fillCustomColors', params, false); //or array [{position:12,color:'#000000'},...]
    this.stroke = Urso.helper.recursiveGet('stroke', params, 'black');
    this.strokeThickness = Urso.helper.recursiveGet('strokeThickness', params, 0);
    this.dropShadow = Urso.helper.recursiveGet('dropShadow', params, false);
    this.dropShadowColor = Urso.helper.recursiveGet('dropShadowColor', params, '#000000');
    this.dropShadowBlur = Urso.helper.recursiveGet('dropShadowBlur', params, 0);
    this.dropShadowAngle = Urso.helper.recursiveGet('dropShadowAngle', params, 0); //Math.PI / 6
    this.dropShadowDistance = Urso.helper.recursiveGet('dropShadowBlur', params, 0); // 6
    this.wordWrap = Urso.helper.recursiveGet('wordWrap', params, false);
    this.wordWrapWidth = Urso.helper.recursiveGet('wordWrapWidth', params, 100);
    this.leading = Urso.helper.recursiveGet('leading', params, 0);
    this.letterSpacing = Urso.helper.recursiveGet('letterSpacing', params, 0);
    this.textAlign = Urso.helper.recursiveGet('textAlign', params, 'left');
    this.fillGradientType = Urso.helper.recursiveGet('fillGradientType', params, 'vertical'); // 'horizontal' or 'vertical'
    this.fillGradientStops = Urso.helper.recursiveGet('fillGradientStops', params, false); // [0, 1] or [0, 0.5, 1]
  }

  modifyValue(key, val) {
    switch (key) {
      case 'fill':
        return this._makeFill(val);
      default:
        return val;
    }
  }

  _calculatefillGradientStops() {
    return this.fill.map((_, i, val) => {
      if( i === 0) return 0;
      if( i === val.length - 1) return 1;
      return i / (val.length - 1);
    });
  }

  _makeFill(val) {
  
    if (!Array.isArray(val)) return val; //if not array, return value

    const fillGradientStops = (this.fillGradientStops && this.fillGradientStops.length) || this._calculatefillGradientStops();

    const colorStops = fillGradientStops.map((stop, index) => {
      return {
        offset: stop, // Normalized offset between 0 and 1
        color: val[index] || val[val.length - 1], // Use the color at this index or the last one if not enough colors
      };
    });

    const gradientParams = {
      type: 'linear',
      start: { x: 0, y: 0 }, // Start at top
      end: this.fillGradientType === 'horizontal' ? { x: 0, y: 1 } : { x: 1, y: 0 }, // End at bottom
      colorStops,
      textureSpace: 'local',
    };
    

    return new PIXI.FillGradient(gradientParams);
  }

  _addBaseObject() {
    if (this.localeId)
      this._originalModel.text = this.text = Urso.i18n.get(
        this.localeId,
        this.localeVariables
      );

    // PERF: Proxy property assignments emit TextStyle update events triggering re-renders (~18 times) — build complete style object upfront for single constructor pass
    const styles = {
      fontFamily: this.fontFamily,
      fontStyle: this.fontStyle,
      fontWeight: this.fontWeight,
      fill: this.modifyValue('fill', this.fill),
      align: this.textAlign,
      leading: this.leading,
      letterSpacing: this.letterSpacing,
      lineHeight: this.lineHeight,
      wordWrap: this.wordWrap,
      wordWrapWidth: this.wordWrapWidth,
      dropShadow: false,
    };

    // Only include fontSize if explicitly set (defaults to false, avoid passing undefined to Pixi)
    if (this.fontSize) {
      styles.fontSize = this.fontSize;
    }

    // Pixi v8 stroke is object { color, width } when thickness > 0
    if (this.strokeThickness > 0) {
      styles.stroke = {
        color: this.stroke,
        width: this.strokeThickness,
      };
    }

    // Pixi v8 dropShadow is object { color, blur, angle, distance } when enabled
    if (this.dropShadow) {
      styles.dropShadow = {
        color: this.dropShadowColor,
        blur: this.dropShadowBlur,
        angle: this.dropShadowAngle,
        distance: this.dropShadowDistance,
      };
    }

    this._baseObject = new PIXI.Text({ text: this.text, style: styles });

    if (this.fillCustomColors) {
      this._baseObject.fillCustomColors = this.fillCustomColors;
    }
  }

  _newLocaleHandler() {
    if (!this.proxyObject) return;

    this.proxyObject.text = Urso.i18n.get(this.localeId, this.localeVariables);
  }

  _customDestroy() {
    if (this.localeId)
      this.removeListener(
        Urso.events.MODULES_I18N_NEW_LOCALE_WAS_SET,
        this._newLocaleHandler.bind(this)
      );
  }

  _subscribeOnce() {
    if (this.localeId)
      this.addListener(
        Urso.events.MODULES_I18N_NEW_LOCALE_WAS_SET,
        this._newLocaleHandler.bind(this)
      );
  }
}

export default ModulesObjectsModelsText;
