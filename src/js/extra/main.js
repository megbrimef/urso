import * as PIXI from 'pixi.js';
import TextInput from 'pixi-text-input';
window.PIXI = PIXI;
window.PIXI.particles = require('pixi-particles');

window.PIXI.particlesFx = require('@urso/revolt-fx');

window.PIXI.spine = require("pixi-spine");
window.PIXI.TextInput = TextInput;

import { AtlasAttachmentLoader, SkeletonJson } from "@pixi-spine/runtime-3.8";
window.PIXI.spine.AtlasAttachmentLoader = AtlasAttachmentLoader;
window.PIXI.spine.SkeletonJson = SkeletonJson;

require("pixi-projection");

import { gsap } from 'gsap';
window.gsap = gsap;

import Howler from 'howler';
window.Howler = Howler;
