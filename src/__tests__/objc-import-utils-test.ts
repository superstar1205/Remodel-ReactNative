/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

///<reference path='../type-defs/jasmine.d.ts'/>
///<reference path='../type-defs/jasmine-test-additions.d.ts'/>

import * as Maybe from '../maybe';
import * as ObjC from '../objc';
import * as ObjCImportUtils from '../objc-import-utils';
import * as ObjectGeneration from '../object-generation';
import * as ObjectSpec from '../object-spec';

describe('ObjCImportUtils', function() {
  describe('#importForTypeLookup', function() {
    it('creates an import', function() {
      const typeLookup: ObjectGeneration.TypeLookup = {
        name: 'RMSomeType',
        library: Maybe.Nothing<string>(),
        file: Maybe.Just<string>('RMSomeFile'),
        canForwardDeclare: true,
      };

      const importValue: ObjC.Import = ObjCImportUtils.importForTypeLookup(
        Maybe.Nothing<string>(),
        true,
        typeLookup,
      );

      const expectedImport: ObjC.Import = {
        file: 'RMSomeFile.h',
        isPublic: true,
        library: Maybe.Nothing<string>(),
      };

      expect(importValue).toEqualJSON(expectedImport);
    });

    it('creates a different import', function() {
      const typeLookup: ObjectGeneration.TypeLookup = {
        name: 'RMSomeType',
        library: Maybe.Nothing<string>(),
        file: Maybe.Nothing<string>(),
        canForwardDeclare: true,
      };

      const importValue: ObjC.Import = ObjCImportUtils.importForTypeLookup(
        Maybe.Nothing<string>(),
        false,
        typeLookup,
      );

      const expectedImport: ObjC.Import = {
        file: 'RMSomeType.h',
        isPublic: false,
        library: Maybe.Nothing<string>(),
      };

      expect(importValue).toEqualJSON(expectedImport);
    });

    it('creates an import containing a library', function() {
      const typeLookup: ObjectGeneration.TypeLookup = {
        name: 'RMSomeOtherType',
        library: Maybe.Just<string>('RMSomeLibrary'),
        file: Maybe.Nothing<string>(),
        canForwardDeclare: true,
      };

      const importValue: ObjC.Import = ObjCImportUtils.importForTypeLookup(
        Maybe.Nothing<string>(),
        true,
        typeLookup,
      );

      const expectedImport: ObjC.Import = {
        file: 'RMSomeOtherType.h',
        isPublic: true,
        library: Maybe.Just<string>('RMSomeLibrary'),
      };

      expect(importValue).toEqualJSON(expectedImport);
    });

    it(
      'creates an import containing the default library when it is provided ' +
        'and the type lookup does not contain a library',
      function() {
        const typeLookup: ObjectGeneration.TypeLookup = {
          name: 'RMSomeOtherType',
          library: Maybe.Nothing<string>(),
          file: Maybe.Nothing<string>(),
          canForwardDeclare: true,
        };

        const importValue: ObjC.Import = ObjCImportUtils.importForTypeLookup(
          Maybe.Just<string>('DefaultLibrary'),
          true,
          typeLookup,
        );

        const expectedImport: ObjC.Import = {
          file: 'RMSomeOtherType.h',
          isPublic: true,
          library: Maybe.Just<string>('DefaultLibrary'),
        };

        expect(importValue).toEqualJSON(expectedImport);
      },
    );
  });

  describe('#shouldForwardProtocolDeclareAttribute', function() {
    it('should return false for the empty protocol', function() {
      const attributeType: ObjectSpec.AttributeType = {
        fileTypeIsDefinedIn: Maybe.Nothing<string>(),
        libraryTypeIsDefinedIn: Maybe.Nothing<string>(),
        name: 'NSArray',
        reference: 'NSArray*',
        underlyingType: Maybe.Just<string>('NSObject'),
        conformingProtocol: Maybe.Just<string>(''),
      };
      const attribute: ObjectSpec.Attribute = {
        annotations: {},
        comments: [],
        name: 'someArray',
        nullability: ObjC.Nullability.Inherited(),
        type: attributeType,
      };

      const shouldDeclare: boolean = ObjCImportUtils.shouldForwardProtocolDeclareAttribute(
        attribute,
      );
      expect(shouldDeclare).toEqual(false);
    });
  });
});
