/**
* Copyright 2017-present Ampersand Technologies, Inc.
*/

// mock out window and document
(global as any).window = {};
(global as any).document = {
  getElementById: () => {
    return {};
  },
};

import { classesToStyle, init, validateClassesString } from '../lib/index';

import { expect } from 'chai';

describe('test', function() {
  before(function() {
    init(false, (err) => {
      throw err;
    });
  });
  describe('validateClassesString', function() {
    it('should accurately validate classes strings', function() {
      expect(validateClassesString('fw-700 b-1 fs-12 m-10')).to.equal(null);
      expect(validateClassesString('fw-700 b-1 sf-12 m-10')).to.equal('No matching class definition or rule for className sf-12');
      expect(validateClassesString('fw-700 b-1 sf-12 m-10')).to.equal('No matching class definition or rule for className sf-12');
      expect(validateClassesString('')).to.equal(null);
      expect(validateClassesString('c-pork-bg')).to.equal('invalid color specified in quarkStyle, see colorConstants pork');
      expect(validateClassesString('c-#FF0000-bg')).to.equal(null);
    });
  });

  describe('classesToStyle', function() {
    it('should convert quark styles', function() {
      expect(classesToStyle('c-#ff0000-bg')).to.deep.equal({
        className: '',
        errors: [],
        style: {
          backgroundColor: 'rgb(255, 0, 0)',
        },
      });
      expect(classesToStyle('c-#ff0000-bg hover:c-#00ff00-bg')).to.deep.equal({
        className: ' SelectorClass0',
        errors: [],
        style: {
          backgroundColor: 'rgb(255, 0, 0)',
        },
      });
      // TODO check what is in SelectorClass0
    });
  });
});
