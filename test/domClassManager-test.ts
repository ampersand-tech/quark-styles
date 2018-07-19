/**
* Copyright 2017-present Ampersand Technologies, Inc.
*/

// mock out window
(global as any).window = {};

import { init, validateClassesString } from '../lib/index';

import { expect } from 'chai';

describe('validateClassesString', function() {
  before(function() {
    init(false, (err) => {
      throw err;
    });
  });
  it('should accurately validate classes strings', function() {
    expect(validateClassesString('fw-700 b-1 fs-12 m-10')).to.equal(null);
    expect(validateClassesString('fw-700 b-1 sf-12 m-10')).to.equal('No matching class definition or rule for className sf-12');
    expect(validateClassesString('fw-700 b-1 sf-12 m-10')).to.equal('No matching class definition or rule for className sf-12');
    expect(validateClassesString('')).to.equal(null);
    expect(validateClassesString('c-pork-bg')).to.equal('invalid color specified in quarkStyle, see colorConstants pork');
    expect(validateClassesString('c-#FF0000-bg')).to.equal(null);
  });
});
