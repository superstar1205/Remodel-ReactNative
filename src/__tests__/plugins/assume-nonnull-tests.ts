/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

///<reference path='../../type-defs/jasmine.d.ts'/>
///<reference path='../../type-defs/jasmine-test-additions.d.ts'/>

import * as AlgebraicType from '../../algebraic-type';
import * as AssumeNonnull from '../../plugins/assume-nonnull';
import * as FileWriter from '../../file-writer';
import * as Maybe from '../../maybe';
import * as ObjC from '../../objc';
import * as ObjectSpec from '../../object-spec';

const ObjectSpecPlugin = AssumeNonnull.createPlugin();
const AlgebraicTypePlugin = AssumeNonnull.createAlgebraicTypePlugin();

describe('ObjectSpecPlugins.AssumeNonnull', function () {
  describe('#imports', function () {
    it('Foundation was found', function () {
      const objectType: ObjectSpec.Type = {
        annotations: {},
        attributes: [],
        comments: [],
        typeLookups: [],
        excludes: [],
        includes: ['AssumeNonnull'],
        libraryName: null,
        typeName: 'Foo',
      };

      const imports: ObjC.Import[] = ObjectSpecPlugin.imports(objectType);
      const expectedImports: ObjC.Import[] = [
        {
          file: 'Foundation.h',
          isPublic: true,
          library: 'Foundation',
          requiresCPlusPlus: false,
        },
      ];
      expect(imports).toEqualJSON(expectedImports);
    });
  });

  describe('#nullability', function () {
    it('AssumeNonnull macro was found', function () {
      const objectType: ObjectSpec.Type = {
        annotations: {},
        attributes: [],
        comments: [],
        typeLookups: [],
        excludes: [],
        includes: ['AssumeNonnull'],
        libraryName: null,
        typeName: 'Foo',
      };

      const nullability = ObjectSpecPlugin.nullability(objectType);
      const expectedNullability = ObjC.ClassNullability.assumeNonnull;
      expect(nullability).toEqualJSON(expectedNullability);
    });
  });
});

describe('AlgebraicTypePlugins.AssumeNonnull', function () {
  describe('#imports', function () {
    it('Foundation was found', function () {
      const algebraicType: AlgebraicType.Type = {
        annotations: {},
        name: 'Foo',
        includes: ['AssumeNonnull'],
        typeLookups: [],
        excludes: [],
        libraryName: null,
        comments: [],
        subtypes: [],
      };

      const imports: ObjC.Import[] = AlgebraicTypePlugin.imports(algebraicType);
      const expectedImports: ObjC.Import[] = [
        {
          file: 'Foundation.h',
          isPublic: true,
          library: 'Foundation',
          requiresCPlusPlus: false,
        },
      ];
      expect(imports).toEqualJSON(expectedImports);
    });
  });

  describe('#nullability', function () {
    it('AssumeNonnull macro was found', function () {
      const algebraicType: AlgebraicType.Type = {
        annotations: {},
        name: 'Foo',
        includes: ['AssumeNonnull'],
        typeLookups: [],
        excludes: [],
        libraryName: null,
        comments: [],
        subtypes: [],
      };

      const nullability = AlgebraicTypePlugin.nullability(algebraicType);
      const expectedNullability = ObjC.ClassNullability.assumeNonnull;
      expect(nullability).toEqualJSON(expectedNullability);
    });
  });
});
