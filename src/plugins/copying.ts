/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import AlgebraicType = require('../algebraic-type');
import Code = require('../code');
import Error = require('../error');
import FileWriter = require('../file-writer');
import Maybe = require('../maybe');
import ObjC = require('../objc');
import ValueObject = require('../value-object');

function copyInstanceMethod():ObjC.Method {
  return {
    belongsToProtocol:Maybe.Just<string>('NSCopying'),
    code: ['return self;'],
    comments:[],
    keywords: [
      {
        name: 'copyWithZone',
        argument: Maybe.Just<ObjC.KeywordArgument>({
          name: 'zone',
          modifiers: [],
          type: {
            name: 'NSZone',
            reference: 'NSZone *'
          }
        })
      }
    ],
    returnType: Maybe.Just<ObjC.Type>({
      name: 'id',
      reference: 'id'
    })
  };
}

export function createPlugin():ValueObject.Plugin {
  return {
    additionalFiles: function(valueType:ValueObject.Type):Code.File[] {
      return [];
    },
    additionalTypes: function(valueType:ValueObject.Type):ValueObject.Type[] {
      return [];
    },
    attributes: function(valueType:ValueObject.Type):ValueObject.Attribute[] {
      return [];
    },
    fileTransformation: function(request:FileWriter.Request):FileWriter.Request {
      return request;
    },
    fileType: function(valueType:ValueObject.Type):Maybe.Maybe<Code.FileType> {
      return Maybe.Nothing<Code.FileType>();
    },
    forwardDeclarations: function(valueType:ValueObject.Type):ObjC.ForwardDeclaration[] {
      return [];
    },
    functions: function(valueType:ValueObject.Type):ObjC.Function[] {
      return [];
    },
    headerComments: function(valueType:ValueObject.Type):ObjC.Comment[] {
      return [];
    },
    implementedProtocols: function(valueType:ValueObject.Type):ObjC.Protocol[] {
      return [
        {
          name: 'NSCopying'
        }
      ];
    },
    imports: function(valueType:ValueObject.Type):ObjC.Import[] {
      return [];
    },
    instanceMethods: function(valueType:ValueObject.Type):ObjC.Method[] {
      return [copyInstanceMethod()];
    },
    properties: function(valueType:ValueObject.Type):ObjC.Property[] {
      return [];
    },
    requiredIncludesToRun:['RMCopying'],
    staticConstants: function(valueType:ValueObject.Type):ObjC.Constant[] {
      return [];
    },
    validationErrors: function(valueType:ValueObject.Type):Error.Error[] {
      return [];
    },
    nullability: function(valueType:ValueObject.Type):Maybe.Maybe<ObjC.ClassNullability> {
      return Maybe.Nothing<ObjC.ClassNullability>();
    }
  };
}

export function createAlgebraicTypePlugin():AlgebraicType.Plugin {
  return {
    additionalFiles: function(algebraicType:AlgebraicType.Type):Code.File[] {
      return [];
    },
    blockTypes: function(algebraicType:AlgebraicType.Type):ObjC.BlockType[] {
      return [];
    },
    classMethods: function(algebraicType:AlgebraicType.Type):ObjC.Method[] {
      return [];
    },
    enumerations: function(algebraicType:AlgebraicType.Type):ObjC.Enumeration[] {
      return [];
    },
    fileTransformation: function(request:FileWriter.Request):FileWriter.Request {
      return request;
    },
    fileType: function(algebraicType:AlgebraicType.Type):Maybe.Maybe<Code.FileType> {
      return Maybe.Nothing<Code.FileType>();
    },
    forwardDeclarations: function(algebraicType:AlgebraicType.Type):ObjC.ForwardDeclaration[] {
      return [];
    },
    functions: function(algebraicType:AlgebraicType.Type):ObjC.Function[] {
      return [];
    },
    headerComments: function(algebraicType:AlgebraicType.Type):ObjC.Comment[] {
      return [];
    },
    implementedProtocols: function(algebraicType:AlgebraicType.Type):ObjC.Protocol[] {
      return [
        {
          name: 'NSCopying'
        }
      ];
    },
    imports: function(algebraicType:AlgebraicType.Type):ObjC.Import[] {
      return [];
    },
    instanceMethods: function(algebraicType:AlgebraicType.Type):ObjC.Method[] {
      return [copyInstanceMethod()];
    },
    internalProperties: function(algebraicType:AlgebraicType.Type):ObjC.Property[] {
      return [];
    },
    requiredIncludesToRun: ['RMCopying'],
    staticConstants: function(algebraicType:AlgebraicType.Type):ObjC.Constant[] {
      return [];
    },
    validationErrors: function(algebraicType:AlgebraicType.Type):Error.Error[] {
      return [];
    },
    nullability: function(algebraicType:AlgebraicType.Type):Maybe.Maybe<ObjC.ClassNullability> {
      return Maybe.Nothing<ObjC.ClassNullability>();
    }
  };
}
