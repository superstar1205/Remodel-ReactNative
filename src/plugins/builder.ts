/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import Code = require('../code');
import Error = require('../error');
import FileWriter = require('../file-writer');
import FunctionUtils = require('../function-utils');
import Maybe = require('../maybe');
import ObjC = require('../objc');
import ObjCImportUtils = require('../objc-import-utils');
import ObjCNullabilityUtils = require('../objc-nullability-utils');
import ObjCTypeUtils = require('../objc-type-utils');
import ObjectGeneration = require('../object-generation');
import StringUtils = require('../string-utils');
import ObjectSpec = require('../object-spec');
import ObjectSpecUtils = require('../object-spec-utils');
import ObjectSpecCodeUtils = require('../object-spec-code-utils');

function nameOfBuilderForValueTypeWithName(valueTypeName: string):string {
  return valueTypeName + 'Builder';
}

function shortNameOfObjectToBuildForValueTypeWithName(valueTypeName: string):string {
  return StringUtils.lowercased(StringUtils.stringRemovingCapitalizedPrefix(valueTypeName));
}

function builderClassMethodForValueType(objectType:ObjectSpec.Type):ObjC.Method {
  return {
    belongsToProtocol:Maybe.Nothing<string>(),
    code:[
      'return [[' + nameOfBuilderForValueTypeWithName(objectType.typeName) + ' alloc] init];'
    ],
    comments:[],
    compilerAttributes:[],
    keywords: [
      {
        name: shortNameOfObjectToBuildForValueTypeWithName(objectType.typeName),
        argument:Maybe.Nothing<ObjC.KeywordArgument>()
      }
    ],
    returnType: Maybe.Just({
      name:'instancetype',
      reference:'instancetype'
    })
  };
}

function keywordArgumentNameForBuilderFromExistingObjectClassMethodForValueType(objectType:ObjectSpec.Type):string {
  return 'existing' + StringUtils.capitalize(shortNameOfObjectToBuildForValueTypeWithName(objectType.typeName));
}

function openingBrace():string {
  return '[';
}

function indentationForItemAtIndexWithOffset(offset:number):(index:number) => string {
  return function(index:number):string {
    const indentation = offset - index;
    return StringUtils.stringContainingSpaces(indentation > 0 ? indentation : 0);
  };
}

function toWithInvocationCallForBuilderFromExistingObjectClassMethodForAttribute(indentationProvider:(index:number) => string, existingObjectName:string, soFar:string[], attribute:ObjectSpec.Attribute, index:number, array:ObjectSpec.Attribute[]):string[] {
  return soFar.concat(indentationProvider(index) + keywordNameForAttribute(attribute) + ':' + existingObjectName + '.' + attribute.name + ']');
}

function stringsWithLastItemContainingStringAtEnd(strings:string[], stringToIncludeAtEndOfLastString:string):string[] {
  const updatedStrings:string[] = strings.concat();
  updatedStrings[updatedStrings.length - 1] = updatedStrings[updatedStrings.length - 1] + stringToIncludeAtEndOfLastString;
  return updatedStrings;
}

function codeForBuilderFromExistingObjectClassMethodForValueType(objectType:ObjectSpec.Type):string[] {
  const returnOpening:string = 'return ';
  const openingBracesForWithMethodInvocations:string[] = objectType.attributes.map(openingBrace);
  const builderCreationCall:string = '[' + nameOfBuilderForValueTypeWithName(objectType.typeName) + ' ' + shortNameOfObjectToBuildForValueTypeWithName(objectType.typeName) + ']';
  const openingLine:string = returnOpening + openingBracesForWithMethodInvocations.join('') + builderCreationCall;

  const indentationProvider:(index:number) => string = indentationForItemAtIndexWithOffset(returnOpening.length + openingBracesForWithMethodInvocations.length);
  const existingObjectName:string = keywordArgumentNameForBuilderFromExistingObjectClassMethodForValueType(objectType);
  const linesForBuildingValuesIntoBuilder:string[] = objectType.attributes.reduce(toWithInvocationCallForBuilderFromExistingObjectClassMethodForAttribute.bind(null, indentationProvider, existingObjectName), []);

  const code:string[] = [openingLine].concat(linesForBuildingValuesIntoBuilder);
  return stringsWithLastItemContainingStringAtEnd(code, ';');
}

function builderFromExistingObjectClassMethodForValueType(objectType:ObjectSpec.Type):ObjC.Method {
  return {
    belongsToProtocol:Maybe.Nothing<string>(),
    code: codeForBuilderFromExistingObjectClassMethodForValueType(objectType),
    comments:[],
    compilerAttributes:[],
    keywords: [
      {
        name: shortNameOfObjectToBuildForValueTypeWithName(objectType.typeName) + 'FromExisting' + StringUtils.capitalize(shortNameOfObjectToBuildForValueTypeWithName(objectType.typeName)),
        argument:Maybe.Just<ObjC.KeywordArgument>({
          name: keywordArgumentNameForBuilderFromExistingObjectClassMethodForValueType(objectType),
          modifiers: [],
          type: {
            name: objectType.typeName,
            reference: ObjectSpecUtils.typeReferenceForValueTypeWithName(objectType.typeName)
          }
        })
      }
    ],
    returnType: Maybe.Just({
      name:'instancetype',
      reference:'instancetype'
    })
  };
}

function valueGeneratorForInvokingInitializerWithAttribute(attribute:ObjectSpec.Attribute):string {
  return ObjectSpecCodeUtils.ivarForAttribute(attribute);
}

function buildObjectInstanceMethodForValueType(objectType:ObjectSpec.Type):ObjC.Method {
  return {
    belongsToProtocol:Maybe.Nothing<string>(),
    code:[
      'return ' + ObjectSpecCodeUtils.methodInvocationForConstructor(objectType, valueGeneratorForInvokingInitializerWithAttribute) + ';'
    ],
    comments:[],
    compilerAttributes:[],
    keywords: [
      {
        name:'build',
        argument:Maybe.Nothing<ObjC.KeywordArgument>()
      }
    ],
    returnType: Maybe.Just({
      name: objectType.typeName,
      reference: ObjectSpecUtils.typeReferenceForValueTypeWithName(objectType.typeName)
    })
  };
}

function keywordArgumentNameForAttribute(attribute:ObjectSpec.Attribute):string {
  return attribute.name;
}

function keywordNameForAttribute(attribute:ObjectSpec.Attribute):string {
  return 'with' + StringUtils.capitalize(keywordArgumentNameForAttribute(attribute));
}

function valueToAssignIntoInternalStateForAttribute(supportsValueSemantics:boolean, attribute:ObjectSpec.Attribute):string {
  const keywordArgumentName:string = keywordArgumentNameForAttribute(attribute);
  if (ObjectSpecCodeUtils.shouldCopyIncomingValueForAttribute(supportsValueSemantics, attribute)) {
    return '[' + keywordArgumentName + ' copy]';
  } else {
    return keywordArgumentName;
  }
}

function withInstanceMethodForAttribute(supportsValueSemantics:boolean, attribute:ObjectSpec.Attribute):ObjC.Method {
  return {
    belongsToProtocol:Maybe.Nothing<string>(),
    code:[
      ObjectSpecCodeUtils.ivarForAttribute(attribute) + ' = ' + valueToAssignIntoInternalStateForAttribute(supportsValueSemantics, attribute) + ';',
      'return self;'
    ],
    comments:[],
    compilerAttributes:[],
    keywords: [
      {
        name: keywordNameForAttribute(attribute),
        argument:Maybe.Just<ObjC.KeywordArgument>({
          name: keywordArgumentNameForAttribute(attribute),
          modifiers: ObjCNullabilityUtils.keywordArgumentModifiersForNullability(attribute.nullability),
          type: {
            name: attribute.type.name,
            reference: attribute.type.reference
          }
        })
      }
    ],
    returnType: Maybe.Just({
      name:'instancetype',
      reference:'instancetype'
    })
  };
}

function internalPropertyForAttribute(attribute:ObjectSpec.Attribute):ObjC.Property {
  return {
    name: attribute.name,
    comments: [],
    returnType: {
      name: attribute.type.name,
      reference: attribute.type.reference
    },
    modifiers: [],
    access: ObjC.PropertyAccess.Private()
  };
}

function importForAttribute(objectLibrary:Maybe.Maybe<string>, isPublic:boolean, attribute:ObjectSpec.Attribute):ObjC.Import {
  const builtInImportMaybe:Maybe.Maybe<ObjC.Import> = ObjCImportUtils.typeDefinitionImportForKnownSystemType(attribute.type.name);

  return Maybe.match(
    function(builtInImport:ObjC.Import) {
      return builtInImport;
    },
    function() {
      const requiresPublicImport = isPublic || ObjCImportUtils.requiresPublicImportForType(attribute.type.name, ObjectSpecCodeUtils.computeTypeOfAttribute(attribute));
      return {
        library: ObjCImportUtils.libraryForImport(attribute.type.libraryTypeIsDefinedIn, objectLibrary),
        file: ObjCImportUtils.fileForImport(attribute.type.fileTypeIsDefinedIn, attribute.type.name),
        isPublic: requiresPublicImport
      };
    }, builtInImportMaybe);
}

function importRequiredForTypeLookup(typeLookup:ObjectGeneration.TypeLookup):boolean {
  return !typeLookup.canForwardDeclare;
}

function canUseForwardDeclarationForTypeLookup(typeLookup:ObjectGeneration.TypeLookup):boolean {
  return typeLookup.canForwardDeclare;
}

export function importsForTypeLookups(typeLookups:ObjectGeneration.TypeLookup[], defaultLibrary:Maybe.Maybe<string>):ObjC.Import[] {
  return typeLookups.filter(importRequiredForTypeLookup)
                    .map(FunctionUtils.pApply2f3(defaultLibrary, true, ObjCImportUtils.importForTypeLookup));
}

function importsForBuilder(objectType:ObjectSpec.Type):ObjC.Import[] {
  const typeLookupImports:ObjC.Import[] = importsForTypeLookups(objectType.typeLookups, objectType.libraryName);

  const attributeImports:ObjC.Import[] = objectType.attributes.filter(FunctionUtils.pApplyf2(objectType.typeLookups, mustDeclareImportForAttribute))
                                                           .map(function(attribute:ObjectSpec.Attribute):ObjC.Import {
                                                             return importForAttribute(objectType.libraryName, false, attribute);
                                                           });

  return [
    {file:'Foundation.h', isPublic:true, library:Maybe.Just('Foundation')},
    {file:objectType.typeName + '.h', isPublic:false, library:objectType.libraryName},
    {file:nameOfBuilderForValueTypeWithName(objectType.typeName) + '.h', isPublic:false, library:Maybe.Nothing<string>()}
  ].concat(typeLookupImports).concat(attributeImports);
}

function mustDeclareImportForAttribute(typeLookups:ObjectGeneration.TypeLookup[], attribute:ObjectSpec.Attribute):boolean {
  return ObjCImportUtils.shouldIncludeImportForType(typeLookups, attribute.type.name);
}

function forwardDeclarationsForBuilder(objectType:ObjectSpec.Type):ObjC.ForwardDeclaration[] {
  const typeLookupForwardDeclarations:ObjC.ForwardDeclaration[] = objectType.typeLookups.filter(canUseForwardDeclarationForTypeLookup)
                                                                                     .map(function (typeLookup:ObjectGeneration.TypeLookup):ObjC.ForwardDeclaration {
                                                                                       return ObjC.ForwardDeclaration.ForwardClassDeclaration(typeLookup.name);
                                                                                     });

  const attributeDeclarations:ObjC.ForwardDeclaration[] = objectType.attributes.filter(ObjCImportUtils.canForwardDeclareTypeForAttribute).map(function(attribute:ObjectSpec.Attribute):ObjC.ForwardDeclaration {
    return ObjC.ForwardDeclaration.ForwardClassDeclaration(attribute.type.name);
  });

  return [
    ObjC.ForwardDeclaration.ForwardClassDeclaration(objectType.typeName)
  ].concat(typeLookupForwardDeclarations).concat(attributeDeclarations);
}

function builderFileForValueType(objectType:ObjectSpec.Type):Code.File {
  return {
    name: nameOfBuilderForValueTypeWithName(objectType.typeName),
    type: Code.FileType.ObjectiveC(),
    imports:importsForBuilder(objectType),
    forwardDeclarations:forwardDeclarationsForBuilder(objectType),
    comments:[],
    enumerations: [],
    blockTypes:[],
    staticConstants: [],
    functions:[],
    classes: [
      {
        baseClassName:'NSObject',
        classMethods: [
          builderClassMethodForValueType(objectType),
          builderFromExistingObjectClassMethodForValueType(objectType)
        ],
        comments: [ ],
        instanceMethods: [buildObjectInstanceMethodForValueType(objectType)].concat(objectType.attributes.map(FunctionUtils.pApplyf2(ObjectSpecUtils.typeSupportsValueObjectSemantics(objectType), withInstanceMethodForAttribute))),
        name: nameOfBuilderForValueTypeWithName(objectType.typeName),
        properties: [],
        internalProperties:objectType.attributes.map(internalPropertyForAttribute),
        implementedProtocols: [],
        nullability:ObjC.ClassNullability.default
      }
    ],
    diagnosticIgnores:[],
    structs: [],
    namespaces: []
  };
}

export function createPlugin():ObjectSpec.Plugin {
  return {
    additionalFiles: function(objectType:ObjectSpec.Type):Code.File[] {
      return [
        builderFileForValueType(objectType)
      ];
    },
    additionalTypes: function(objectType:ObjectSpec.Type):ObjectSpec.Type[] {
      return [];
    },
    attributes: function(objectType:ObjectSpec.Type):ObjectSpec.Attribute[] {
      return [];
    },
    classMethods: function(objectType:ObjectSpec.Type):ObjC.Method[] {
      return [];
    },
    fileTransformation: function(request:FileWriter.Request):FileWriter.Request {
      return request;
    },
    fileType: function(objectType:ObjectSpec.Type):Maybe.Maybe<Code.FileType> {
      return Maybe.Nothing<Code.FileType>();
    },
    forwardDeclarations: function(objectType:ObjectSpec.Type):ObjC.ForwardDeclaration[] {
      return [];
    },
    functions: function(objectType:ObjectSpec.Type):ObjC.Function[] {
      return [];
    },
    headerComments: function(objectType:ObjectSpec.Type):ObjC.Comment[] {
      return [];
    },
    implementedProtocols: function(objectType:ObjectSpec.Type):ObjC.Protocol[] {
      return [];
    },
    imports: function(objectType:ObjectSpec.Type):ObjC.Import[] {
      return [];
    },
    instanceMethods: function(objectType:ObjectSpec.Type):ObjC.Method[] {
      return [];
    },
    properties: function(objectType:ObjectSpec.Type):ObjC.Property[] {
      return [];
    },
    requiredIncludesToRun:['RMBuilder'],
    staticConstants: function(objectType:ObjectSpec.Type):ObjC.Constant[] {
      return [];
    },
    validationErrors: function(objectType:ObjectSpec.Type):Error.Error[] {
      return [];
    },
    nullability: function(objectType:ObjectSpec.Type):Maybe.Maybe<ObjC.ClassNullability> {
      return Maybe.Nothing<ObjC.ClassNullability>();
    }
  };
}
