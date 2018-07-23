/**
* Copyright 2015-present Ampersand Technologies, Inc.
*/

import * as stringify from 'json-stable-stringify';
import * as React from 'react';
import * as deepForceUpdate from 'react-deep-force-update';

// these are here so this file can be moved out of the Ampersand ecosystem
export type StashOf<T> = {[k: string]: T};
export type Stash = StashOf<any>;


let gErrFunc: undefined | ((err: string, details: any) => void);

function logError(err: string, details: any): void {
  if (gErrFunc) {
    gErrFunc(err, details);
  } else {
    console.error(err, details); // @allowConsoleFuncs
  }
}


//TODO: clarify what Style maps to... looks like string, or object with rgbaString, or a whole nother Style object.
declare type Style = StashOf<any>;

type StyleGenerator = (match: string|RegExpMatchArray, style: Style, errs: ErrorWithDetails[]) => void;
type StyleGeneratorWithString = (match: string, style: Style, errs: ErrorWithDetails[]) => void;
type StyleGeneratorWithRegEx = (match: RegExpMatchArray, style: Style, errs: ErrorWithDetails[]) => void;

interface Rule {
  regex: RegExp;
  classStyles: Style|StyleGenerator;
}


const MOBILE_DISALLOWED_PSEUDO_SELECTORS = {
  hover: true,
};

const CLASS_ALLOWED_PSUEDO_SELECTORS = {
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

const PSEUDO_SELECTOR_PRIORITY: StashOf<number> = {};

const EARLY_CLASSES_VALIDATION = process.env.NODE_ENV === 'development';

const INVALID_STRINGS = [
  'undefined',
  'null',
  'NaN',
  'Infinity',
  '[object Object]',
];


// externally set data:
const gPageReactRoots: React.Component<any, any>[] = [];
const gUiClassDefs: StashOf<Style|StyleGenerator> = {};
const gUiStyleRules: Rule[] = [];

// internally set data:

export interface ErrorWithDetails {
  err: string;
  details: any;
}

interface ParsedClass {
  style: Style;
  className: string;
  errors: ErrorWithDetails[];
}


let gParseClassesCache: StashOf<ParsedClass> = {}; // caches the parsing of the "classes" property on react elements

const gDomClassCache: StashOf<string> = {}; // caches the conversion from a style object (plus pseudoselectors) to a class name in the stylesheet
let gDomClassCounter = 0; // a counter used to generate DOM class names for the stylesheet
let gStyleSheet; // the DOM element for the stylesheet
const gStyleSheetContents: string[] = ['']; // the text contents of the stylesheet, per priority

const gGlobalClasses: StashOf<StashOf<string>> = {};

let gUpdateTimer: NodeJS.Timer | number | null = null; // used to buffer updates to the DOM stylesheet

let gIsTouch = false;

let gPriorityCounter: number = 1;
const addSelectorPriority = (...args: string[]): void => {
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


function pseudoSelectorsToString(pseudoSelectors: string[]): string {
  const selectors: string[] = [];
  const usedSelectors: StashOf<boolean> = {};

  let notDisabled: boolean = false;
  let hasDisabled: boolean = false;
  let hasSet: boolean = false;
  const parentSelectors: string[] = [];

  for (let i = 0; i < pseudoSelectors.length; ++i) {
    const selector = pseudoSelectors[i];

    if (usedSelectors[selector]) {
      // ignore duplicates
      continue;
    }
    usedSelectors[selector] = true;

    if (selector === 'active' || selector === 'hover' || selector === 'focus') {
      notDisabled = true;
      selectors.push(selector);
    } else if (selector === 'disabled') {
      hasDisabled = true;
    } else if (selector === 'set') {
      hasSet = true;
    } else if (selector === 'parentSet') {
      notDisabled = true;
      parentSelectors.push('.dcmIsSet:not(.dcmDisabled)');
    } else if (selector === 'parentHover') {
      notDisabled = true;
      parentSelectors.push(':hover');
    } else if (selector === 'parentActive') {
      notDisabled = true;
      parentSelectors.push(':active');
    } else {
      selectors.push(selector);
    }
  }

  let selectorString: string = '';

  if (selectors.length) {
    selectorString = ':' + selectors.sort().join(':');
  } else {
    selectorString = '';
  }

  if (hasSet) {
    selectorString = '.dcmIsSet' + selectorString;
  }

  if (hasDisabled) {
    // translate fake :disabled pseudoselector to the actual .dcmDisabled class
    selectorString = '.dcmDisabled' + selectorString;
  } else if (notDisabled) {
    // only apply hover/active/focus styles if not disabled
    selectorString += ':not(.dcmDisabled)';
  }

  if (parentSelectors.length) {
    // translate the fake :parentHover pseudoselector to the .dcmSelectorParent descendant selector
    selectorString = '.dcmSelectorParent' + parentSelectors.sort().join('') + ' ' + selectorString;
  }

  return selectorString;
}

function pseudoSelectorsAllowed(pseudoSelectors: string[]): boolean {
  if (!gIsTouch) {
    return true;
  }
  for (let i = 0; i < pseudoSelectors.length; i++) {
    const sel = pseudoSelectors[i];
    if (sel in MOBILE_DISALLOWED_PSEUDO_SELECTORS) {
      return false;
    }
  }
  return true;
}

function verifyStyles(className: string, style: Style, debugName: string|null, errors: ErrorWithDetails[]) {
  for (let key in style) {
    let value = style[key];
    if (CLASS_ALLOWED_PSUEDO_SELECTORS[key]) {
      verifyStyles(className, value, debugName, errors);
    } else {
      // value is of type color
      if (value && value.rgb) {
        value = style[key] = value.rgb().string();
      }
      if (typeof value !== 'string' || value === 'undefined' || value === 'null') {
        errors.push({
          err: 'Invalid style value for key in class (type not string or null/undefined)',
          details: {key: key, className: className, valueType: (typeof value), value: value, debugName: debugName},
        });
      }
    }
  }

  if (style.color && !style.fill) {
    style.fill = style.color;
  }
}

function applyStyle(
  debugName: string|null,
  className: string,
  classNameOrMatch: string|RegExpMatchArray,
  style: Style,
  classStyles: Style|StyleGenerator,
  selectorStyles: Style,
  pseudoSelectors: string[],
  classNameSelectors,
  errors: ErrorWithDetails[],
) {
  if (pseudoSelectors && pseudoSelectors.length) {
    if (!pseudoSelectorsAllowed(pseudoSelectors)) {
      return;
    }
    let selectorStr = pseudoSelectorsToString(pseudoSelectors);
    selectorStyles[selectorStr] = selectorStyles[selectorStr] || {};
    style = selectorStyles[selectorStr];
  }

  if (typeof classStyles === 'function') {
    classStyles(classNameOrMatch, style, errors);
    verifyStyles(className, style, debugName, errors);
    return;
  }

  let foundClassNameSelector = false;

  for (let key in classStyles) {
    if (CLASS_ALLOWED_PSUEDO_SELECTORS[key]) {
      if (!classNameSelectors || classNameSelectors[0] === key) {
        let subSelectors, subClassNameSelectors;
        if (classNameSelectors) {
          subClassNameSelectors = classNameSelectors.slice(1);
          foundClassNameSelector = true;
        } else {
          subSelectors = (pseudoSelectors || []).slice();
          subSelectors.push(key);
        }

        // recurse into pseudoselector object
        applyStyle(debugName, className, classNameOrMatch, style, classStyles[key], selectorStyles, subSelectors, subClassNameSelectors, errors);
      }
    } else {
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

function classToStyle(
  debugName: string|null,
  className: string,
  style: Style,
  selectorStyles: Style,
  pseudoSelectors: string[],
  classesString: string,
  errors: ErrorWithDetails[],
) {
  if (!className) {
    return;
  }

  const foundMatches: (RegExpMatchArray|string)[] = [];

  let classNameSelectors: string[] = className.split('.');
  const bareClassName: string = classNameSelectors.shift() || '';
  if (gUiClassDefs.hasOwnProperty(bareClassName)) {
    foundMatches.push(bareClassName);


    applyStyle(
      debugName,
      bareClassName,
      className,
      style,
      gUiClassDefs[bareClassName],
      selectorStyles,
      pseudoSelectors,
      // if className is a path (ie "uiButtonColor.hover") then we don't want to apply the class's selectors
      classNameSelectors.length ? classNameSelectors : null,
      errors);

  } else {
    for (let i = 0; i < gUiStyleRules.length; ++i) {
      const rule = gUiStyleRules[i];
      const m = className.match(rule.regex);
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
  } else if (foundMatches.length > 1) {
    errors.push({
      err: 'More than one matching class definition or rule for class',
      details: {className: className, debugName: debugName, foundMatches: foundMatches.join(', ')},
    });
  }
}

function triggerStyleSheetUpdate() {
  if (gUpdateTimer) {
    return;
  }

  gUpdateTimer = setTimeout(function() {
    gUpdateTimer = null;
    if (!gStyleSheet) {
      try {
        gStyleSheet = document.getElementById('domClassManagerStyles');
      } catch (_ex) {
      }
    }
    if (gStyleSheet) {
      gStyleSheet.innerHTML = gStyleSheetContents.join('');
    }
  }, 0);
}

function styleNameToCssName(name: string): string {
  // this is probably slow
  let cssName: string = '';
  for (let i = 0; i < name.length; ++i) {
    const ch = name[i].toLowerCase();
    if (ch !== name[i]) {
      cssName += '-';
    }
    cssName += ch;
  }
  return cssName;
}

function attachSelectors(className: string, pseudoSelectors: string) {
  if (!pseudoSelectors) {
    return '.' + className;
  }

  const splitSelectors = pseudoSelectors.split(' ');
  splitSelectors[splitSelectors.length - 1] = '.' + className + splitSelectors[splitSelectors.length - 1];
  return splitSelectors.join(' ');
}

function generateGlobalClassForStyles(globalClassName: string|null, pseudoSelectors: string, styles: StashOf<string>) {
  if (!globalClassName) {
    // use cache
    const key = pseudoSelectors + stringify(styles);
    if (gDomClassCache[key]) {
      return gDomClassCache[key];
    }

    globalClassName = 'SelectorClass' + (gDomClassCounter++);
    gDomClassCache[key] = globalClassName;
  }

  const styleLines: string[] = [];
  for (let styleName in styles) {
    const cssName = styleNameToCssName(styleName);
    let styleVal = styles[styleName];
    if (styleName === 'content' && typeof styleVal === 'string') {
      styleVal = '\'' + styleVal + '\'';
    }
    styleLines.push('  ' + cssName + ': ' + styleVal + ' !important;');
  }
  styleLines.sort();

  const priority = PSEUDO_SELECTOR_PRIORITY[pseudoSelectors] || 0;
  gStyleSheetContents[priority] += attachSelectors(globalClassName, pseudoSelectors) + ' {\n' + styleLines.join('\n') + '\n}\n';
  triggerStyleSheetUpdate();

  gGlobalClasses[attachSelectors(globalClassName, pseudoSelectors)] = styles;

  return globalClassName;
}

export function combineClasses(...args: (string|null|undefined)[]): string {
  let res = '';
  for (let i = 0; i < args.length; ++i) {
    let arg = args[i];
    if (arg) {
      res += ' ' + arg.trim();
    }
  }
  return res;
}

interface Aggregrated {
  name: string;
  pseudoSelectors: string[];
}

// recursive descent parser for classes strings
function parseClassFromString(
  debugName: string|null,
  str: string,
  pseudoSelectors: string[],
  aggregator: Aggregrated[],
  errors: ErrorWithDetails[],
): string|null {
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

  const m = str.match(/^([^ :()]+)(.*)$/);
  if (!m) {
    errors.push({
      err: 'Error parsing classes string',
      details: { str: str, debugName: debugName },
    });
    return null;
  }

  const name = m[1];
  str = m[2];

  if (str[0] === ':') {
    if (!name.match(/^[-_a-zA-Z0-9]+$/)) {
      errors.push({
        err: `Error parsing: "${name}". Not a pseudo-selector`,
        details: { str: name, debugName: debugName },
      });
      return null;
    }
    // parsed name is actually a pseudo selector
    const childSelectors = pseudoSelectors.slice();
    childSelectors.push(name);
    return parseClassFromString(debugName, str.slice(1), childSelectors, aggregator, errors);
  }

  aggregator.push({
    name: name,
    pseudoSelectors: pseudoSelectors,
  });

  return str;
}
function parseClassesInternal(
  globalClassName: string|null,
  classesString: string,
  debugName: string|null,
): ParsedClass {
  // parse classes string
  const parsedClasses: Aggregrated[] = [];
  const errors: ErrorWithDetails[] = [];

  const remainder = parseClassFromString(debugName, '(' + classesString.trim() + ')', [], parsedClasses, errors);
  if (remainder) {
    errors.push({
      err: 'Failed to parse classes string, left with remainder',
      details: {classes: classesString, remainder: remainder, debugName: debugName},
    });
  }

  const styles: Style = {};
  const selectorStyles: Style = {};

  // convert classesString to styles
  for (let i = 0; i < parsedClasses.length; ++i) {
    const parsed: Aggregrated = parsedClasses[i];
    classToStyle(debugName, parsed.name, styles, selectorStyles, parsed.pseudoSelectors, classesString, errors);
  }

  if (globalClassName) {
    // create global class for styles without pseudo-selectors
    generateGlobalClassForStyles(globalClassName, '', styles);
  }

  // create/lookup global classes for styles with pseudo-selectors
  let className: string = '';
  for (let selectorStr in selectorStyles) {
    className = combineClasses(className, generateGlobalClassForStyles(globalClassName, selectorStr, selectorStyles[selectorStr]));
  }

  return {
    style: styles,
    className,
    errors,
  };
}

function parseWithCache(classesString: string, debugName: string|null): ParsedClass {
  // check the cache
  if (gParseClassesCache[classesString]) {
    return gParseClassesCache[classesString];
  }

  const parsed: ParsedClass = parseClassesInternal(null, classesString, debugName);

  // cache it
  gParseClassesCache[classesString] = parsed;
  return gParseClassesCache[classesString];
}

// Returns error string if error, otherwise null if good
export function validateClassesString(classesString: string): string|null {
  const parsed = parseWithCache(classesString, null);
  for (const err of parsed.errors) {
    let errStr = err.err;
    if (err.details) {
      if (typeof err.details === 'string') {
        errStr += ' ' + err.details;
      } else if (err.details.className) {
        errStr += ' ' + err.details.className;
      }
    }
    return errStr;
  }
  return null;
}

function parseClasses(classesString: string, debugName: string|null): ParsedClass {
  const parsed = parseWithCache(classesString, debugName);
  for (const err of parsed.errors) {
    logError(err.err, err.details);
  }
  return parsed;
}

export function classesToStyle(classes: string): ParsedClass {
  return parseClasses(classes, null);
}

export function classesToSimpleStyle(classes: string): { style: Style, errs: string[] } {
  const parsed: ParsedClass = parseClassesInternal(null, classes, null);

  const errs: string[] = [];
  for (const err of parsed.errors) {
    let errStr = err.err;
    if (err.details) {
      errStr += ' ' + err.details;
    }
    errs.push(errStr);
  }

  return {
    style: parsed.style,
    errs,
  };
}

export function applyGlobalClassStyles(styles: StashOf<string>, globalClassName: string, pseudoSelectors: string[]) {
  const selectorStr = pseudoSelectorsToString(pseudoSelectors);
  const globalStyles = gGlobalClasses[attachSelectors(globalClassName, selectorStr)];
  if (!globalStyles) {
    return styles;
  }
  return Object.assign(Object.assign({}, styles), globalStyles);
}

export function makeGlobalClass(globalClassName: string, classesString: string): void {
  const parsed = parseClassesInternal(globalClassName, classesString, globalClassName);
  for (const err of parsed.errors) {
    logError(err.err, err.details);
  }
}

export function convertClasses(type, props) {
  // do early classes string validation on all elements to catch the topmost offender
  if (EARLY_CLASSES_VALIDATION && props && typeof props.classes === 'string') {
    for (let i = 0; i < INVALID_STRINGS.length; ++i) {
      if (props.classes.indexOf(INVALID_STRINGS[i]) >= 0) {
        const errKey = 'classes string contains invalid substring "' + INVALID_STRINGS[i] + '"';
        logError(errKey, { debugName: type, classes: props.classes });
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
    let style: Stash = (props.style && typeof props.style === 'object') ? props.style : undefined;
    if (style) {
      style = Object.assign({}, style);
    }
    if (props.classes) {
      const parsed = parseClasses(props.classes, type.name || type);
      if (style) {
        // merge inline styles and class styles
        style = Object.assign(Object.assign({}, parsed.style), style);
      } else {
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

export function resetCache() {
  gParseClassesCache = {};
  for (const inst of gPageReactRoots) {
    deepForceUpdate(inst);
  }
}

export class SemanticColorRoot<Props = {}> extends React.Component<Props, {}> {
  componentWillMount() {
    gPageReactRoots.push(this);
  }

  componentWillUnmount() {
    const idx = gPageReactRoots.indexOf(this);
    if (idx >= 0) {
      gPageReactRoots.splice(idx, 1);
    }
  }

  render() {
    return this.props.children;
  }
}

export function startModule(theModule) {
  const classModule = new ClassModule();

  // setup for hot reloading
  if (theModule.hot) {
    theModule.hot.accept();
    theModule.hot.dispose(classModule.dispose.bind(classModule));
  }

  return classModule;
}

class ClassModule {
  private reactRules: Rule[] = [];
  private reactClasses: string[] = [];

  addClass:
    ((className: string, classStyles: Style|StyleGeneratorWithString) => void) &
    ((classRegex: RegExp, classStyles: Style|StyleGeneratorWithRegEx) => void)
   = (classNameOrRegex: string|RegExp, classStyles: Style|StyleGenerator): void => {
    if (!classStyles) {
      logError('No classStyles passed in for class', classNameOrRegex);
      return;
    }
    if (classNameOrRegex instanceof RegExp) {
      const classRule: Rule = {
        regex: classNameOrRegex,
        classStyles: classStyles,
      };
      gUiStyleRules.push(classRule);
      this.reactRules.push(classRule);
      return;
    }

    if (gUiClassDefs.hasOwnProperty(classNameOrRegex)) {
      logError('Duplicate definition for class', classNameOrRegex);
      return;
    }

    const errors: ErrorWithDetails[] = [];
    verifyStyles(classNameOrRegex, classStyles, null, errors);
    for (const err of errors) {
      logError(err.err, err.details);
    }
    gUiClassDefs[classNameOrRegex] = classStyles;
    this.reactClasses.push(classNameOrRegex);
  }

  dispose = (): void => {
    // remove rules and classes defined by this module

    for (const rule of this.reactRules) {
      const idx = gUiStyleRules.indexOf(rule);
      if (idx >= 0) {
        gUiStyleRules.splice(idx, 1);
      }
    }

    for (const className of this.reactClasses) {
      delete gUiClassDefs[className];
    }

    this.reactRules = [];
    this.reactClasses = [];

    setTimeout(resetCache, 20);
  }
}

function processTouchMouseProps(props: Stash | undefined | null, isTouch: boolean) {
  if (!props) {
    return null;
  }
  if (!props.onTouchOrMouseStart && !props.onTouchOrMouseMove && !props.onTouchOrMouseEnd && !props.onTouchMouseClick) {
    return null;
  }

  const newProps: Stash = {};
  for (const key in props) {
    let newKey: string|null = key;
    if (key === 'onTouchOrMouseStart') {
      newKey = isTouch ? 'onTouchStart' : 'onMouseDown';
    } else if (key === 'onTouchOrMouseMove') {
      newKey = isTouch ? 'onTouchMove' : 'onMouseMove';
    } else if (key === 'onTouchOrMouseEnd') {
      newKey = isTouch ? 'onTouchEnd' : 'onMouseUp';
    } else if (key === 'onTouchMouseClick') {
      newKey = isTouch ? 'onClick' : null;
    }

    if (newKey) {
      newProps[newKey] = props[key];
    }
  }

  return newProps;
}

export function init(isTouchDevice: boolean, errFunc?: (err: string, details: any) => void) {
  gIsTouch = isTouchDevice;
  gErrFunc = errFunc;

  const originalCreateElement = React.createElement;
  (React as Stash).createElement = function(type, props, ...args) {
    props = processTouchMouseProps(props, gIsTouch) || props;
    convertClasses(type, props);
    const elem = originalCreateElement.apply(this, [type, props].concat(args)); // tslint:disable-line:no-invalid-this
    return elem;
  };
}
