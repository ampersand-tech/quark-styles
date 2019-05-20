"use strict";
/**
* Copyright 2015-present Ampersand Technologies, Inc.
*/
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var stringify = require("json-stable-stringify");
var React = require("react");
var deepForceUpdate = require("react-deep-force-update");
var gErrFunc;
function logError(err, details) {
    if (gErrFunc) {
        gErrFunc(err, details);
    }
    else {
        console.error(err, details); // @allowConsoleFuncs
    }
}
var MOBILE_DISALLOWED_PSEUDO_SELECTORS = {
    hover: true,
};
var CLASS_ALLOWED_PSUEDO_SELECTORS = {
    hover: true,
    active: true,
    parentActive: true,
    disabled: true,
    set: true,
    parentSet: true,
    focus: true,
    before: true,
    after: true,
    parentHover: true,
};
var PSEUDO_SELECTOR_PRIORITY = {};
var EARLY_CLASSES_VALIDATION = process.env.NODE_ENV === 'development';
var INVALID_STRINGS = [
    'undefined',
    'null',
    'NaN',
    'Infinity',
    '[object Object]',
];
// externally set data:
var gPageReactRoots = [];
var gUiClassDefs = {};
var gUiStyleRules = [];
var gParseClassesCache = {}; // caches the parsing of the "classes" property on react elements
var gDomClassCache = {}; // caches the conversion from a style object (plus pseudoselectors) to a class name in the stylesheet
var gDomClassCounter = 0; // a counter used to generate DOM class names for the stylesheet
var gStyleSheet; // the DOM element for the stylesheet
var gStyleSheetContents = ['']; // the text contents of the stylesheet, per priority
var gGlobalClasses = {};
var gUpdateTimer = null; // used to buffer updates to the DOM stylesheet
var gIsTouch = false;
var gPriorityCounter = 1;
var addSelectorPriority = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    PSEUDO_SELECTOR_PRIORITY[pseudoSelectorsToString(args)] = gPriorityCounter++;
    gStyleSheetContents.push('');
};
// initialize priority of pseudoselector classes
addSelectorPriority('before');
addSelectorPriority('after');
addSelectorPriority('disabled');
addSelectorPriority('parentSet');
addSelectorPriority('parentSet', 'disabled');
addSelectorPriority('set');
addSelectorPriority('set', 'disabled');
addSelectorPriority('parentHover');
addSelectorPriority('hover');
addSelectorPriority('focus');
addSelectorPriority('focus', 'active');
addSelectorPriority('focus', 'disabled');
addSelectorPriority('parentActive');
addSelectorPriority('active');
addSelectorPriority('parentHover', 'parentActive');
addSelectorPriority('parentHover', 'active');
addSelectorPriority('hover', 'parentActive');
addSelectorPriority('hover', 'active');
function pseudoSelectorsToString(pseudoSelectors) {
    var selectors = [];
    var usedSelectors = {};
    var notDisabled = false;
    var hasDisabled = false;
    var hasSet = false;
    var parentSelectors = [];
    for (var i = 0; i < pseudoSelectors.length; ++i) {
        var selector = pseudoSelectors[i];
        if (usedSelectors[selector]) {
            // ignore duplicates
            continue;
        }
        usedSelectors[selector] = true;
        if (selector === 'active' || selector === 'hover' || selector === 'focus') {
            notDisabled = true;
            selectors.push(selector);
        }
        else if (selector === 'disabled') {
            hasDisabled = true;
        }
        else if (selector === 'set') {
            hasSet = true;
        }
        else if (selector === 'parentSet') {
            notDisabled = true;
            parentSelectors.push('.dcmIsSet:not(.dcmDisabled)');
        }
        else if (selector === 'parentHover') {
            notDisabled = true;
            parentSelectors.push(':hover');
        }
        else if (selector === 'parentActive') {
            notDisabled = true;
            parentSelectors.push(':active');
        }
        else {
            selectors.push(selector);
        }
    }
    var selectorString = '';
    if (selectors.length) {
        selectorString = ':' + selectors.sort().join(':');
    }
    else {
        selectorString = '';
    }
    if (hasSet) {
        selectorString = '.dcmIsSet' + selectorString;
    }
    if (hasDisabled) {
        // translate fake :disabled pseudoselector to the actual .dcmDisabled class
        selectorString = '.dcmDisabled' + selectorString;
    }
    else if (notDisabled) {
        // only apply hover/active/focus styles if not disabled
        selectorString += ':not(.dcmDisabled)';
    }
    if (parentSelectors.length) {
        // translate the fake :parentHover pseudoselector to the .dcmSelectorParent descendant selector
        selectorString = '.dcmSelectorParent' + parentSelectors.sort().join('') + ' ' + selectorString;
    }
    return selectorString;
}
function pseudoSelectorsAllowed(pseudoSelectors) {
    if (!gIsTouch) {
        return true;
    }
    for (var i = 0; i < pseudoSelectors.length; i++) {
        var sel = pseudoSelectors[i];
        if (sel in MOBILE_DISALLOWED_PSEUDO_SELECTORS) {
            return false;
        }
    }
    return true;
}
function verifyStyles(className, style, debugName, errors) {
    for (var key in style) {
        var value = style[key];
        if (CLASS_ALLOWED_PSUEDO_SELECTORS[key]) {
            verifyStyles(className, value, debugName, errors);
        }
        else {
            // value is of type color
            if (value && value.rgb) {
                value = style[key] = value.rgb().string();
            }
            if (typeof value !== 'string' || value === 'undefined' || value === 'null') {
                errors.push({
                    err: 'Invalid style value for key in class (type not string or null/undefined)',
                    details: { key: key, className: className, valueType: (typeof value), value: value, debugName: debugName },
                });
            }
        }
    }
    if (style.color && !style.fill) {
        style.fill = style.color;
    }
}
function applyStyle(debugName, className, classNameOrMatch, style, classStyles, selectorStyles, pseudoSelectors, classNameSelectors, errors) {
    if (pseudoSelectors && pseudoSelectors.length) {
        if (!pseudoSelectorsAllowed(pseudoSelectors)) {
            return;
        }
        var selectorStr = pseudoSelectorsToString(pseudoSelectors);
        selectorStyles[selectorStr] = selectorStyles[selectorStr] || {};
        style = selectorStyles[selectorStr];
    }
    if (typeof classStyles === 'function') {
        classStyles(classNameOrMatch, style, errors);
        verifyStyles(className, style, debugName, errors);
        return;
    }
    var foundClassNameSelector = false;
    for (var key in classStyles) {
        if (CLASS_ALLOWED_PSUEDO_SELECTORS[key]) {
            if (!classNameSelectors || classNameSelectors[0] === key) {
                var subSelectors = void 0, subClassNameSelectors = void 0;
                if (classNameSelectors) {
                    subClassNameSelectors = classNameSelectors.slice(1);
                    foundClassNameSelector = true;
                }
                else {
                    subSelectors = (pseudoSelectors || []).slice();
                    subSelectors.push(key);
                }
                // recurse into pseudoselector object
                applyStyle(debugName, className, classNameOrMatch, style, classStyles[key], selectorStyles, subSelectors, subClassNameSelectors, errors);
            }
        }
        else {
            style[key] = classStyles[key];
        }
    }
    if (classNameSelectors && classNameSelectors.length && !foundClassNameSelector) {
        errors.push({
            err: 'Class subselector not found in class definition',
            details: { className: classNameOrMatch, debugName: debugName },
        });
    }
}
function classToStyle(debugName, className, style, selectorStyles, pseudoSelectors, classesString, errors) {
    if (!className) {
        return;
    }
    var foundMatches = [];
    var classNameSelectors = className.split('.');
    var bareClassName = classNameSelectors.shift() || '';
    if (gUiClassDefs.hasOwnProperty(bareClassName)) {
        foundMatches.push(bareClassName);
        applyStyle(debugName, bareClassName, className, style, gUiClassDefs[bareClassName], selectorStyles, pseudoSelectors, 
        // if className is a path (ie "uiButtonColor.hover") then we don't want to apply the class's selectors
        classNameSelectors.length ? classNameSelectors : null, errors);
    }
    else {
        for (var i = 0; i < gUiStyleRules.length; ++i) {
            var rule = gUiStyleRules[i];
            var m = className.match(rule.regex);
            if (m) {
                foundMatches.push(m);
                if (foundMatches.length === 1) {
                    applyStyle(debugName, className, m, style, rule.classStyles, selectorStyles, pseudoSelectors, null, errors);
                }
            }
        }
    }
    if (!foundMatches.length) {
        errors.push({
            err: 'No matching class definition or rule for className',
            details: { className: className, debugName: debugName, classes: classesString },
        });
    }
    else if (foundMatches.length > 1) {
        errors.push({
            err: 'More than one matching class definition or rule for class',
            details: { className: className, debugName: debugName, foundMatches: foundMatches.join(', ') },
        });
    }
}
function triggerStyleSheetUpdate() {
    if (gUpdateTimer) {
        return;
    }
    gUpdateTimer = setTimeout(function () {
        gUpdateTimer = null;
        if (!gStyleSheet) {
            try {
                gStyleSheet = document.getElementById('domClassManagerStyles');
            }
            catch (_ex) {
            }
        }
        if (gStyleSheet) {
            gStyleSheet.innerHTML = gStyleSheetContents.join('');
        }
    }, 0);
}
function styleNameToCssName(name) {
    // this is probably slow
    var cssName = '';
    for (var i = 0; i < name.length; ++i) {
        var ch = name[i].toLowerCase();
        if (ch !== name[i]) {
            cssName += '-';
        }
        cssName += ch;
    }
    return cssName;
}
function attachSelectors(className, pseudoSelectors) {
    if (!pseudoSelectors) {
        return '.' + className;
    }
    var splitSelectors = pseudoSelectors.split(' ');
    splitSelectors[splitSelectors.length - 1] = '.' + className + splitSelectors[splitSelectors.length - 1];
    return splitSelectors.join(' ');
}
function generateGlobalClassForStyles(globalClassName, pseudoSelectors, styles) {
    if (!globalClassName) {
        // use cache
        var key = pseudoSelectors + stringify(styles);
        if (gDomClassCache[key]) {
            return gDomClassCache[key];
        }
        globalClassName = 'SelectorClass' + (gDomClassCounter++);
        gDomClassCache[key] = globalClassName;
    }
    var styleLines = [];
    for (var styleName in styles) {
        var cssName = styleNameToCssName(styleName);
        var styleVal = styles[styleName];
        if (styleName === 'content' && typeof styleVal === 'string') {
            styleVal = '\'' + styleVal + '\'';
        }
        styleLines.push('  ' + cssName + ': ' + styleVal + ' !important;');
    }
    styleLines.sort();
    var priority = PSEUDO_SELECTOR_PRIORITY[pseudoSelectors] || 0;
    gStyleSheetContents[priority] += attachSelectors(globalClassName, pseudoSelectors) + ' {\n' + styleLines.join('\n') + '\n}\n';
    triggerStyleSheetUpdate();
    gGlobalClasses[attachSelectors(globalClassName, pseudoSelectors)] = styles;
    return globalClassName;
}
function combineClasses() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var res = '';
    for (var i = 0; i < args.length; ++i) {
        var arg = args[i];
        if (arg) {
            res += ' ' + arg.trim();
        }
    }
    return res;
}
exports.combineClasses = combineClasses;
// recursive descent parser for classes strings
function parseClassFromString(debugName, str, pseudoSelectors, aggregator, errors) {
    if (str[0] === '(') {
        str = str.slice(1);
        while (str) {
            if (str[0] === ')') {
                return str.slice(1);
            }
            str = parseClassFromString(debugName, str, pseudoSelectors, aggregator, errors) || '';
            while (str[0] === ' ') {
                str = str.slice(1);
            }
        }
        return null;
    }
    var m = str.match(/^([^ :()]+)(.*)$/);
    if (!m) {
        errors.push({
            err: 'Error parsing classes string',
            details: { str: str, debugName: debugName },
        });
        return null;
    }
    var name = m[1];
    str = m[2];
    if (str[0] === ':') {
        if (!name.match(/^[-_a-zA-Z0-9]+$/)) {
            errors.push({
                err: "Error parsing: \"" + name + "\". Not a pseudo-selector",
                details: { str: name, debugName: debugName },
            });
            return null;
        }
        // parsed name is actually a pseudo selector
        var childSelectors = pseudoSelectors.slice();
        childSelectors.push(name);
        return parseClassFromString(debugName, str.slice(1), childSelectors, aggregator, errors);
    }
    aggregator.push({
        name: name,
        pseudoSelectors: pseudoSelectors,
    });
    return str;
}
function parseClassesInternal(globalClassName, classesString, debugName) {
    // parse classes string
    var parsedClasses = [];
    var errors = [];
    var remainder = parseClassFromString(debugName, '(' + classesString.trim() + ')', [], parsedClasses, errors);
    if (remainder) {
        errors.push({
            err: 'Failed to parse classes string, left with remainder',
            details: { classes: classesString, remainder: remainder, debugName: debugName },
        });
    }
    var styles = {};
    var selectorStyles = {};
    // convert classesString to styles
    for (var i = 0; i < parsedClasses.length; ++i) {
        var parsed = parsedClasses[i];
        classToStyle(debugName, parsed.name, styles, selectorStyles, parsed.pseudoSelectors, classesString, errors);
    }
    if (globalClassName) {
        // create global class for styles without pseudo-selectors
        generateGlobalClassForStyles(globalClassName, '', styles);
    }
    // create/lookup global classes for styles with pseudo-selectors
    var className = '';
    for (var selectorStr in selectorStyles) {
        className = combineClasses(className, generateGlobalClassForStyles(globalClassName, selectorStr, selectorStyles[selectorStr]));
    }
    return {
        style: styles,
        className: className,
        errors: errors,
    };
}
function parseWithCache(classesString, debugName) {
    // check the cache
    if (gParseClassesCache[classesString]) {
        return gParseClassesCache[classesString];
    }
    var parsed = parseClassesInternal(null, classesString, debugName);
    // cache it
    gParseClassesCache[classesString] = parsed;
    return gParseClassesCache[classesString];
}
// Returns error string if error, otherwise null if good
function validateClassesString(classesString) {
    var parsed = parseWithCache(classesString, null);
    for (var _i = 0, _a = parsed.errors; _i < _a.length; _i++) {
        var err = _a[_i];
        var errStr = err.err;
        if (err.details) {
            if (typeof err.details === 'string') {
                errStr += ' ' + err.details;
            }
            else if (err.details.className) {
                errStr += ' ' + err.details.className;
            }
        }
        return errStr;
    }
    return null;
}
exports.validateClassesString = validateClassesString;
function parseClasses(classesString, debugName) {
    var parsed = parseWithCache(classesString, debugName);
    for (var _i = 0, _a = parsed.errors; _i < _a.length; _i++) {
        var err = _a[_i];
        logError(err.err, err.details);
    }
    return parsed;
}
function classesToStyle(classes) {
    return parseClasses(classes, null);
}
exports.classesToStyle = classesToStyle;
function classesToSimpleStyle(classes) {
    var parsed = parseClassesInternal(null, classes, null);
    var errs = [];
    for (var _i = 0, _a = parsed.errors; _i < _a.length; _i++) {
        var err = _a[_i];
        var errStr = err.err;
        if (err.details) {
            errStr += ' ' + err.details;
        }
        errs.push(errStr);
    }
    return {
        style: parsed.style,
        errs: errs,
    };
}
exports.classesToSimpleStyle = classesToSimpleStyle;
function applyGlobalClassStyles(styles, globalClassName, pseudoSelectors) {
    var selectorStr = pseudoSelectorsToString(pseudoSelectors);
    var globalStyles = gGlobalClasses[attachSelectors(globalClassName, selectorStr)];
    if (!globalStyles) {
        return styles;
    }
    return Object.assign(Object.assign({}, styles), globalStyles);
}
exports.applyGlobalClassStyles = applyGlobalClassStyles;
function makeGlobalClass(globalClassName, classesString) {
    var parsed = parseClassesInternal(globalClassName, classesString, globalClassName);
    for (var _i = 0, _a = parsed.errors; _i < _a.length; _i++) {
        var err = _a[_i];
        logError(err.err, err.details);
    }
}
exports.makeGlobalClass = makeGlobalClass;
function convertClasses(type, props) {
    var classes = props ? (props.classes || props['data-classes']) : undefined;
    // do early classes string validation on all elements to catch the topmost offender
    if (EARLY_CLASSES_VALIDATION && typeof classes === 'string') {
        for (var i = 0; i < INVALID_STRINGS.length; ++i) {
            if (classes.indexOf(INVALID_STRINGS[i]) >= 0) {
                var errKey = 'classes string contains invalid substring "' + INVALID_STRINGS[i] + '"';
                logError(errKey, { debugName: type, classes: classes });
            }
        }
    }
    // only do conversion on leaf elements (div, span, etc) or on the router Link
    if (!type) {
        return;
    }
    if (type.name !== 'Link') {
        if (typeof type !== 'string') {
            return;
        }
        if (type[0] !== type[0].toLowerCase()) {
            return;
        }
    }
    if (props) {
        var style = (props.style && typeof props.style === 'object') ? props.style : undefined;
        if (style) {
            style = Object.assign({}, style);
        }
        if (classes) {
            var parsed = parseClasses(classes, type.name || type);
            if (style) {
                // merge inline styles and class styles
                style = Object.assign(Object.assign({}, parsed.style), style);
            }
            else {
                style = Object.assign({}, parsed.style);
            }
            props.className = combineClasses(props.className, parsed.className);
        }
        if (props.disabled) {
            props.className = combineClasses(props.className, 'dcmDisabled');
            delete props.onClick;
            delete props['data-linkto'];
        }
        if (props.set) {
            props.className = combineClasses(props.className, 'dcmIsSet');
        }
        if (props.selectorParent) {
            props.className = combineClasses(props.className, 'dcmSelectorParent');
        }
        if (style) {
            props.style = style;
        }
        // Delete all the extraneous processed classes
        delete props.classes;
        delete props['data-classes'];
        delete props.set;
        delete props.selectorParent;
    }
    // automatically set cursor:pointer for elements with a click handler (if cursor is not already set)
    // this allows clicks to work on mobile safari
    if (props && (props.onClick || props['data-linkto']) && (!props.style || !props.style.cursor)) {
        props.style = props.style || {};
        props.style.cursor = 'pointer';
    }
}
exports.convertClasses = convertClasses;
function resetCache() {
    gParseClassesCache = {};
    for (var _i = 0, gPageReactRoots_1 = gPageReactRoots; _i < gPageReactRoots_1.length; _i++) {
        var inst = gPageReactRoots_1[_i];
        deepForceUpdate(inst);
    }
}
exports.resetCache = resetCache;
var SemanticColorRoot = /** @class */ (function (_super) {
    __extends(SemanticColorRoot, _super);
    function SemanticColorRoot() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SemanticColorRoot.prototype.componentWillMount = function () {
        gPageReactRoots.push(this);
    };
    SemanticColorRoot.prototype.componentWillUnmount = function () {
        var idx = gPageReactRoots.indexOf(this);
        if (idx >= 0) {
            gPageReactRoots.splice(idx, 1);
        }
    };
    SemanticColorRoot.prototype.render = function () {
        return this.props.children;
    };
    return SemanticColorRoot;
}(React.Component));
exports.SemanticColorRoot = SemanticColorRoot;
function startModule(theModule) {
    var classModule = new ClassModule();
    // setup for hot reloading
    if (theModule.hot) {
        theModule.hot.accept();
        theModule.hot.dispose(classModule.dispose.bind(classModule));
    }
    return classModule;
}
exports.startModule = startModule;
var ClassModule = /** @class */ (function () {
    function ClassModule() {
        var _this = this;
        this.reactRules = [];
        this.reactClasses = [];
        this.addClass = function (classNameOrRegex, classStyles) {
            if (!classStyles) {
                logError('No classStyles passed in for class', classNameOrRegex);
                return;
            }
            if (classNameOrRegex instanceof RegExp) {
                var classRule = {
                    regex: classNameOrRegex,
                    classStyles: classStyles,
                };
                gUiStyleRules.push(classRule);
                _this.reactRules.push(classRule);
                return;
            }
            if (gUiClassDefs.hasOwnProperty(classNameOrRegex)) {
                logError('Duplicate definition for class', classNameOrRegex);
                return;
            }
            var errors = [];
            verifyStyles(classNameOrRegex, classStyles, null, errors);
            for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
                var err = errors_1[_i];
                logError(err.err, err.details);
            }
            gUiClassDefs[classNameOrRegex] = classStyles;
            _this.reactClasses.push(classNameOrRegex);
        };
        this.dispose = function () {
            // remove rules and classes defined by this module
            for (var _i = 0, _a = _this.reactRules; _i < _a.length; _i++) {
                var rule = _a[_i];
                var idx = gUiStyleRules.indexOf(rule);
                if (idx >= 0) {
                    gUiStyleRules.splice(idx, 1);
                }
            }
            for (var _b = 0, _c = _this.reactClasses; _b < _c.length; _b++) {
                var className = _c[_b];
                delete gUiClassDefs[className];
            }
            _this.reactRules = [];
            _this.reactClasses = [];
            setTimeout(resetCache, 20);
        };
    }
    return ClassModule;
}());
function processTouchMouseProps(props, isTouch) {
    if (!props) {
        return null;
    }
    if (!props.onTouchOrMouseStart && !props.onTouchOrMouseMove && !props.onTouchOrMouseEnd && !props.onTouchMouseClick) {
        return null;
    }
    var newProps = {};
    for (var key in props) {
        var newKey = key;
        if (key === 'onTouchOrMouseStart') {
            newKey = isTouch ? 'onTouchStart' : 'onMouseDown';
        }
        else if (key === 'onTouchOrMouseMove') {
            newKey = isTouch ? 'onTouchMove' : 'onMouseMove';
        }
        else if (key === 'onTouchOrMouseEnd') {
            newKey = isTouch ? 'onTouchEnd' : 'onMouseUp';
        }
        else if (key === 'onTouchMouseClick') {
            newKey = isTouch ? 'onClick' : null;
        }
        if (newKey) {
            newProps[newKey] = props[key];
        }
    }
    return newProps;
}
function init(isTouchDevice, errFunc) {
    gIsTouch = isTouchDevice;
    gErrFunc = errFunc;
    var originalCreateElement = React.createElement;
    React.createElement = function (type, props) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        props = processTouchMouseProps(props, gIsTouch) || props;
        convertClasses(type, props);
        var elem = originalCreateElement.apply(this, [type, props].concat(args)); // tslint:disable-line:no-invalid-this
        return elem;
    };
}
exports.init = init;
