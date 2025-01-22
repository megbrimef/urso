import * as PIXI from 'pixi.js';
window.PIXI = PIXI;
window.PIXI.particles = require('pixi-particles');

window.PIXI.particlesFx = require('@urso/revolt-fx');

window.PIXI.spine = require("pixi-spine");

import { AtlasAttachmentLoader, SkeletonJson } from "@pixi-spine/runtime-3.8";
window.PIXI.spine.AtlasAttachmentLoader = AtlasAttachmentLoader;
window.PIXI.spine.SkeletonJson = SkeletonJson;

require("pixi-projection");

import { gsap } from 'gsap';
window.gsap = gsap;

import Howler from 'howler';
window.Howler = Howler;
