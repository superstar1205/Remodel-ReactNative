/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as Code from './code';
import * as Error from './error';
import * as FileWriter from './file-writer';
import * as Maybe from './maybe';
import * as ObjC from './objc';
import * as ObjectGeneration from './object-generation';

export interface AttributeType {
  fileTypeIsDefinedIn: Maybe.Maybe<string>;
  libraryTypeIsDefinedIn: Maybe.Maybe<string>;
  name: string;
  reference: string;
  underlyingType: Maybe.Maybe<string>;
  conformingProtocol: Maybe.Maybe<string>;
}

export interface Attribute {
  annotations: ObjectGeneration.AnnotationMap;
  comments: string[];
  name: string;
  nullability: ObjC.Nullability;
  type: AttributeType;
}

export interface Type {
  annotations: ObjectGeneration.AnnotationMap;
  attributes: Attribute[];
  comments: string[];
  excludes: string[];
  includes: string[];
  libraryName: Maybe.Maybe<string>;
  typeLookups: ObjectGeneration.TypeLookup[];
  typeName: string;
}

export interface Plugin {
  additionalFiles: (objectType: Type) => Code.File[];
  additionalTypes: (objectType: Type) => Type[];
  attributes: (objectType: Type) => Attribute[];
  classMethods: (objectType: Type) => ObjC.Method[];
  fileTransformation: (writeRequest: FileWriter.Request) => FileWriter.Request;
  fileType: (objectType: Type) => Maybe.Maybe<Code.FileType>;
  forwardDeclarations: (objectType: Type) => ObjC.ForwardDeclaration[];
  functions: (objectType: Type) => ObjC.Function[];
  headerComments: (objectType: Type) => ObjC.Comment[];
  imports: (objectType: Type) => ObjC.Import[];
  implementedProtocols: (objectType: Type) => ObjC.Protocol[];
  instanceMethods: (objectType: Type) => ObjC.Method[];
  macros: (objectType: Type) => ObjC.Macro[];
  properties: (objectType: Type) => ObjC.Property[];
  requiredIncludesToRun: string[];
  staticConstants: (objectType: Type) => ObjC.Constant[];
  validationErrors: (objectType: Type) => Error.Error[];
  nullability: (objectType: Type) => Maybe.Maybe<ObjC.ClassNullability>;
  subclassingRestricted: (objectType: Type) => boolean;
}
