import * as PIXI from 'pixi.js';
window.PIXI = PIXI;


import { gsap } from 'gsap';
window.gsap = gsap;

import { Howler, Howl } from 'howler';

window.UrsoUtils = {
    Howler,
    Howl,
    gsap,
    PIXI
};

const SoundAsset = {
  extension: {
    type: PIXI.ExtensionType.LoadParser,
    name: 'sound-asset-loader',
    priority: 100
  },

  test(url) {
    return url.endsWith('.mp3') || url.endsWith('.ogg') || url.endsWith('.wav');
  },


  async load(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        resolve(arrayBuffer);
      } catch (error) {
        reject(error);
      }
    });
  }
};

PIXI.extensions.add(SoundAsset);

export default {}
