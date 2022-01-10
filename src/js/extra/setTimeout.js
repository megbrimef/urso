Urso.setTimeout = (callback, delay) => {
    return gsap.delayedCall(delay / 1000, callback);
}

Urso.clearTimeout = (tween) => {
    tween.kill();
}
