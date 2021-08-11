import * as PIXI from 'pixi.js';
window.PIXI = PIXI;
window.PIXI.particles = require('pixi-particles');

import { DropShadowFilter } from '@pixi/filter-drop-shadow';
PIXI.filters['DropShadowFilter'] = DropShadowFilter;


require("pixi-spine");
require("pixi-projection");

Urso.DragonBones = require("pixi5-dragonbones");

import { gsap } from 'gsap';
window.gsap = gsap;

import Howler from 'howler';
window.Howler = Howler;

Urso.Core.Extra = {
    BrowserEvents: require('./browserEvents.js')
};
