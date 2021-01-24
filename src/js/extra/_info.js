import * as PIXI from 'pixi.js';
window.PIXI = PIXI;
window.PIXI.particles = require('pixi-particles');

require("pixi-spine");

window.DragonBones = require("pixi5-dragonbones");

import { gsap } from 'gsap';
window.gsap = gsap;

import Howler from 'howler';
window.Howler = Howler;

Urso.Core.Extra = {
    BrowserEvents: require('./browserEvents.js')
};
