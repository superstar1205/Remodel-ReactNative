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

export interface SubtypeAttributeType {
  fileTypeIsDefinedIn: Maybe.Maybe<string>;
  libraryTypeIsDefinedIn: Maybe.Maybe<string>;
  name: string;
  reference: string;
  underlyingType: Maybe.Maybe<string>;
  conformingProtocol: Maybe.Maybe<string>;
}

export interface SubtypeAttribute {
  annotations: ObjectGeneration.AnnotationMap;
  comments: string[];
  name: string;
  nullability: ObjC.Nullability;
  type: SubtypeAttributeType;
}

export enum SubtypeDefinitionType {
  namedAttributeCollection,
  singleAttribute,
}

export interface NamedAttributeCollectionSubtype {
  annotations: ObjectGeneration.AnnotationMap;
  name: string;
  comments: string[];
  attributes: SubtypeAttribute[];
}

export class Subtype {
  private definitionType: SubtypeDefinitionType;
  private singleAttribute?: SubtypeAttribute;
  private attributeCollectionSubtype?: NamedAttributeCollectionSubtype;

  constructor(
    definitionType: SubtypeDefinitionType,
    singleAttribute?: SubtypeAttribute,
    attributeCollectionSubtype?: NamedAttributeCollectionSubtype,
  ) {
    this.definitionType = definitionType;
    this.singleAttribute = singleAttribute;
    this.attributeCollectionSubtype = attributeCollectionSubtype;
  }

  static NamedAttributeCollectionDefinition(
    namedAttributeCollectionType: NamedAttributeCollectionSubtype,
  ): Subtype {
    return new Subtype(
      SubtypeDefinitionType.namedAttributeCollection,
      undefined,
      namedAttributeCollectionType,
    );
  }

  static SingleAttributeSubtypeDefinition(
    attribute: SubtypeAttribute,
  ): Subtype {
    return new Subtype(
      SubtypeDefinitionType.singleAttribute,
      attribute,
      undefined,
    );
  }

  match<T>(
    namedAttributeCollection: (
      namedAttributeCollectionSubtype: NamedAttributeCollectionSubtype,
    ) => T,
    singleAttributeSubtype: (attribute: SubtypeAttribute) => T,
  ) {
    switch (this.definitionType) {
      case SubtypeDefinitionType.namedAttributeCollection:
        return namedAttributeCollection(this.attributeCollectionSubtype!);
      case SubtypeDefinitionType.singleAttribute:
        return singleAttributeSubtype(this.singleAttribute!);
    }
  }
}

export interface Type {
  annotations: ObjectGeneration.AnnotationMap;
  comments: string[];
  includes: string[];
  excludes: string[];
  libraryName: Maybe.Maybe<string>;
  name: string;
  typeLookups: ObjectGeneration.TypeLookup[];
  subtypes: Subtype[];
}

export interface Plugin {
  additionalFiles: (algebraicType: Type) => Code.File[];
  transformBaseFile: (algebraicType: Type, baseFile: Code.File) => Code.File;
  blockTypes: (algebraicType: Type) => ObjC.BlockType[];
  classMethods: (algebraicType: Type) => ObjC.Method[];
  enumerations: (algebraicType: Type) => ObjC.Enumeration[];
  transformFileRequest: (
    writeRequest: FileWriter.Request,
  ) => FileWriter.Request;
  fileType: (algebraicType: Type) => Maybe.Maybe<Code.FileType>;
  forwardDeclarations: (algebraicType: Type) => ObjC.ForwardDeclaration[];
  functions: (algebraicType: Type) => ObjC.Function[];
  headerComments: (algebraicType: Type) => ObjC.Comment[];
  implementedProtocols: (algebraicType: Type) => ObjC.Protocol[];
  imports: (algebraicType: Type) => ObjC.Import[];
  instanceMethods: (algebraicType: Type) => ObjC.Method[];
  instanceVariables: (algebraicType: Type) => ObjC.InstanceVariable[];
  macros: (algebraicType: Type) => ObjC.Macro[];
  requiredIncludesToRun: string[];
  staticConstants: (algebraicType: Type) => ObjC.Constant[];
  validationErrors: (algebraicType: Type) => Error.Error[];
  nullability: (algebraicType: Type) => Maybe.Maybe<ObjC.ClassNullability>;
  subclassingRestricted: (algebraicType: Type) => boolean;
  structs?: (algebraicType: Type) => Code.Struct[];
}
