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

function assumeNonnullFileTransformation(request:FileWriter.Request):FileWriter.Request {
  var contentLines = request.content.split('\n');
  var classBeginLineNum = -1, classEndLineNum = -1;
  for (var i = 0; i < contentLines.length; i++) {
    if (contentLines[i].match(/^@(interface|implementation)/)) {
      classBeginLineNum = i;
      break;
    }
  }
  for (var i = contentLines.length - 1; i >= 0; i--) {
    if (contentLines[i].match(/^@end/)) {
      classEndLineNum = i;
      break;
    }
  }
  if (classBeginLineNum == -1 || classEndLineNum == -1) {
    return request;
  }
  contentLines =
    contentLines.slice(0, classBeginLineNum)
    .concat(['NS_ASSUME_NONNULL_BEGIN', ''])
    .concat(contentLines.slice(classBeginLineNum, classEndLineNum + 1))
    .concat(['', 'NS_ASSUME_NONNULL_END'])
    .concat(contentLines.slice(classEndLineNum + 1));
  return FileWriter.Request(request.path, contentLines.join('\n'));
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
      return assumeNonnullFileTransformation(request);
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
      return [];
    },
    imports: function(valueType:ValueObject.Type):ObjC.Import[] {
      return [
        { file: 'Foundation.h', isPublic: true, library: Maybe.Just('Foundation') },
      ];
    },
    instanceMethods: function(valueType:ValueObject.Type):ObjC.Method[] {
      return [];
    },
    properties: function(valueType:ValueObject.Type):ObjC.Property[] {
      return [];
    },
    requiredIncludesToRun:['RMAssumeNonnull'],
    staticConstants: function(valueType:ValueObject.Type):ObjC.Constant[] {
      return [];
    },
    validationErrors: function(valueType:ValueObject.Type):Error.Error[] {
      return [];
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
      return assumeNonnullFileTransformation(request);
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
      return [];
    },
    imports: function(algebraicType:AlgebraicType.Type):ObjC.Import[] {
      return [
        { file: 'Foundation.h', isPublic: true, library: Maybe.Just('Foundation') },
      ];
    },
    instanceMethods: function(algebraicType:AlgebraicType.Type):ObjC.Method[] {
      return [];
    },
    internalProperties: function(algebraicType:AlgebraicType.Type):ObjC.Property[] {
      return [];
    },
    requiredIncludesToRun: ['RMAssumeNonnull'],
    staticConstants: function(algebraicType:AlgebraicType.Type):ObjC.Constant[] {
      return [];
    },
    validationErrors: function(algebraicType:AlgebraicType.Type):Error.Error[] {
      return [];
    }
  };
}