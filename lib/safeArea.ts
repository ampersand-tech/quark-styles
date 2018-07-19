/**
* Copyright 2018-present Ampersand Technologies, Inc.
*
* @allowConsoleFuncs
*/

interface SafeAreaInfo {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

function computeSafeAreaSize() {
  /*
   * Apple defines a "safe area" of the screen for the iPhone X.  The area outside the safe area may be partially
   * occluded by "the notch" or the home indicator.
   *
   * Apple provides CSS rules for sensing the safe area, but there is no way to sense them from JS.
   * We need to hack.
   */
  let top = 0;
  let bottom = 0;
  let left = 0;
  let right = 0;

  if (!window) {
    console.log('safe area: no window found');
    return {top, left, right, bottom};
  }

  // Check for our script injection of safe area sizes that do not need to be measured
  if ((window as any).safeAreaSize as SafeAreaInfo) {
    console.log('safe area: already found injected values: ', (window as any).safeAreaSize);
    return (window as any).safeAreaSize;
  }

  // If dev mode and iPhoneX dimensions, fake the safe-area-inset stuff
  if (process && process.env && process.env.NODE_ENV === 'development' && window.innerHeight === 812 && window.innerWidth === 375) {
    // iPhoneX values
    console.log('safe area: faking iphoneX for dev mode:');
    return {top: 44, left, right, bottom: 34};
  }

  let cssPrefix: string;

  if (window['CSS']) {
    if (window['CSS'].supports('padding-left: env(safe-area-inset-left)')) {
      cssPrefix = 'env';
    } else if (window['CSS'].supports('padding-left: constant(safe-area-inset-left)')) {
      cssPrefix = 'constant';
    } else {
      console.log('no safe area env/constant variable support');
      return {top, left, right, bottom};
    }
  } else {
    console.log('no safe area window css supporting info');
    return {top, left, right, bottom};
  }

  const tempDiv = document.createElement('div');
  tempDiv.id = 'safeAreaArea';
  tempDiv.style.paddingLeft = cssPrefix + '(safe-area-inset-left)';
  tempDiv.style.paddingRight = cssPrefix + '(safe-area-inset-right)';
  tempDiv.style.paddingTop = cssPrefix + '(safe-area-inset-top)';
  tempDiv.style.paddingBottom = cssPrefix + '(safe-area-inset-bottom)';

  document.body.appendChild(tempDiv);

  const style = window.getComputedStyle(tempDiv);

  left = parseInt(style.paddingLeft!);
  right = parseInt(style.paddingRight!);
  top = parseInt(style.paddingTop!);
  bottom = parseInt(style.paddingBottom!);

  document.body.removeChild(tempDiv);

  console.log('safe areas:', {top, left, right, bottom});

  return {top, left, right, bottom};
}

export let safeAreaSize: SafeAreaInfo = {top: 0, left: 0, right: 0, bottom: 0};
if ((window as any).safeAreaSize) {
  console.log('Got injected safe area size: ' + (window as any).safeAreaSize);
  safeAreaSize = (window as any).safeAreaSize;
}
let safeAreaCalculated = false;
let safeAreaCbs: (() => void)[] = [];

export function initSafeArea() {
  safeAreaSize = computeSafeAreaSize();
  safeAreaCalculated = true;
  for (const cb of safeAreaCbs) {
    cb();
  }
  safeAreaCbs = [];
}

export function registerSafeAreaDependent(cb: () => void) {
  if (safeAreaCalculated) {
    cb();
  } else {
    safeAreaCbs.push(cb);
  }
}
