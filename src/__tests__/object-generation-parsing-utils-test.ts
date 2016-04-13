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

import Error = require('../error');
import Either = require('../either');
import Maybe = require('../maybe');
import ObjectGeneration = require('../object-generation');
import ObjectGenerationParsingUtils = require('../object-generation-parsing-utils');

describe('ObjectGenerationParsingUtils', function() {
  describe('#typeLookupsFromRawAnnotations', function() {
    it('creates a single type lookup when there is a single type annotation', function() {
      const typeLookups:Either.Either<Error.Error[], ObjectGeneration.TypeLookup[]> = ObjectGenerationParsingUtils.typeLookupsFromRawAnnotations({
        type: [
          {
            name: 'RMSomeType'
          }
        ]
      });
      const expectedTypeLookups = Either.Right<Error.Error[], ObjectGeneration.TypeLookup[]>([
        {
          name: 'RMSomeType',
          library: Maybe.Nothing<string>(),
          file: Maybe.Nothing<string>(),
          canForwardDeclare: true
        }
      ]);
      expect(typeLookups).toEqualJSON(expectedTypeLookups);
    });

    it('creates a single type lookup when there is a single type annotation with ' +
       'different information', function() {
      const typeLookups:Either.Either<Error.Error[], ObjectGeneration.TypeLookup[]> = ObjectGenerationParsingUtils.typeLookupsFromRawAnnotations({
        type: [
          {
            name: 'RMSomeOtherType'
          }
        ]
      });
      const expectedTypeLookups = Either.Right<Error.Error[], ObjectGeneration.TypeLookup[]>([
        {
          name: 'RMSomeOtherType',
          library: Maybe.Nothing<string>(),
          file: Maybe.Nothing<string>(),
          canForwardDeclare: true
        }
      ]);
      expect(typeLookups).toEqualJSON(expectedTypeLookups);
    });

    it('creates two type lookups when there are two type annotations with ' +
       'different information', function() {
      const typeLookups:Either.Either<Error.Error[], ObjectGeneration.TypeLookup[]> = ObjectGenerationParsingUtils.typeLookupsFromRawAnnotations({
        type: [
          {
            name: 'RMSomeType'
          },
          {
            name: 'RMSomeOtherType'
          }
        ]
      });
      const expectedTypeLookups = Either.Right<Error.Error[], ObjectGeneration.TypeLookup[]>([
        {
          name: 'RMSomeType',
          library: Maybe.Nothing<string>(),
          file: Maybe.Nothing<string>(),
          canForwardDeclare: true
        },
        {
          name: 'RMSomeOtherType',
          library: Maybe.Nothing<string>(),
          file: Maybe.Nothing<string>(),
          canForwardDeclare: true
        }
      ]);
      expect(typeLookups).toEqualJSON(expectedTypeLookups);
    });

    it('creates a full single type lookup when there is a single type annotation with ' +
       'all information', function() {
      const typeLookups:Either.Either<Error.Error[], ObjectGeneration.TypeLookup[]> = ObjectGenerationParsingUtils.typeLookupsFromRawAnnotations({
        type: [
          {
            name: 'RMSomeType',
            file: 'RMSomeFile',
            library: 'RMSomeLibrary',
            canForwardDeclare: 'false'
          }
        ]
      });
      const expectedTypeLookups = Either.Right<Error.Error[], ObjectGeneration.TypeLookup[]>([
        {
          name: 'RMSomeType',
          library: Maybe.Just<string>('RMSomeLibrary'),
          file: Maybe.Just<string>('RMSomeFile'),
          canForwardDeclare: false
        }
      ]);
      expect(typeLookups).toEqualJSON(expectedTypeLookups);
    });

    it('returns an error when the only type annotation does not have a name', function() {
      const typeLookups:Either.Either<Error.Error[], ObjectGeneration.TypeLookup[]> = ObjectGenerationParsingUtils.typeLookupsFromRawAnnotations({
        type: [
          {
          }
        ]
      });
      const expectedTypeLookups = Either.Left<Error.Error[], ObjectGeneration.TypeLookup[]>([Error.Error('Invalid type annotation')]);
      expect(typeLookups).toEqualJSON(expectedTypeLookups);
    });

    it('returns two errors when the two type annotations do not have names', function() {
      const typeLookups:Either.Either<Error.Error[], ObjectGeneration.TypeLookup[]> = ObjectGenerationParsingUtils.typeLookupsFromRawAnnotations({
        type: [
          {},
          {}
        ]
      });
      const expectedTypeLookups = Either.Left<Error.Error[], ObjectGeneration.TypeLookup[]>([
        Error.Error('Invalid type annotation'),
        Error.Error('Invalid type annotation')
      ]);
      expect(typeLookups).toEqualJSON(expectedTypeLookups);
    });
  });
});
