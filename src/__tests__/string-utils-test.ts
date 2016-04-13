/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

///<reference path='../type-defs/jasmine.d.ts'/>
///<reference path='../type-defs/jasmine-test-additions.d.ts'/>

import StringUtils = require('../string-utils');

describe('StringUtils', function() {
  describe('#indent', function() {
    it('provides a function that returns an function which adds two space ' +
       'indentation when called with 2', function() {
      const actualValues = ['abc', 'def'].map(StringUtils.indent(2));
      const expectedValues = ['  abc', '  def'];

      expect(actualValues).toEqualJSON(expectedValues);
    });

    it('provides a function that returns an function which adds two space ' +
       'indentation when called with 2 but not when the string is empty', function() {
      const actualValues = ['abc', ''].map(StringUtils.indent(2));
      const expectedValues = ['  abc', ''];

      expect(actualValues).toEqualJSON(expectedValues);
    });

    it('provides a function that returns an function which adds three spaces ' +
       'indentation when called with 3 but not when the string is empty', function() {
      const actualValues = ['abc', ''].map(StringUtils.indent(3));
      const expectedValues = ['   abc', ''];

      expect(actualValues).toEqualJSON(expectedValues);
    });
  });

  describe('#stringContainingSpaces', function() {
    it('returns a string containing a single space', function() {
      const value:string = StringUtils.stringContainingSpaces(1);
      expect(value).toEqualJSON(' ');
    });

    it('returns a string containing two spaces', function() {
      const value:string = StringUtils.stringContainingSpaces(2);
      expect(value).toEqualJSON('  ');
    });

    it('returns a string containing eleven space', function() {
      const value:string = StringUtils.stringContainingSpaces(11);
      expect(value).toEqualJSON('           ');
    });
  });

  describe('#stringRemovingCapitalizedPrefix', function() {
    it('returns the prefix from the type when it has a prefix with two capitals', function() {
      const strippedString:string = StringUtils.stringRemovingCapitalizedPrefix('RMTest');
      const expectedStrippedString:string = 'Test';
      expect(strippedString).toEqualJSON(expectedStrippedString);
    });

    it('returns the correct prefix from the type when it has a prefix with ' +
       'two different capitals', function() {
      const strippedString:string = StringUtils.stringRemovingCapitalizedPrefix('SMPage');
      const expectedStrippedString:string = 'Page';
      expect(strippedString).toEqualJSON(expectedStrippedString);
    });

    it('returns the prefix from the type when it has a prefix with ' +
       'three different capitals', function() {
      const strippedString:string = StringUtils.stringRemovingCapitalizedPrefix('FOOPage');
      const expectedStrippedString:string = 'Page';
      expect(strippedString).toEqualJSON(expectedStrippedString);
    });

    it('returns an empty prefix from the type when it has no prefix', function() {
      const strippedString:string = StringUtils.stringRemovingCapitalizedPrefix('Page');
      const expectedStrippedString:string = 'Page';
      expect(strippedString).toEqualJSON(expectedStrippedString);
    });
  });
});
