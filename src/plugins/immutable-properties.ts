/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as Code from '../code';
import * as Error from '../error';
import * as FileWriter from '../file-writer';
import * as Maybe from '../maybe';
import * as StringUtils from '../string-utils';
import * as ObjC from '../objc';
import * as ObjCCommentUtils from '../objc-comment-utils';
import * as ObjCNullabilityUtils from '../objc-nullability-utils';
import * as ObjCImportUtils from '../objc-import-utils';
import * as ObjectGeneration from '../object-generation';
import * as ObjectSpec from '../object-spec';
import * as ObjectSpecUtils from '../object-spec-utils';
import * as ObjectSpecCodeUtils from '../object-spec-code-utils';

function keywordArgumentFromAttribute(
  attribute: ObjectSpec.Attribute,
): Maybe.Maybe<ObjC.KeywordArgument> {
  return Maybe.Just({
    name: attribute.name,
    modifiers: ObjCNullabilityUtils.keywordArgumentModifiersForNullability(
      attribute.nullability,
    ),
    type: {
      name: attribute.type.name,
      reference: attribute.type.reference,
    },
  });
}

function firstInitializerKeyword(
  attribute: ObjectSpec.Attribute,
): ObjC.Keyword {
  return {
    argument: keywordArgumentFromAttribute(attribute),
    name: 'initWith' + StringUtils.capitalize(attribute.name),
  };
}

function attributeToKeyword(attribute: ObjectSpec.Attribute): ObjC.Keyword {
  return {
    argument: keywordArgumentFromAttribute(attribute),
    name: attribute.name,
  };
}

function valueOrCopy(
  supportsValueSemantics: boolean,
  attribute: ObjectSpec.Attribute,
): string {
  if (
    ObjectSpecCodeUtils.shouldCopyIncomingValueForAttribute(
      supportsValueSemantics,
      attribute,
    )
  ) {
    return '[' + attribute.name + ' copy];';
  } else {
    return attribute.name + ';';
  }
}

function toIvarAssignment(
  supportsValueSemantics: boolean,
  attribute: ObjectSpec.Attribute,
): string {
  return (
    '_' +
    attribute.name +
    ' = ' +
    valueOrCopy(supportsValueSemantics, attribute)
  );
}

function canAssertExistenceForTypeOfAttribute(attribute: ObjectSpec.Attribute) {
  return ObjCNullabilityUtils.canAssertExistenceForType(
    ObjectSpecCodeUtils.computeTypeOfAttribute(attribute),
  );
}

function isRequiredAttribute(
  assumeNonnull: boolean,
  attribute: ObjectSpec.Attribute,
): boolean {
  return ObjCNullabilityUtils.shouldProtectFromNilValuesForNullability(
    assumeNonnull,
    attribute.nullability,
  );
}

function toRequiredAssertion(attribute: ObjectSpec.Attribute): string {
  return 'RMParameterAssert(' + attribute.name + ' != nil);';
}

function initializerCodeFromAttributes(
  assumeNonnull: boolean,
  supportsValueSemantics: boolean,
  attributes: ObjectSpec.Attribute[],
): string[] {
  const requiredParameterAssertions = attributes
    .filter(canAssertExistenceForTypeOfAttribute)
    .filter(attribute => isRequiredAttribute(assumeNonnull, attribute))
    .map(toRequiredAssertion);
  const opening = ['if ((self = [super init])) {'];
  const iVarAssignements = attributes
    .map(attribute => toIvarAssignment(supportsValueSemantics, attribute))
    .map(StringUtils.indent(2));
  const closing = ['}', '', 'return self;'];
  return requiredParameterAssertions
    .concat(opening)
    .concat(iVarAssignements)
    .concat(closing);
}

export function initializerFromAttributes(
  assumeNonnull: boolean,
  supportsValueSemantics: boolean,
  attributes: ObjectSpec.Attribute[],
): ObjC.Method {
  const keywords = [firstInitializerKeyword(attributes[0])].concat(
    attributes.slice(1).map(attributeToKeyword),
  );
  return {
    preprocessors: [],
    belongsToProtocol: Maybe.Nothing<string>(),
    code: initializerCodeFromAttributes(
      assumeNonnull,
      supportsValueSemantics,
      attributes,
    ),
    comments: ObjCCommentUtils.commentsAsBlockFromStringArray(
      ObjCCommentUtils.paramCommentsFromAttributes(attributes),
    ),
    compilerAttributes: ['NS_DESIGNATED_INITIALIZER'],
    keywords: keywords,
    returnType: {
      type: Maybe.Just<ObjC.Type>({
        name: 'instancetype',
        reference: 'instancetype',
      }),
      modifiers: [],
    },
  };
}

function propertyModifiersForCopyingFromAttribute(
  supportsValueSemantics: boolean,
  attribute: ObjectSpec.Attribute,
): ObjC.PropertyModifier[] {
  const type = ObjectSpecCodeUtils.propertyOwnershipModifierForAttribute(
    supportsValueSemantics,
    attribute,
  );
  if (type == null) {
    return [];
  }
  return type.match(
    function assign() {
      return [];
    },
    function atomic() {
      return [];
    },
    function copy() {
      return [ObjC.PropertyModifier.Copy()];
    },
    function nonatomic() {
      return [];
    },
    function nonnull() {
      return [];
    },
    function nullable() {
      return [];
    },
    function readonly() {
      return [];
    },
    function readwrite() {
      return [];
    },
    function strong() {
      return [];
    },
    function weak() {
      return [];
    },
    function unsafeUnretained() {
      return [ObjC.PropertyModifier.UnsafeUnretained()];
    },
  );
}

export function propertyModifiersFromAttribute(
  supportsValueSemantics: boolean,
  attribute: ObjectSpec.Attribute,
): ObjC.PropertyModifier[] {
  return []
    .concat([
      ObjC.PropertyModifier.Nonatomic(),
      ObjC.PropertyModifier.Readonly(),
    ])
    .concat(
      propertyModifiersForCopyingFromAttribute(
        supportsValueSemantics,
        attribute,
      ),
    )
    .concat(
      ObjCNullabilityUtils.propertyModifiersForNullability(
        attribute.nullability,
      ),
    );
}

function propertyFromAttribute(
  supportsValueSemantics: boolean,
  attribute: ObjectSpec.Attribute,
): ObjC.Property {
  return {
    comments: ObjCCommentUtils.commentsAsBlockFromStringArray(
      attribute.comments,
    ),
    modifiers: propertyModifiersFromAttribute(
      supportsValueSemantics,
      attribute,
    ),
    name: attribute.name,
    returnType: {
      name: attribute.type.name,
      reference: attribute.type.reference,
    },
    access: ObjC.PropertyAccess.Public(),
  };
}

function isImportRequiredForAttribute(
  typeLookups: ObjectGeneration.TypeLookup[],
  attribute: ObjectSpec.Attribute,
): boolean {
  const shouldIncludeImportForTypeName = ObjCImportUtils.shouldIncludeImportForType(
    typeLookups,
    attribute.type.name,
  );
  return Maybe.match(
    function(protocol) {
      return (
        shouldIncludeImportForTypeName ||
        ObjCImportUtils.shouldIncludeImportForType(typeLookups, protocol)
      );
    },
    function() {
      return shouldIncludeImportForTypeName;
    },
    attribute.type.conformingProtocol,
  );
}

function isImportRequiredForTypeLookup(
  objectType: ObjectSpec.Type,
  typeLookup: ObjectGeneration.TypeLookup,
): boolean {
  return typeLookup.name !== objectType.typeName;
}

function importForTypeLookup(
  objectLibrary: Maybe.Maybe<string>,
  isPublic: boolean,
  typeLookup: ObjectGeneration.TypeLookup,
): ObjC.Import {
  return ObjCImportUtils.importForTypeLookup(
    objectLibrary,
    isPublic || !typeLookup.canForwardDeclare,
    typeLookup,
  );
}

function importForAttribute(
  objectLibrary: Maybe.Maybe<string>,
  isPublic: boolean,
  attribute: ObjectSpec.Attribute,
): ObjC.Import {
  const builtInImportMaybe: Maybe.Maybe<
    ObjC.Import
  > = ObjCImportUtils.typeDefinitionImportForKnownSystemType(
    attribute.type.name,
  );

  return Maybe.match(
    function(builtInImport: ObjC.Import) {
      return builtInImport;
    },
    function() {
      const requiresPublicImport =
        isPublic ||
        ObjCImportUtils.requiresPublicImportForType(
          attribute.type.name,
          ObjectSpecCodeUtils.computeTypeOfAttribute(attribute),
        );
      return {
        library: ObjCImportUtils.libraryForImport(
          attribute.type.libraryTypeIsDefinedIn,
          objectLibrary,
        ),
        file: ObjCImportUtils.fileForImport(
          attribute.type.fileTypeIsDefinedIn,
          attribute.type.name,
        ),
        isPublic: requiresPublicImport,
        requiresCPlusPlus: false,
      };
    },
    builtInImportMaybe,
  );
}

function makePublicImportsForValueType(objectType: ObjectSpec.Type): boolean {
  return objectType.includes.indexOf('UseForwardDeclarations') === -1;
}

function SkipImportsInImplementationForValueType(
  objectType: ObjectSpec.Type,
): boolean {
  return objectType.includes.indexOf('SkipImportsInImplementation') !== -1;
}

function isForwardDeclarationRequiredForTypeLookup(
  objectType: ObjectSpec.Type,
  typeLookup: ObjectGeneration.TypeLookup,
): boolean {
  return (
    typeLookup.name === objectType.typeName ||
    (typeLookup.canForwardDeclare && !makePublicImportsForValueType(objectType))
  );
}

function forwardDeclarationForTypeLookup(
  typeLookup: ObjectGeneration.TypeLookup,
): ObjC.ForwardDeclaration {
  return ObjC.ForwardDeclaration.ForwardClassDeclaration(typeLookup.name);
}

function typeLookupPreventsForwardDeclarationForAttribute(
  typeLookup: ObjectGeneration.TypeLookup,
  attribute: ObjectSpec.Attribute,
): boolean {
  return (
    !typeLookup.canForwardDeclare && typeLookup.name === attribute.type.name
  );
}

function typeLookupsAllowForwardDeclarationForAttribute(
  typeLookups: ObjectGeneration.TypeLookup[],
  attribute: ObjectSpec.Attribute,
): boolean {
  return !typeLookups.some(typeLookup =>
    typeLookupPreventsForwardDeclarationForAttribute(typeLookup, attribute),
  );
}

function shouldForwardClassDeclareAttribute(
  valueTypeName: string,
  typeLookups: ObjectGeneration.TypeLookup[],
  makePublicImports: boolean,
  attribute: ObjectSpec.Attribute,
): boolean {
  const shouldExplicitlyForwardDeclare =
    !makePublicImports &&
    typeLookupsAllowForwardDeclarationForAttribute(typeLookups, attribute) &&
    ObjCImportUtils.canForwardDeclareTypeForAttribute(attribute);
  const attributeTypeReferencesObjectType =
    valueTypeName == attribute.type.name;
  return shouldExplicitlyForwardDeclare || attributeTypeReferencesObjectType;
}

function forwardClassDeclarationForAttribute(
  attribute: ObjectSpec.Attribute,
): ObjC.ForwardDeclaration {
  return ObjC.ForwardDeclaration.ForwardClassDeclaration(attribute.type.name);
}

export function createPlugin(): ObjectSpec.Plugin {
  return {
    additionalFiles: function(objectType: ObjectSpec.Type): Code.File[] {
      return [];
    },
    additionalTypes: function(objectType: ObjectSpec.Type): ObjectSpec.Type[] {
      return [];
    },
    attributes: function(objectType: ObjectSpec.Type): ObjectSpec.Attribute[] {
      return [];
    },
    classMethods: function(objectType: ObjectSpec.Type): ObjC.Method[] {
      return [];
    },
    fileTransformation: function(
      request: FileWriter.Request,
    ): FileWriter.Request {
      return request;
    },
    fileType: function(
      objectType: ObjectSpec.Type,
    ): Maybe.Maybe<Code.FileType> {
      return Maybe.Nothing<Code.FileType>();
    },
    forwardDeclarations: function(
      objectType: ObjectSpec.Type,
    ): ObjC.ForwardDeclaration[] {
      const makePublicImports = makePublicImportsForValueType(objectType);
      const typeLookupForwardDeclarations = objectType.typeLookups
        .filter(typeLookup =>
          isForwardDeclarationRequiredForTypeLookup(objectType, typeLookup),
        )
        .map(forwardDeclarationForTypeLookup);
      const attributeForwardClassDeclarations = objectType.attributes
        .filter(attribute =>
          shouldForwardClassDeclareAttribute(
            objectType.typeName,
            objectType.typeLookups,
            makePublicImports,
            attribute,
          ),
        )
        .map(forwardClassDeclarationForAttribute);
      const attributeForwardProtocolDeclarations = makePublicImports
        ? []
        : objectType.attributes
            .filter(ObjCImportUtils.shouldForwardProtocolDeclareAttribute)
            .map(ObjCImportUtils.forwardProtocolDeclarationForAttribute);
      return []
        .concat(typeLookupForwardDeclarations)
        .concat(attributeForwardClassDeclarations)
        .concat(attributeForwardProtocolDeclarations);
    },
    functions: function(objectType: ObjectSpec.Type): ObjC.Function[] {
      return [];
    },
    headerComments: function(objectType: ObjectSpec.Type): ObjC.Comment[] {
      return [];
    },
    implementedProtocols: function(
      objectType: ObjectSpec.Type,
    ): ObjC.Protocol[] {
      return [];
    },
    imports: function(objectType: ObjectSpec.Type): ObjC.Import[] {
      const baseImports : ObjC.Import[] = [
        {
          file: 'Foundation.h',
          isPublic: true,
          requiresCPlusPlus: false,
          library: Maybe.Just('Foundation'),
        },
        {
          file: objectType.typeName + '.h',
          isPublic: false,
          requiresCPlusPlus: false,
          library: Maybe.Nothing<string>(),
        },
      ];
      const makePublicImports = makePublicImportsForValueType(objectType);
      const skipAttributeImports =
        !makePublicImports &&
        SkipImportsInImplementationForValueType(objectType);
      const typeLookupImports = objectType.typeLookups
        .filter(typeLookup =>
          isImportRequiredForTypeLookup(objectType, typeLookup),
        )
        .map(typeLookup =>
          importForTypeLookup(
            objectType.libraryName,
            makePublicImports,
            typeLookup,
          ),
        );
      const attributeImports = skipAttributeImports
        ? []
        : objectType.attributes
            .filter(attribute =>
              isImportRequiredForAttribute(objectType.typeLookups, attribute),
            )
            .map(attribute =>
              importForAttribute(
                objectType.libraryName,
                makePublicImports,
                attribute,
              ),
            );
      return baseImports.concat(typeLookupImports).concat(attributeImports);
    },
    instanceMethods: function(objectType: ObjectSpec.Type): ObjC.Method[] {
      if (objectType.attributes.length > 0) {
        const assumeNonnull: boolean =
          objectType.includes.indexOf('RMAssumeNonnull') >= 0;
        return [
          initializerFromAttributes(
            assumeNonnull,
            ObjectSpecUtils.typeSupportsValueObjectSemantics(objectType),
            objectType.attributes,
          ),
        ];
      } else {
        return [];
      }
    },
    macros: function(valueType: ObjectSpec.Type): ObjC.Macro[] {
      return [];
    },
    properties: function(objectType: ObjectSpec.Type): ObjC.Property[] {
      const supportsValueSemantics: boolean = ObjectSpecUtils.typeSupportsValueObjectSemantics(
        objectType,
      );
      return objectType.attributes.map(attribute =>
        propertyFromAttribute(supportsValueSemantics, attribute),
      );
    },
    requiredIncludesToRun: ['RMImmutableProperties'],
    staticConstants: function(objectType: ObjectSpec.Type): ObjC.Constant[] {
      return [];
    },
    validationErrors: function(objectType: ObjectSpec.Type): Error.Error[] {
      return [];
    },
    nullability: function(
      objectType: ObjectSpec.Type,
    ): Maybe.Maybe<ObjC.ClassNullability> {
      return Maybe.Nothing<ObjC.ClassNullability>();
    },
    subclassingRestricted: function(objectType: ObjectSpec.Type): boolean {
      return false;
    },
  };
}
