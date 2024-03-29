"use strict";
/**
 * Copyright 2015-present Ampersand Technologies, Inc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setColorConstants = exports.scale = exports.translateY = exports.translateX = void 0;
var DOMClassManager = require("./domClassManager");
var safeArea_1 = require("./safeArea");
var color = require("color");
var quarkStyles = DOMClassManager.startModule(module);
var QAC = quarkStyles.addClass;
var gColorConstants = {};
var gHasColorConstants = false;
function defaultSuffix(size, suffix) {
    if (size === Number(size).toString()) {
        size += suffix;
    }
    return size;
}
// These strings can be used in place of actual numbers for lengths that are dynamically calculated,
// such as the iPhoneX safe areas
var LENGTH_MAP = {};
function calcSafeAreaLengthMAP() {
    LENGTH_MAP = {
        SAFE_AREA_TOP: (safeArea_1.safeAreaSize.top || 0) + 'px',
        SAFE_AREA_BOTTOM: (safeArea_1.safeAreaSize.bottom || 0) + 'px',
        SAFE_AREA_LEFT: (safeArea_1.safeAreaSize.left || 0) + 'px',
        SAFE_AREA_RIGHT: (safeArea_1.safeAreaSize.right || 0) + 'px',
    };
}
calcSafeAreaLengthMAP();
(0, safeArea_1.registerSafeAreaDependent)(calcSafeAreaLengthMAP);
function evalPixels(size) {
    if (size in LENGTH_MAP) {
        return LENGTH_MAP[size];
    }
    else {
        return defaultSuffix(size, 'px');
    }
}
/**
 * @enum
 */
var POS_LOOKUP = {
    l: 'Left',
    r: 'Right',
    t: 'Top',
    b: 'Bottom',
};
function applyDirectionalStyles(style, stylePrefix, styleSuffix, key, size) {
    var sides;
    if (!key) {
        sides = 'lrbt';
    }
    else if (key === 'x') {
        sides = 'lr';
    }
    else if (key === 'y') {
        sides = 'bt';
    }
    else {
        sides = key;
    }
    for (var i = 0; i < sides.length; ++i) {
        var styleName = stylePrefix + POS_LOOKUP[sides[i]] + styleSuffix;
        style[styleName] = size;
    }
}
/**
 * @enum
 * @property t - TopLeft & TopRight
 * @property b - BottomLeft & BottomRight
 * @property r - TopRight & BottomRight
 * @property l - TopLeft & BottomLeft
 */
var CORNER_LOOKUP = {
    tl: 'TopLeft',
    tr: 'TopRight',
    bl: 'BottomLeft',
    br: 'BottomRight',
};
function applyCornerDirectionalStyles(style, stylePrefix, styleSuffix, key1, key2, size) {
    var sides = [];
    if (!key1) {
        sides = ['tl', 'tr', 'bl', 'br'];
    }
    else if (key2) {
        sides = [key1 + key2];
    }
    else if (key1 === 't') {
        sides = ['tl', 'tr'];
    }
    else if (key1 === 'b') {
        sides = ['bl', 'br'];
    }
    else if (key1 === 'r') {
        sides = ['tr', 'br'];
    }
    else if (key1 === 'l') {
        sides = ['tl', 'bl'];
    }
    for (var i = 0; i < sides.length; ++i) {
        var styleName = stylePrefix + CORNER_LOOKUP[sides[i]] + styleSuffix;
        style[styleName] = size;
    }
}
/*
 
 ██╗      █████╗ ██╗   ██╗ ██████╗ ██╗   ██╗████████╗
 ██║     ██╔══██╗╚██╗ ██╔╝██╔═══██╗██║   ██║╚══██╔══╝
 ██║     ███████║ ╚████╔╝ ██║   ██║██║   ██║   ██║
 ██║     ██╔══██║  ╚██╔╝  ██║   ██║██║   ██║   ██║
 ███████╗██║  ██║   ██║   ╚██████╔╝╚██████╔╝   ██║
 ╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝  ╚═════╝    ╚═╝
                                                     
 
*/
/**
 * @qs Margins
 * @param {POS_LOOKUP} [direction] Set direction, leave blank for all directions
 * @param {number} value value in px, or sepcify %, or em
 * @example m-, m-l-, m-r-, m-t-, m-b-, m-x-, m-y-
 * @implement m-[direction]-[value]
 */
QAC(/^m(?:-([lrtbxy]))?-(.+)$/, function (match, style) {
    var size;
    if (match[2] === 'a') {
        size = 'auto';
    }
    else {
        size = evalPixels(match[2]);
    }
    applyDirectionalStyles(style, 'margin', '', match[1], size);
});
/**
 * @qs Padding
 * @param {POS_LOOKUP} [direction]
 * @param {number} value
 * @example p, p-l, p-r, p-t, p-b, p-x, p-y
 * @implement p-[direction]-[value]
 */
QAC(/^p(?:-([lrtbxy]))?-(.+)$/, function (match, style) {
    var size = evalPixels(match[2]);
    applyDirectionalStyles(style, 'padding', '', match[1], size);
});
/**
 * @qs Width
 * @param {MIN_MAX} [restriction]
 * @param {number} size
 * @example w- w-n w-x
 * @implement w-[restriction]-[size]
 */
/**
 * @qs Height
 * @param {MIN_MAX} [restriction]
 * @param {number} size
 * @example h- h-n h-x
 * @implement h-[restriction]-[size]
 */
QAC(/^([wh])(-[nx])?-([\w\.%]+)$/, function (match, style) {
    var styleKey = '';
    if (match[2] === '-n') {
        styleKey = 'min';
    }
    else if (match[2] === '-x') {
        styleKey = 'max';
    }
    if (match[1] === 'w') { // width
        styleKey += 'Width';
    }
    else { // height
        styleKey += 'Height';
    }
    // Lowercase first letter
    styleKey = styleKey.charAt(0).toLowerCase() + styleKey.slice(1);
    style[styleKey] = evalPixels(match[3]);
});
/**
 * @enum
 */
var TEXTALIGN_LOOKUP = {
    l: 'left',
    r: 'right',
    c: 'center',
    j: 'justify',
};
/**
 * @enum
 */
var VERTICALALIGN_LOOKUP = {
    b: 'baseline',
    s: 'sub',
    p: 'super',
    m: 'middle',
    t: 'top',
};
/**
 * @qs Vertical-Align
 * @param {VERTICALALIGN_LOOKUP} value
 * @example va-b, va-s, va-p, va-m, va-t
 * @implement va-[value]
 */
QAC(/^va-([bspmt])$/, function (match, style) {
    style.verticalAlign = VERTICALALIGN_LOOKUP[match[1]];
});
/**
 * @enum
 */
var OVERFLOW_LOOKUP = {
    v: 'visible',
    h: 'hidden',
    s: 'scroll',
    a: 'auto',
};
/**
 * @qs Overflow
 * @param {string} [direction] x or y
 * @param {OVERFLOW_LOOKUP} type
 * @param {string} [nt] add -nt to set no touch in overflow scroll
 * @example o-v, o-h, o-s, o-a, o-x-v, o-x-h, o-x-s, o-x-a, o-y-v, o-y-h, o-y-s, o-y-a, o-s-nt
 * @implement o-[direction]-[type]-[nt]
 */
// o-s-nt : no touch in overflow scroll
QAC(/^o(-[xy])?-([vhsa])(-nt)?$/, function (match, style) {
    var styleKey = 'overflow';
    if (match[1] === '-x') {
        styleKey += 'X';
    }
    else if (match[1] === '-y') {
        styleKey += 'Y';
    }
    style[styleKey] = OVERFLOW_LOOKUP[match[2]];
    if ((match[2] === 's' || match[2] === 'a') && match[3] !== '-nt') {
        style.WebkitOverflowScrolling = 'touch';
    }
});
/**
 * @enum
 */
var POSTION_LOOKUP = {
    a: 'absolute',
    r: 'relative',
    s: 'static',
    f: 'fixed',
};
/**
 * @qs position
 * @param {POSITION_LOOKUP} position
 * @example pos-a pos-r pos-s pos-f
 * @implement pos-[position]
 */
QAC(/^pos-([arsf])$/, function (match, style) {
    var styleKey = 'position';
    style[styleKey] = POSTION_LOOKUP[match[1]];
});
/**
 * @enum
 */
var DISPLAY_LOOKUP = {
    b: 'block',
    n: 'none',
    i: 'inline',
    ib: 'inline-block',
    f: 'flex',
    x: 'box',
};
/**
 * @qs Display
 * @param {DISPLAY_LOOKUP} display
 * @example d-b, d-n, d-i, d-ib, d-f
 * @implement d-[display]
 */
QAC(/^d-([bnif]b?)$/, function (match, style) {
    var styleKey = 'display';
    style[styleKey] = DISPLAY_LOOKUP[match[1]];
});
/**
 * @qs Z-Index
 * @desc  DO NOT USE THIS! If you think you need to, you're wrong.
 * @param {number} value
 * @example z-
 * @implement z-[value]
 */
// z
QAC(/^z-(.+)$/, function (match, style) {
    style.zIndex = match[1];
});
/**
 * @qs Bottom
 * @param {number} value in pixels, or specifiy units.
 * @example bottom-0
 * @implement bottom-[value]
 */
QAC(/^bottom-(.+)$/, function (match, style) {
    var size = evalPixels(match[1]);
    style.bottom = size;
});
/**
 * @qs Left
 * @param {number} value in pixels, or specifiy units.
 * @example left-
 * @implement left-[value]
 */
QAC(/^left-(.+)$/, function (match, style) {
    var size = evalPixels(match[1]);
    style.left = size;
});
/**
 * @qs Right
 * @param {number} value in pixels, or specifiy units.
 * @example right-
 * @implement right-[value]
 */
QAC(/^right-(.+)$/, function (match, style) {
    var size = evalPixels(match[1]);
    style.right = size;
});
/**
 * @qs Top
 * @param {number} value in pixels, or specifiy units.
 * @example top-
 * @implement top-[value]
 */
QAC(/^top-(.+)$/, function (match, style) {
    var size = evalPixels(match[1]);
    style.top = size;
});
/**
 * @qs object-fit
 * @param {fill | contain | cover | none | scaleDown}
 * @example of-contain, of-scaleDown
 * @implement of-[value]
 */
// of- [fill, contain, cover, none, scaleDown]
QAC(/^of-(.+)$/, function (match, style) {
    style.objectFit = match[0];
});
/*
 
 ██████╗  ██████╗ ██████╗ ██████╗ ███████╗██████╗
 ██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗
 ██████╔╝██║   ██║██████╔╝██║  ██║█████╗  ██████╔╝
 ██╔══██╗██║   ██║██╔══██╗██║  ██║██╔══╝  ██╔══██╗
 ██████╔╝╚██████╔╝██║  ██║██████╔╝███████╗██║  ██║
 ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝
                                                  
 
*/
/**
 * @qs Border
 * @param {POS_LOOKUP} [direction]
 * @param {number} width
 * @example b, b-l, b-r, b-t, b-b, b-x, b-y
 * @implement b-[direction]-value
 */
QAC(/^b(?:-([lrtbxy]))?-(\w+)$/, function (match, style) {
    var size = evalPixels(match[2]);
    applyDirectionalStyles(style, 'border', 'Width', match[1], size);
    style.borderStyle = 'solid'; // Not sure about this
});
/**
 * @qs Border-Dash
 * @param {POS_LOOKUP} [direction]
 * @param {number} width
 * @example bd-, bd-l-, bd-r-, bd-t-, bd-b-, bd-x-, bd-y-
 * @implement bd-[direction]-value
 */
//
QAC(/^bd(?:-([lrtbxy]))?-(\w+)$/, function (match, style) {
    var size = evalPixels(match[2]);
    applyDirectionalStyles(style, 'border', 'Width', match[1], size);
    style.borderStyle = 'dashed'; // Not sure about this
});
/**
 * @qs Border-Radius
 * @param {CORNER_LOOKUP} [side]
 * @param {number} radius
 * @example br-, br-t-, br-b-, br-l-, br-r-, br-tl-, br-tr-, br-bl-, br-br-
 * @implement br-[side]-[radius]
 */
QAC(/^br(?:-([tlbr]))?(?:([rl]))?-([\w\.%]+)$/, function (match, style) {
    var size = evalPixels(match[3]);
    applyCornerDirectionalStyles(style, 'border', 'Radius', match[1], match[2], size);
});
/*
 
 ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗
 ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║
 ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║
 ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║
 ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝
 ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝
                                                    
 
*/
/**
 * @qs Box-Shadow h v blur blurRadius color style
 * @param {number} offsetY
 * @param {number} offsetX
 * @param {number} blur
 * @param {number} radius
 * @param {color} color
 * @example bxshdw-
 * @implement bxshdw-[offsetY]-[offsetX]-[blur]-[radius]-[color]
 */
// bxshdw
QAC(/^bxshdw-(-?[^-\n\r]+)-(-?[^-\n\r]+)-([^-\n\r]+)-(-?[^-\n\r]+)-([^-\n\r]+)-?([^-\n\r]+)?$/, function (match, style, errors) {
    var col = colorFromName(match[5], errors);
    var styleVal = evalPixels(match[1]) + ' ' +
        evalPixels(match[2]) + ' ' +
        evalPixels(match[3]) + ' ' +
        evalPixels(match[4]) + ' ' +
        (col ? col.rgb().string() : '#000');
    if (match[6]) {
        styleVal = match[6] + ' ' + styleVal;
    }
    style.WebkitBoxShadow = style.boxShadow = styleVal;
});
/**
 * @qs Text-Shadow
 * @param {number} offsetX
 * @param {number} offsetY
 * @param {number} blur
 * @param {color} color
 * @example txtshdw-
 * @implement txtshdw-[offsetX]-[offsetY]-[blur]-[color]
 */
// txtshdw
QAC(/^txtshdw-(-?[^-\n\r]+)-(-?[^-\n\r]+)-(-?[^-\n\r]+)-(.+)$/, function (match, style, errors) {
    var col = colorFromName(match[4], errors);
    var styleVal = evalPixels(match[1]) + ' ' + evalPixels(match[2]) + ' ' + evalPixels(match[3]) + ' ' +
        (col ? col.rgb().string() : '#000');
    style.textShadow = styleVal;
});
/**
 * @qs Drop-Shadow
 * @description Used for SVGs
 * @param {number} offsetX
 * @param {number} offsetY
 * @param {number} blur
 * @param {number} radius
 * @param {color} color
 * @example dropshdw-
 * @implement dropshdw-[offsetX]-[offsetY]-[blur]-[color]
 */
QAC(/^dropshdw-(-?[^-\n\r]+)-(-?[^-\n\r]+)-(-?[^-\n\r]+)-(.+)$/, function (match, style, errors) {
    var styleVal = evalPixels(match[1]) + ' ' +
        evalPixels(match[2]) + ' ' +
        evalPixels(match[3]) + ' ' +
        colorFromName(match[4], errors).rgb().string();
    style.WebkitFilter = 'drop-shadow(' + styleVal + ')';
});
/*
 
 ████████╗██████╗  █████╗ ███╗   ██╗███████╗███████╗ ██████╗ ██████╗ ███╗   ███╗
 ╚══██╔══╝██╔══██╗██╔══██╗████╗  ██║██╔════╝██╔════╝██╔═══██╗██╔══██╗████╗ ████║
    ██║   ██████╔╝███████║██╔██╗ ██║███████╗█████╗  ██║   ██║██████╔╝██╔████╔██║
    ██║   ██╔══██╗██╔══██║██║╚██╗██║╚════██║██╔══╝  ██║   ██║██╔══██╗██║╚██╔╝██║
    ██║   ██║  ██║██║  ██║██║ ╚████║███████║██║     ╚██████╔╝██║  ██║██║ ╚═╝ ██║
    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝
                                                                                
 
*/
/**
 * @qs Transform-Scale
 * @desc uniform scaling only
 * @param {number} x
 * @example ts-1.4
 * @implement ts-[x]
 */
// ts-#
QAC(/^ts-(.+)$/, function (match, style) {
    if (!style.WebkitTransform && !style.transform) {
        style.WebkitTransform = style.transform = '';
    }
    style.WebkitTransform = style.transform = (style.WebkitTransform || style.transform) + ' scale(' + match[1] + ',' + match[1] + ')';
    if (!style.WebkitTransformOrigin && !style.transformOrigin) {
        style.WebkitTransformOrigin = style.transformOrigin = 'top left';
    }
});
/**
 * @enum
 */
var ORIGIN_LOOKUP = {
    t: 'top',
    tl: 'top left',
    tr: 'top right',
    l: 'left',
    r: 'right',
    b: 'bottom',
    bl: 'bottom left',
    br: 'bottom right',
    c: 'center',
};
/**
 * @qs Transform-Origin
 * @param {ORIGIN_LOOKUP} origin
 * @example to-t, to-tl, to-tr, to-l, to-r, to-b, to-bl, to-br, to-c
 * @implement to-[origin]
 */
QAC(/^to-(.+)$/, function (match, style) {
    style.WebkitTransformOrigin = style.transformOrigin = ORIGIN_LOOKUP[match[1]];
});
/**
 * @qs Transform-Rotate
 * @param {number} degrees
 * @example tr-
 * @implement tr-[degrees]
 */
QAC(/^tr-(.+)$/, function (match, style) {
    if (!style.WebkitTransform && !style.transform) {
        style.WebkitTransform = style.transform = '';
    }
    style.WebkitTransform = style.transform = (style.WebkitTransform || style.transform) + ' rotate(' + match[1] + 'deg)';
});
function translateX(style, size) {
    if (!style.WebkitTransform && !style.transform) {
        style.WebkitTransform = style.transform = '';
    }
    style.WebkitTransform = style.transform = (style.WebkitTransform || style.transform) + ' translateX(' + size + ')';
}
exports.translateX = translateX;
/**
 * @qs Transform-translate-X
 * @param {number} size
 * @example tx-
 * @implement tx-[size]
 */
QAC(/^tx-(.+)$/, function (match, style) {
    var size = evalPixels(match[1]);
    translateX(style, size);
});
function translateY(style, size) {
    if (!style.WebkitTransform && !style.transform) {
        style.WebkitTransform = style.transform = '';
    }
    style.WebkitTransform = style.transform = (style.WebkitTransform || style.transform) + ' translateY(' + size + ')';
}
exports.translateY = translateY;
/**
 * @qs Transform-translate-Y
 * @param {number} size
 * @example ty-
 * @implement ty-[size]
 */
QAC(/^ty-(.+)$/, function (match, style) {
    var size = evalPixels(match[1]);
    translateY(style, size);
});
function skewX(style, size) {
    if (!style.WebkitTransform && !style.transform) {
        style.WebkitTransform = style.transform = '';
    }
    style.WebkitTransform = style.transform = (style.WebkitTransform || style.transform) + ' skewX(' + size + ')';
}
/**
 * @qs Transform-skew-X
 * @param {number} size
 * @example tkx-
 * @implement tkx-[size]
 */
QAC(/^tkx-(.+)$/, function (match, style) {
    var size = defaultSuffix(match[1], 'deg');
    skewX(style, size);
});
/**
 * Transform: scale(n)
 */
function scale(style, size) {
    if (!style.WebkitTransform && !style.transform) {
        style.WebkitTransform = style.transform = '';
    }
    style.WebkitTransform = style.transform = (style.WebkitTransform || style.transform) + ' scale(' + size + ')';
}
exports.scale = scale;
/**
 * @qs Font-Weight
 * @param {number} size
 * @example fw-
 * @implement fw-[size]
 */
QAC(/^fw-(.+)$/, function (match, style) {
    var size = match[1];
    style.fontWeight = size;
});
/*
 
 ████████╗███████╗██╗  ██╗████████╗
 ╚══██╔══╝██╔════╝╚██╗██╔╝╚══██╔══╝
    ██║   █████╗   ╚███╔╝    ██║
    ██║   ██╔══╝   ██╔██╗    ██║
    ██║   ███████╗██╔╝ ██╗   ██║
    ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝
                                   
 
*/
/**
 * @qs Font-Size
 * @param {number} size set in px. Add suffix to override (ie: fs-10pt)
 * @example fs-
 * @implement fs-[size]
 */
QAC(/^fs-(.+)$/, function (match, style) {
    var size = evalPixels(match[1]);
    style.fontSize = size;
});
/**
 * @enum
 */
var FONTSTYLE_LOOKUP = {
    n: 'normal',
    i: 'italic',
};
/**
 * @qs Font-Style
 * @param {FONTSTYLE_LOOKUP} style
 * @example fy-i, fy-n
 * @implement fy-[style]
 */
QAC(/^fy-([in])$/, function (match, style) {
    style.fontStyle = FONTSTYLE_LOOKUP[match[1]];
});
/**
 * @enum
 */
var TEXTDECORATION_LOOKUP = {
    n: 'none',
    u: 'underline',
    l: 'line-through',
};
/**
 * @qs Text-Decoration
 * @param {TEXTDECORATION_LOOKUP} decoration
 * @example td-n, td-u, td-l
 * @implement td-[decoration]
 */
QAC(/^td-([nul])$/, function (match, style) {
    style.textDecoration = TEXTDECORATION_LOOKUP[match[1]];
});
/**
 * @qs Letter-Spacing
 * @param {number} size in pixels, or specify another unit
 * @example ls-
 * @implement ls-[value]
 */
QAC(/^ls-(.+)$/, function (match, style) {
    var size = evalPixels(match[1]);
    style.letterSpacing = size;
});
/**
 * @qs Word-Spacing
 * @param {number} size in pixles, or specifiy another unit
 * @example wos-
 * @implement wos-[size]
 */
QAC(/^wos-(.+)$/, function (match, style) {
    var size = evalPixels(match[1]);
    style.wordSpacing = size;
});
/**
 * @qs Text-Align
 * @param {TEXTALIGN_LOOKUP} direction
 * @example ta-l, ta-r, ta-j, ta-c
 * @implement ta-[direction]
 */
QAC(/^ta-([lrjc])$/, function (match, style) {
    style.textAlign = TEXTALIGN_LOOKUP[match[1]];
});
/**
 * @qs Line-Height
 * @param {number} value
 * @example lh-
 * @implement lh-[value]
 */
QAC(/^lh-(.+)$/, function (match, style) {
    var styleKey = 'lineHeight';
    style[styleKey] = match[1];
});
/**
 * @enum
 */
var WORDWRAP_LOOKUP = {
    n: 'normal',
    b: 'break-word',
};
/**
 * qs WordWrap
 * @param {WORDWRAP_LOOKUP} value
 * @example ww-n, ww-b
 * * @implement ww-[value]
 */
QAC(/^ww-([nb])$/, function (match, style) {
    var styleKey = 'wordWrap';
    style[styleKey] = WORDWRAP_LOOKUP[match[1]];
});
/**
 * @enum
 * WordBreak
 */
var WORDBREAK_LOOKUP = {
    n: 'normal',
    b: 'break-all',
    k: 'keep-all',
    w: 'break-word',
};
/**
 * qs WordBreak
 * @param {WORDBREAK_LOOKUP} value
 * @example wb-n, wb-b, wb-k, wb-w
 * @implement ww-[value]
 */
QAC(/^wb-([nbkw])$/, function (match, style) {
    var styleKey = 'wordBreak';
    style[styleKey] = WORDBREAK_LOOKUP[match[1]];
});
/**
 * @qs Line-Limit
 * @desc WEBKIT ONLY!!!!! sets overflowY to hidden
 * @param {number} value
 * @example ll-
 * @implement ll-[value]
 */
QAC(/^ll-(.+)$/, function (match, style) {
    style.WebkitLineClamp = match[1];
    style.display = '-webkit-box';
    style.overflowY = 'hidden';
    style.WebkitBoxOrient = 'vertical';
});
/**
 * @enum
 * whiteSpace: 'pre-wrap'
 */
var WHITESPACE_LOOKUP = {
    p: 'pre-wrap',
    n: 'nowrap',
};
/**
 * @qs Whitespace
 * @param {WHITESPACE_LOOKUP} value
 * @example ws-p, ws-n
 * @implement ws-[value]
 */
QAC(/^ws-([pn]+)$/, function (match, style) {
    style.whiteSpace = WHITESPACE_LOOKUP[match[1]];
});
/**
 * @enum
 */
var HYPHENS_LOOKUP = {
    n: 'none',
    m: 'manual',
    a: 'auto',
};
/**
 * @qs Hyphens
 * @param {HYPHENS_LOOKUP} type
 * @example hyp-n, hyp-m, hyp-a
 * @implement hyp-[value]
 */
QAC(/^hyp-([nma])$/, function (match, style) {
    style.MozHyphens = style.WebkitHyphens = style.OHyphens = style.hyphens = HYPHENS_LOOKUP[match[1]];
});
/**
 * @qs text-indent
 * @param {number} value in pixels, otherwise specify units.
 * @example ti-
 * @implement ti-[value]
 */
QAC(/^ti-(.+)$/, function (match, style) {
    style.textIndent = evalPixels(match[1]);
});
/** @enum */
var TEXTOVERFLOW_LOOKUP = {
    c: 'clip',
    e: 'ellipsis',
};
/**
 * @qs text-overflow
 * @param {TEXTOVERFLOW_LOOKUP} property
 * @example tof-c, tof-e
 * @implement tof-[property]
 */
QAC(/^tof-(.+)$/, function (match, style) {
    var s = match[1];
    // can be freeform text
    style.textOverflow = TEXTOVERFLOW_LOOKUP[s];
});
/** @enum */
var TEXTTRANSFORM_LOOKUP = {
    c: 'capitalize',
    l: 'lowercase',
    u: 'uppercase',
};
/**
 * @qs text-transform
 * @param {TEXTTRANSFORM_LOOKUP} property
 * @example tt-u, tt-l, tt-c
 * @implement tt-[property]
 */
QAC(/^tt-([clu])$/, function (match, style) {
    var s = match[1];
    style.textTransform = TEXTTRANSFORM_LOOKUP[s];
});
/*
 
 ███████╗██╗     ███████╗██╗  ██╗██████╗  ██████╗ ██╗  ██╗
 ██╔════╝██║     ██╔════╝╚██╗██╔╝██╔══██╗██╔═══██╗╚██╗██╔╝
 █████╗  ██║     █████╗   ╚███╔╝ ██████╔╝██║   ██║ ╚███╔╝
 ██╔══╝  ██║     ██╔══╝   ██╔██╗ ██╔══██╗██║   ██║ ██╔██╗
 ██║     ███████╗███████╗██╔╝ ██╗██████╔╝╚██████╔╝██╔╝ ██╗
 ╚═╝     ╚══════╝╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝
                                                          
 
*/
/**
 * @qs flex-
 * @param {number} grow
 * @param {number} shrink
 * @param {number} basis in pixels, or specify units
 * @example flx-,
 * @implement flx-[grow]-[shrink]-[basis]
 */
QAC(/^flx-(.+)-(.+)-(.+)$/, function (match, style) {
    style.WebkitFlexGrow = style.flexGrow = match[1];
    style.WebkitFlexShrink = style.flexShrink = match[2];
    style.WebkitFlexBasis = style.flexBasis = evalPixels(match[3]);
});
/** @enum */
var FLEXDIRECTION_LOOKUP = {
    c: 'column',
    cr: 'column-reverse',
    r: 'row',
    rr: 'row-reverse',
};
/**
 * @qs flex-direction
 * @param {FLEXDIRECTION_LOOKUP} property
 * @example flxd-c, flxd-r, flxd-cr, flxd-rr
 * @implement flxd-[property]
 */
QAC(/^flxd-([cr]r?)$/, function (match, style) {
    style.WebkitFlexDirection = style.flexDirection = FLEXDIRECTION_LOOKUP[match[1]];
});
/**
 * @qs flex-grow
 * @desc note: also sets flexBasis to 0px
 * @param {number} weight
 * @example flxg-
 * @implement flxg-[weight]
 */
QAC(/^flxg-(.+)$/, function (match, style) {
    style.WebkitFlexGrow = style.flexGrow = match[1];
    style.WebkitFlexBasis = style.flexBasis = '0px'; // generally when we want flexgrow we want basis of 0 to act like a simple nested box system
});
/**
 * @qs flex-shrink
 * @param {number} weight
 * @example flxs-
 * @implement flxs-[weight]
 */
QAC(/^flxs-(.+)$/, function (match, style) {
    style.WebkitFlexShrink = style.flexShrink = match[1];
});
/**
 * @qs flex-basis
 * @param {number} weight
 * @example flxb-
 * @implement flxb-[weight]
 */
QAC(/^flxb-(.+)$/, function (match, style) {
    style.WebkitFlexBasis = style.flexBasis = evalPixels(match[1]);
});
/**
 * @enum
 */
var FLEXWRAP_LOOKUP = {
    n: 'nowrap',
    w: 'wrap',
    r: 'wrap-reverse',
};
/**
 * @qs Flex-Wrap
 * @param {FLEXWRAP_LOOKUP} wrap
 * @example flxw-n, flxw-w, flxw-r
 * @implement flex-[wrap]
 */
// flxw-n flxw-w flxw-r
QAC(/^flxw-([nwr])$/, function (match, style) {
    style.WebkitFlexWrap = style.flexWrap = FLEXWRAP_LOOKUP[match[1]];
});
/**
 * @qs AutoGrid
 * @param {number} cellWidth
 * @example autogrid-160
 * @implement autogrid-[cellWidth]
 */
QAC(/^autogrid-(.+)$/, function (match, style) {
    style.display = 'grid';
    style.gridTemplateColumns = "repeat(auto-fill,minmax(".concat(evalPixels(match[1]), ", 1fr))");
});
/**
 * Column-count
 * @param {number} number
 * @example cols-
 * @implement cols-[number]
 */
QAC(/^cols-(.+)$/, function (match, style) {
    style.WebkitColumnCount = match[1];
    style.MozColumnCount = match[1];
    style.columnCount = match[1];
});
/**
 * Column-gap
 * @param {number} number
 * @example colgap-
 * @implement colgap-[number]
 */
QAC(/^colgap-(.+)$/, function (match, style) {
    style.WebkitColumnGap = evalPixels(match[1]);
    style.MozColumnGap = evalPixels(match[1]);
    style.columnGap = evalPixels(match[1]);
});
/**
 * @qs Order
 * @param {number} order
 * @example ord-
 * @implement ord-[order]
 */
QAC(/^ord-(.+)$/, function (match, style) {
    style.order = match[1];
});
/**
 * @qs Center
 * @style
 * @description sets AlignItem and JustifyContent to 'center'
 * @prop alignItems center
 * @prop jusityContent center
 * @example cc
 * @implement cc
 */
// cc
QAC('cc', {
    alignItems: 'center',
    justifyContent: 'center',
    WebkitAlignItems: 'center',
    WebkitJustifyContent: 'center',
});
/**
 * @enum
 */
var ALIGNITEMS_LOOKUP = {
    c: 'center',
    fs: 'flex-start',
    fe: 'flex-end',
    b: 'baseline',
    s: 'stretch',
};
/**
 * @qs Align-Items
 * @param {ALIGNITEMS_LOOKUP} direction
 * @example ai-c, ai-fs, ai-fe, ai-b, ai-s
 * @implement ai-[direction]
 */
QAC(/^ai-(c|b|fs|fe|s)$/, function (match, style) {
    style.WebkitAlignItems = style.alignItems = ALIGNITEMS_LOOKUP[match[1]];
});
/**
 * @enum
 */
var JUSTIFYCONTENT_LOOKUP = {
    c: 'center',
    fs: 'flex-start',
    fe: 'flex-end',
    sa: 'space-around',
    sb: 'space-between',
};
/**
 * @qs Justify-Content
 * @param {JUSTIFYCONTENT_LOOKUP} direction
 * @example jc-c, jc-fs, jc-fe, jc-sa, jc-sb
 * @implement jc-[direction]
 */
QAC(/^jc-(c|fs|fe|sa|sb)$/, function (match, style) {
    style.WebkitJustifyContent = style.justifyContent = JUSTIFYCONTENT_LOOKUP[match[1]];
});
/**
 * @enum
 */
var JUSTIFYSELF_LOOKUP = {
    a: 'auto',
    fs: 'flex-start',
    fe: 'flex-end',
    c: 'center',
    b: 'baseline',
    s: 'stretch',
};
/**
 * @qs Justify-Self
 * @param {JUSTIFYSELF_LOOKUP} direction
 * @example js-c, js-fs, js-fe, js-sa, js-sb
 * @implement js-[direction]
 */
QAC(/^js-(a|fs|fe|c|b|s)$/, function (match, style) {
    style.WebkitJustifySelf = style.justifySelf = JUSTIFYSELF_LOOKUP[match[1]];
});
/**
 * @enum
 */
var ALIGNSELF_LOOKUP = {
    a: 'auto',
    fs: 'flex-start',
    fe: 'flex-end',
    c: 'center',
    b: 'baseline',
    s: 'stretch',
};
/**
 * @qs Align-Self
 * @param {ALIGNSELF_LOOKUP} direction
 * @example as-c, as-b, as-fs, as-fe, as-s
 * @implement as-[direction]
 */
QAC(/^as-(a|fs|fe|c|b|s)$/, function (match, style) {
    style.WebkitAlignSelf = style.alignSelf = ALIGNSELF_LOOKUP[match[1]];
});
/**
 * @qs order
 * @param {number} sorting order
 * @example order-5 order--5
 * @implement order-[value]
 */
// order- [number]
QAC(/^order-(.+)$/, function (match, style) {
    style.order = match[1];
});
/*
 
 ██████╗  █████╗  ██████╗██╗  ██╗ ██████╗ ██████╗  ██████╗ ██╗   ██╗███╗   ██╗██████╗
 ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝ ██╔══██╗██╔═══██╗██║   ██║████╗  ██║██╔══██╗
 ██████╔╝███████║██║     █████╔╝ ██║  ███╗██████╔╝██║   ██║██║   ██║██╔██╗ ██║██║  ██║
 ██╔══██╗██╔══██║██║     ██╔═██╗ ██║   ██║██╔══██╗██║   ██║██║   ██║██║╚██╗██║██║  ██║
 ██████╔╝██║  ██║╚██████╗██║  ██╗╚██████╔╝██║  ██║╚██████╔╝╚██████╔╝██║ ╚████║██████╔╝
 ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═════╝
                                                                                      
 
*/
/** @enum */
var BACKGROUND_POS = {
    c: 'center',
    t: 'top',
    b: 'bottom',
    l: 'left',
    r: 'right',
    '0': 'top left',
    '1': 'top right',
    '2': 'bottom right',
    '3': 'bottom left',
};
/**
 * @qs Background-Position
 * @param {BACKGROUND_POS_LOOKUP} position
 * @example bgpos-c, bgpos-t, bgpos-b, bgpos-l, bgpos-r, bgpos-0, bgpos-1, bgpos-2, bgpos-3
 * @implement bgpos-[position]
 */
QAC(/^bgpos-([ctblr0123])$/, function (match, style) {
    style.backgroundPosition = BACKGROUND_POS[match[1]];
});
/**
 * @qs Background-Size
 * @param {number|cover|contain} size in pixels. Otherwise specify units. You may also specify cover or contain
 * @example bgsize-20%, bgsize-cover, bgsize-contain
 * @implement bgsize-[size]
 */
// bgsize- [cover, contain]
QAC(/^bgsize-([\w\.%]+)$/, function (match, style) {
    style.backgroundSize = evalPixels(match[1]);
});
/**
 * @qs Background-Image
 * @param {string} url for image
 * @example bgimg-templateImages/green_back.png
 * @implement bgimg-[url]
 */
QAC(/^bgimg-(.+)$/, function (match, style) {
    style.backgroundImage = 'url(' + match[1] + ')';
});
/** @enum */
var BACKGROUND_REPEAT = {
    r: 'repeat',
    n: 'no-repeat',
    x: 'repeat-x',
    y: 'repeat-y',
};
/**
 * @qs Background-Repeat
 * @param {BACKGROUND_REPEAT} value
 * @example bgrepeat-r, bgrepeat-n, bgrepeat-x, bgrepeat-y
 * @implement bgrepeat-[value]
 */
// bgrepeat-
QAC(/^bgrepeat-([rnxy])$/, function (match, style) {
    style.backgroundRepeat = BACKGROUND_REPEAT[match[1]];
});
/*
 
 ██╗   ██╗██╗███████╗██╗██████╗ ██╗██╗     ██╗████████╗██╗   ██╗
 ██║   ██║██║██╔════╝██║██╔══██╗██║██║     ██║╚══██╔══╝╚██╗ ██╔╝
 ██║   ██║██║███████╗██║██████╔╝██║██║     ██║   ██║    ╚████╔╝
 ╚██╗ ██╔╝██║╚════██║██║██╔══██╗██║██║     ██║   ██║     ╚██╔╝
  ╚████╔╝ ██║███████║██║██████╔╝██║███████╗██║   ██║      ██║
   ╚═══╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝╚══════╝╚═╝   ╚═╝      ╚═╝
                                                                
 
*/
/** @enum */
var VISIBILITY_LOOKUP = {
    n: 'normal',
    h: 'hidden',
    v: 'visible',
};
// vis-h, vis-n
/**
 * @qs visibility
 * @param {VISIBILITY_LOOKUP} value
 * @example vis-h, vis-n
 * @implement vis-[value]
 */
QAC(/^vis-(.+)$/, function (match, style) {
    style.visibility = VISIBILITY_LOOKUP[match[1]];
});
/**
 * @qs opacity
 * @param {number} value value between 1.0 (fully opaque) and 0.0 (Fully transparent)
 * @example op-
 * @implement op-[value]
 */
QAC(/^op-(.+)$/, function (match, style) {
    style.opacity = match[1];
});
/*
 
 ██╗███╗   ██╗██████╗ ██╗   ██╗████████╗
 ██║████╗  ██║██╔══██╗██║   ██║╚══██╔══╝
 ██║██╔██╗ ██║██████╔╝██║   ██║   ██║
 ██║██║╚██╗██║██╔═══╝ ██║   ██║   ██║
 ██║██║ ╚████║██║     ╚██████╔╝   ██║
 ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝    ╚═╝
                                        
 
*/
/** @enum */
var RESIZE_LOOKUP = {
    v: 'vertical',
    h: 'horizontal',
    b: 'both',
    n: 'none',
};
/**
 * @qs Resize
 * @param {RESIZE_LOOKUP} property
 * @example rs-v, rs-h, rs-b, rs-n
 * @implement rs-[property]
 */
QAC(/^rs-([vhbn])$/, function (match, style) {
    style.resize = RESIZE_LOOKUP[match[1]];
});
/**
 * user-select
 */
var USERSELECT_LOOKUP = {
    n: 'none',
    t: 'text',
    a: 'all',
};
/**
 * @qs User-Select
 * @param {USERSELECT_LOOKUP} property
 * @example us-n, us-t, us-a
 * @implement us-[property]
 */
QAC(/^us-([nta])$/, function (match, style) {
    var styleVal = USERSELECT_LOOKUP[match[1]];
    style.MozUserSelect = style.WebkitUserSelect = style.UserSelect = style.WebkitTouchCallout = styleVal;
});
/** @enum */
var POINTEREVENTS_LOOKUP = {
    a: 'auto',
    n: 'none',
    vp: 'visiblePainted',
    vf: 'visibleFill',
    vs: 'visibleStroke',
    v: 'visible',
    p: 'painted',
    f: 'fill',
    s: 'stroke',
    all: 'all',
    i: 'inherit',
};
/**
 * @qs pointer-events
 * @param {POINTEREVENTS_LOOKUP} property
 * @example pe-a, pe-n, pe-vp, pe-vs, pe-v, pe-p, pe-f, pe-s, pe-all, pe-i
 * @implement pe-
 */
QAC(/^pe-([a-z]+)$/, function (match, style) {
    var property = POINTEREVENTS_LOOKUP[match[1]];
    style.pointerEvents = property;
});
/** @enum */
var CURSOR_LOOKUP = {
    p: 'pointer',
    a: 'auto',
    d: 'default',
    t: 'text', // text selection cursor
};
/**
 * @qs Cursor
 * @param {CURSOR_LOOKUP} property
 * @example cur-p, cur-a, cur-d, cur-t
 * @implements cur-[property]
 */
QAC(/^cur-([pdat])$/, function (match, style) {
    style.cursor = CURSOR_LOOKUP[match[1]];
});
/*
 
 ████████╗██████╗  █████╗ ███╗   ██╗███████╗██╗████████╗██╗ ██████╗ ███╗   ██╗
 ╚══██╔══╝██╔══██╗██╔══██╗████╗  ██║██╔════╝██║╚══██╔══╝██║██╔═══██╗████╗  ██║
    ██║   ██████╔╝███████║██╔██╗ ██║███████╗██║   ██║   ██║██║   ██║██╔██╗ ██║
    ██║   ██╔══██╗██╔══██║██║╚██╗██║╚════██║██║   ██║   ██║██║   ██║██║╚██╗██║
    ██║   ██║  ██║██║  ██║██║ ╚████║███████║██║   ██║   ██║╚██████╔╝██║ ╚████║
    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
                                                                              
 
*/
/** @enum */
var TRANSITION_LOOKUP = {
    b: 'border-width',
    bgcolor: 'background-color',
    bgpos: 'background-position',
    bottom: 'bottom',
    brdc: 'border-color',
    col: 'color',
    f: 'fill',
    fs: 'font-size',
    fw: 'font-weight',
    h: 'height',
    hn: 'min-height',
    hx: 'max-height',
    left: 'left',
    m: 'margin',
    mb: 'margin-bottom',
    ml: 'margin-left',
    mr: 'margin-right',
    mt: 'margin-top',
    none: 'none',
    op: 'opacity',
    right: 'right',
    top: 'top',
    tr: 'transform',
    v: 'visibility',
    w: 'width',
    wn: 'min-width',
    wx: 'max-width',
};
// tslint:disable:max-line-length
/**
 * @qs Transition
 * @desc implements ease
 * @param {TRANSITION_LOOKUP} transition
 * @param {number} duration
 * @example trans-bc, trans-bp, trans-bot, trans-col, trans-f, trans-fs, trans-fw, trans-ht, trans-l, trans-hx, trans-wx, trans-hn, trans-wn, trans-ml, trans-o, trans-r, trans-t, trans-v, trans-w, trans-tr, trans-none
 * @implement trans-[transition]-[duration]
 */
// tslint:enable:max-line-length
QAC(/^trans-(.*)-([.0-9]+)s?$/, function (match, style) {
    var properties = match[1].split('-');
    var duration = match[2];
    var styles = [];
    for (var i = 0; i < properties.length; ++i) {
        var property = TRANSITION_LOOKUP[properties[i]];
        styles.push(property + ' ' + duration + 's ease');
        // This is to cover up a stuttering bug that occurs in ios webkit:
        // If you transition from opacity 1 to < 1, it triggers a reorder which causes a bad hiccup if scrolling
        if (property === 'opacity' && (!style.hasOwnProperty('opacity') || style.opacity === 1)) {
            style.opacity = '0.9999'; // dirt mcgirt
        }
    }
    var styleVal = styles.join(', ');
    style.MozTransition = style.WebkitTransition = style.OTransition = style.Transition = styleVal;
});
/**
 * @qs Animation
 * @param {string} AnimationName
 * @param {number} duration in milliseconds
 * @example anim-
 * @implement anim-[AnimationName]-[duration]
 */
QAC(/^anim-(.[^-]+)-(.[^-]+)$/, function (match, style) {
    var anim = match[1];
    var time = match[2] + 'ms';
    style.animationName = anim;
    style.animationDuration = time;
    style.animationIterationCount = 'infinite';
});
/*
 
  ██████╗ ██████╗ ██╗      ██████╗ ██████╗ ███████╗
 ██╔════╝██╔═══██╗██║     ██╔═══██╗██╔══██╗██╔════╝
 ██║     ██║   ██║██║     ██║   ██║██████╔╝███████╗
 ██║     ██║   ██║██║     ██║   ██║██╔══██╗╚════██║
 ╚██████╗╚██████╔╝███████╗╚██████╔╝██║  ██║███████║
  ╚═════╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
                                                   
 
*/
function colorFromName(colorName, errors) {
    var col;
    if (colorName[0] === '#') {
        col = color(colorName);
    }
    else if (colorName.match(/rgba\[\d+,\d+,\d+,\d+(\.\d+)?\]$/) ||
        colorName.match(/rgb\[\d+,\d+,\d+\]$/)) {
        col = color(colorName.replace('[', '(').replace(']', ')'));
    }
    else {
        col = gColorConstants[colorName];
    }
    if (!col) {
        errors.push({
            err: 'invalid color specified in quarkStyle, see colorConstants',
            details: colorName,
        });
        return color('magenta');
    }
    return col;
}
// c-[colorConst]-[option1]-[option2]-[option3...]
// options:
//      bg, fg, b (border), f (fill), s (stroke), a# (alpha[0-1]), d (darken), l (lighten)
// use this in conjunction with other quark css calls
/**
 * @enum
 * @name COLOR_OPTIONS
 * @prop a alpha
 * @prop d darken
 * @prop l lighten
 * @prop fg color (forground)
 * @prop bg backgrondColor
 * @prop b borderColor
 * @prop bb borderBottomColor
 * @prop bt borderTopColor
 * @prop bl borderLeftColor
 * @prop br borderRightColor
 * @prop f fill
 * @prop s stroke
 */
/**
 * @qs Colors
 * @param {COLOR_CONSTANT|HexColor} color use predefined color, or hex value
 * @param {COLOR_OPTIONS} [options] use many
 * @example c-
 * @implement c-[color]-[option1]-[option2]...
 */
QAC(/^c-(.[^-]+)-(.+)$/, function (match, style, errors) {
    var col = colorFromName(match[1], errors);
    var options = match[2].split('-');
    var keys = [];
    for (var i = 0; i < options.length; i++) {
        var o = options[i];
        if (o[0] === 'a') {
            col = col.alpha(Number(o.slice(1)));
        }
        else if (o[0] === 'd') {
            col = col.darken(Number(o.slice(1)));
        }
        else if (o[0] === 'l') {
            col = col.lighten(Number(o.slice(1)));
        }
        else {
            switch (o) {
                case 'fg':
                    keys.push('color');
                    break;
                case 'bg':
                    keys.push('backgroundColor');
                    break;
                case 'b':
                    keys.push('borderColor');
                    break;
                case 'bb':
                    keys.push('borderBottomColor');
                    break;
                case 'bt':
                    keys.push('borderTopColor');
                    break;
                case 'bl':
                    keys.push('borderLeftColor');
                    break;
                case 'br':
                    keys.push('borderRightColor');
                    break;
                case 'f':
                    keys.push('fill');
                    break;
                case 's':
                    keys.push('stroke');
                    break;
            }
        }
    }
    for (var i = 0; i < keys.length; i++) {
        style[keys[i]] = col;
    }
});
// grad-[dir]-[color1]-[color2]-[b?]
// dirs:
//      v(ertical), h(orizontal), d(iagonal \ ), c(ross-diagonal / )
// trailing -b is for borderImage instead of backgroundImage, and is optional
// TODO: arbitrary degrees
QAC(/^grad-([vhdc])-(.[^-]+)-(.[^-]+)(-b)?$/, function (match, style, errors) {
    var dir = match[1];
    var borderImage = match[4];
    var color1 = colorFromName(match[2], errors);
    var color2 = colorFromName(match[3], errors);
    if (!color1 || !color2) {
        errors && errors.push({
            err: 'invalid color specified in quarkStyle, see colorConstants',
            details: match[0],
        });
        return;
    }
    var dest = dir === 'v' ? 'bottom' : 'right';
    switch (dir) {
        case 'v':
            dest = 'to bottom';
            break;
        case 'h':
            dest = 'to right';
            break;
        case 'd':
            dest = '135deg';
            break;
        case 'c':
            dest = '45deg';
            break;
    }
    var img = 'linear-gradient(' + dest + ' , ' + color1.rgb().string() + ' 0%, ' + color2.rgb().string() + ' 100%)';
    var repeat = 'no-repeat';
    if (borderImage) {
        style.borderImage = img;
        style.borderImageRepeat = repeat;
    }
    else {
        style.backgroundImage = img;
        style.backgroundRepeat = repeat;
    }
});
// distgrad-[dir]-[color1]-[dist1]-[color2]-[dist2]-....
// dirs:
//      v(ertical), h(orizontal), d(iagonal \ ), c(ross-diagonal / )
QAC(/^distgrad-([vhdc])-(.*)/, function (match, style, errors) {
    var props = match[2].split('-');
    if (!props.length || (props.length % 2 !== 0)) {
        errors && errors.push({
            err: 'invalid distgrad props count, should be even',
            details: match[2],
        });
        return;
    }
    var dir = match[1];
    var colorPairs = [];
    for (var i = 0; i < props.length; i += 2) {
        var propColor = colorFromName(props[i], errors);
        if (!propColor) {
            errors && errors.push({
                err: 'invalid color specified in quarkStyle, see colorConstants',
                details: props[i],
            });
            return;
        }
        var dist = props[i + 1];
        colorPairs.push("".concat(propColor.rgb().string(), " ").concat(defaultSuffix(dist, 'px')));
    }
    var dest = dir === 'v' ? 'bottom' : 'right';
    switch (dir) {
        case 'v':
            dest = 'to bottom';
            break;
        case 'h':
            dest = 'to right';
            break;
        case 'd':
            dest = '135deg';
            break;
        case 'c':
            dest = '45deg';
            break;
    }
    var img = "linear-gradient( ".concat(dest, "  , ").concat(colorPairs.join(', '), " )");
    style.backgroundImage = img;
    style.backgroundRepeat = 'no-repeat';
});
function setColorConstants(colorConstants) {
    gColorConstants = colorConstants;
    if (gHasColorConstants) {
        DOMClassManager.resetCache();
    }
    gHasColorConstants = true;
}
exports.setColorConstants = setColorConstants;
/*
 
 ███████╗██╗██╗  ████████╗███████╗██████╗ ███████╗
 ██╔════╝██║██║  ╚══██╔══╝██╔════╝██╔══██╗██╔════╝
 █████╗  ██║██║     ██║   █████╗  ██████╔╝███████╗
 ██╔══╝  ██║██║     ██║   ██╔══╝  ██╔══██╗╚════██║
 ██║     ██║███████╗██║   ███████╗██║  ██║███████║
 ╚═╝     ╚═╝╚══════╝╚═╝   ╚══════╝╚═╝  ╚═╝╚══════╝
                                                  
 
*/
/**
 * @qs Blur
 * @param {number} size in pixles, otherwise specify units.
 * @example blur-
 * @implement blur-[value]
 */
QAC(/^blur-(.+)$/, function (match, style) {
    var size = evalPixels(match[1]);
    style.filter = 'blur(' + size + ')';
    style.WebkitFilter = 'blur(' + size + ')';
});
// Invert
/**
 * @qs Invert
 * @param {number} amount of color to invert in percentage,
 * @example invert-40%
 * @implement invert-[value]
 */
QAC(/^invert-(.+)$/, function (match, style) {
    var amount = defaultSuffix(match[1], '%');
    style.filter = 'invert(' + amount + ')';
    style.WebkitFilter = 'invert(' + amount + ')';
});
/*
 
  ██████╗ ██████╗ ███╗   ███╗██████╗  ██████╗ ███████╗
 ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔═══██╗██╔════╝
 ██║     ██║   ██║██╔████╔██║██████╔╝██║   ██║███████╗
 ██║     ██║   ██║██║╚██╔╝██║██╔══██╗██║   ██║╚════██║
 ╚██████╗╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝███████║
  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ ╚══════╝
                                                      
*/
/**
 * @qs fullSize
 * @style
 * @property top 0
 * @property bottom 0
 * @property left 0
 * @property right 0
 * @desc To fill it's parent, sets all position properties to 0
 * @example fullSize
 * @implement fullSize
 */
QAC('fullSize', {
    top: '0',
    bottom: '0',
    left: '0',
    right: '0',
});
/**
 * @qs cover
 * @style
 * @property bgsize-cover
 * @property bgpos-c
 * @property bgrepeat-n
 * @desc Center, non-repeated, and covering. Most common background image set.
 * @example cover
 * @implement cover
 */
QAC('cover', {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
});
// FadeIn
/**
 * @qs Invert
 * @param {number} time in s to fade in opacity
 * @example fadeIn-0.5
 * @implement fadeIn-[value]
 */
QAC(/^fadeIn-(.+)$/, function (match, style) {
    var amount = match[1] + 's';
    var anim = 'fadeIn ' + amount + ' ease-in';
    style.Animation = anim;
    style.WebkitAnimation = anim;
    style.MozAnimation = anim;
    style.MsAnimation = anim;
    style.OAnimation = anim;
});
