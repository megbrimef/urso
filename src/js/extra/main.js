import * as PIXI from 'pixi.js';
window.PIXI = PIXI;

// import * as spine from '@esotericsoftware/spine-pixi-v8';
// window.PIXI.spine = spine;

// import * as particlesFx from 'revolt-fx';
// window.PIXI.particlesFx = particlesFx;

import { gsap } from 'gsap';
window.gsap = gsap;

import { Howler, Howl } from 'howler';

window.UrsoUtils = {
    Howler: Howler,
    Howl: Howl,
    gsap: gsap,
    PIXI: PIXI
};


export default {}
