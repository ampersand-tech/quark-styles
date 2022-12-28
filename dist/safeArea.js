"use strict";
/**
* Copyright 2018-present Ampersand Technologies, Inc.
*
* @allowConsoleFuncs
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSafeAreaDependent = exports.initSafeArea = exports.safeAreaSize = void 0;
function computeSafeAreaSize() {
    /*
     * Apple defines a "safe area" of the screen for the iPhone X.  The area outside the safe area may be partially
     * occluded by "the notch" or the home indicator.
     *
     * Apple provides CSS rules for sensing the safe area, but there is no way to sense them from JS.
     * We need to hack.
     */
    var top = 0;
    var bottom = 0;
    var left = 0;
    var right = 0;
    try {
        if (!window) {
            console.log('safe area: no window found');
            return { top: top, left: left, right: right, bottom: bottom };
        }
        // Check for our script injection of safe area sizes that do not need to be measured
        if (window.safeAreaSize) {
            console.log('safe area: already found injected values: ', window.safeAreaSize);
            return window.safeAreaSize;
        }
    }
    catch (_ex) {
        console.log('safe area: no window found');
        return { top: top, left: left, right: right, bottom: bottom };
    }
    // If dev mode and iPhoneX dimensions, fake the safe-area-inset stuff
    if (process && process.env && process.env.NODE_ENV === 'development' && window.innerHeight === 812 && window.innerWidth === 375) {
        // iPhoneX values
        console.log('safe area: faking iphoneX for dev mode:');
        return { top: 44, left: left, right: right, bottom: 34 };
    }
    var cssPrefix;
    if (window['CSS']) {
        if (window['CSS'].supports('padding-left: env(safe-area-inset-left)')) {
            cssPrefix = 'env';
        }
        else if (window['CSS'].supports('padding-left: constant(safe-area-inset-left)')) {
            cssPrefix = 'constant';
        }
        else {
            console.log('no safe area env/constant variable support');
            return { top: top, left: left, right: right, bottom: bottom };
        }
    }
    else {
        console.log('no safe area window css supporting info');
        return { top: top, left: left, right: right, bottom: bottom };
    }
    var tempDiv = document.createElement('div');
    tempDiv.id = 'safeAreaArea';
    tempDiv.style.paddingLeft = cssPrefix + '(safe-area-inset-left)';
    tempDiv.style.paddingRight = cssPrefix + '(safe-area-inset-right)';
    tempDiv.style.paddingTop = cssPrefix + '(safe-area-inset-top)';
    tempDiv.style.paddingBottom = cssPrefix + '(safe-area-inset-bottom)';
    document.body.appendChild(tempDiv);
    var style = window.getComputedStyle(tempDiv);
    left = parseInt(style.paddingLeft);
    right = parseInt(style.paddingRight);
    top = parseInt(style.paddingTop);
    bottom = parseInt(style.paddingBottom);
    document.body.removeChild(tempDiv);
    console.log('safe areas:', { top: top, left: left, right: right, bottom: bottom });
    return { top: top, left: left, right: right, bottom: bottom };
}
exports.safeAreaSize = { top: 0, left: 0, right: 0, bottom: 0 };
try {
    if (window.safeAreaSize) {
        console.log('Got injected safe area size: ' + window.safeAreaSize);
        exports.safeAreaSize = window.safeAreaSize;
    }
}
catch (_ex) {
}
var safeAreaCalculated = false;
var safeAreaCbs = [];
function initSafeArea() {
    exports.safeAreaSize = computeSafeAreaSize();
    safeAreaCalculated = true;
    for (var _i = 0, safeAreaCbs_1 = safeAreaCbs; _i < safeAreaCbs_1.length; _i++) {
        var cb = safeAreaCbs_1[_i];
        cb();
    }
    safeAreaCbs = [];
}
exports.initSafeArea = initSafeArea;
function registerSafeAreaDependent(cb) {
    if (safeAreaCalculated) {
        cb();
    }
    else {
        safeAreaCbs.push(cb);
    }
}
exports.registerSafeAreaDependent = registerSafeAreaDependent;
