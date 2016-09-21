/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import Code = require('./code');
import CPlusPlus = require('./cplusplus');
import FunctionUtils = require('./function-utils');
import Maybe = require('./maybe');
import StringUtils = require('./string-utils');
import ObjC = require('./objc');

function emptyString():string {
  return '';
}

function returnTrue():boolean {
  return true;
}

function doesNotBelongToAnImplementedProtocol(implementedProtocolNames:string[], belongsToProtocol:string):boolean {
  return implementedProtocolNames.indexOf(belongsToProtocol) === -1;
}

function includeMethodInHeader(implementedProtocols:ObjC.Protocol[], instanceMethod:ObjC.Method):boolean {
  const implementedProtocolNames:string[] = implementedProtocols.map(toProtocolString);
  return Maybe.match(FunctionUtils.pApplyf2(implementedProtocolNames, doesNotBelongToAnImplementedProtocol), returnTrue, instanceMethod.belongsToProtocol);
}

function localImport(file:string):string {
  if (file.indexOf('\.h') === -1) {
    return '#import <' + file + '>';
  } else {
    return '#import "' + file + '"';
  }
}

function libraryImport(file:string, library:string):string {
  return '#import <' + library + '/' + file + '>';
}

function returnTypeReference(type:ObjC.Type):string {
  return type.reference;
}

function returnVoid():string {
  return 'void';
}

function toTypeString(type:Maybe.Maybe<ObjC.Type>):string {
  return Maybe.match(returnTypeReference, returnVoid, type);
}

function toImportString(givenImport:ObjC.Import):string {
  return Maybe.match<string,string>(FunctionUtils.pApplyf2(givenImport.file, libraryImport),
                                    FunctionUtils.pApplyf1(givenImport.file, localImport),
                                    givenImport.library);
}

function isPublicImport(givenImport:ObjC.Import):boolean {
  return givenImport.isPublic;
}

function isPrivateImport(givenImport:ObjC.Import):boolean {
  return !isPublicImport(givenImport);
}

function arrayWithDuplicatesRemoved(array:any[]):any[] {
  return array.filter(function(str, pos) {
    return array.indexOf(str) == pos;
  });
}

function returnString(str:string):() => string {
  return function() { return str; };
}

function toPropertyModifierString(modifier:ObjC.PropertyModifier):string {
  return modifier.match(returnString('assign'),
                        returnString('atomic'),
                        returnString('copy'),
                        returnString('nonatomic'),
                        returnString('nonnull'),
                        returnString('nullable'),
                        returnString('readonly'),
                        returnString('readwrite'),
                        returnString('strong'),
                        returnString('weak'),
                        returnString('unsafe_unretained'));
}

export function indexOfFirstEndingAsterisk(str:string):number {
  var index:number = str.length - 1;
  while (str.charAt(index) === '*') {
    if (str.charAt(index - 1) !== '*') {
      return index;
    } else {
      index -= 1;
    }
  }
  return -1;
}

function stringReplacingCharacterAtIndexWithString(str:string, indexToReplace:number, replacementString:string):string {
  return str.substr(0, indexToReplace) + replacementString + str.substr(indexToReplace + 1);
}

export function renderableTypeReference(typeReference:string):string {
  const indexOfFirstAsteriskAtEnd:number = indexOfFirstEndingAsterisk(typeReference);
  if (indexOfFirstAsteriskAtEnd !== -1 && typeReference.charAt(indexOfFirstAsteriskAtEnd - 1) !== ' ') {
    return stringReplacingCharacterAtIndexWithString(typeReference, indexOfFirstAsteriskAtEnd, ' *');
  } else {
    return typeReference;
  }
}

export function renderableTypeReferenceNestingSubsequentToken(typeReference:string):string {
  const renderableReference:string = renderableTypeReference(typeReference);
  if (renderableReference.indexOf('*') !== -1) {
    return renderableReference;
  } else {
    return renderableReference + ' ';
  }
}

function toPropertyTypeAndNameString(type:ObjC.Type, name:string):string {
  return renderableTypeReferenceNestingSubsequentToken(type.reference) + name;
}

function toPropertyString(property:ObjC.Property):string {
  const propertyComments = property.comments.map(toCommentString).join('\n');
  const propertyCommentsSection = codeSectionForCodeStringWithoutExtraSpace(propertyComments);

  return propertyCommentsSection +
          '@property (' + property.modifiers.map(toPropertyModifierString).join(', ') + ') ' +
          toPropertyTypeAndNameString(property.returnType, property.name) + ';';
}

function toKeywordArgumentModifierString(argumentModifier:ObjC.KeywordArgumentModifier):string {
  return argumentModifier.match(
    returnString('nonnull'),
    returnString('nullable')
  );
}

export function toKeywordArgumentString(argument:ObjC.KeywordArgument):string {
  const modifiers:string = argument.modifiers.map(toKeywordArgumentModifierString).join(' ');
  const typePart:string = renderableTypeReference(argument.type.reference);
  const innerPart:string = modifiers.length > 0 ? modifiers + ' ' + typePart : typePart;
  return ':(' + innerPart + ')' + argument.name;
}

function toKeywordString(keyword:ObjC.Keyword):string {
  return keyword.name + Maybe.match(toKeywordArgumentString, emptyString, keyword.argument);
}

function toClassMethodHeaderString(method:ObjC.Method):string {
  const methodComments = method.comments.map(toCommentString).join('\n');
  const methodCommentsSection = codeSectionForCodeStringWithoutExtraSpace(methodComments);

  return methodCommentsSection + '+ (' + toTypeString(method.returnType) + ')' + method.keywords.map(toKeywordString).join(' ') + ';';
}

function toInstanceMethodHeaderString(method:ObjC.Method):string {
  const methodComments = method.comments.map(toCommentString).join('\n');
  const methodCommentsSection = codeSectionForCodeStringWithoutExtraSpace(methodComments);

  return methodCommentsSection + '- (' + toTypeString(method.returnType) + ')' + method.keywords.map(toKeywordString).join(' ') + ';';
}

function toClassMethodImplementationString(method:ObjC.Method):string {
  const methodStr =  '+ (' + toTypeString(method.returnType) + ')' + method.keywords.map(toKeywordString).join(' ') + '\n' +
                   '{\n' +
                   method.code.map(StringUtils.indent(2)).join('\n') +
                   '\n}';
  return methodStr;
}

function toInstanceMethodImplementationString(method:ObjC.Method):string {
  const methodStr =  '- (' + toTypeString(method.returnType) + ')' + method.keywords.map(toKeywordString).join(' ') + '\n' +
                   '{\n' +
                   method.code.map(StringUtils.indent(2)).join('\n') +
                   '\n}';
  return methodStr;
}

function toProtocolString(protocol:ObjC.Protocol):string {
  return protocol.name;
}

function protocolsString(protocols:ObjC.Protocol[]):string {
  if (protocols.length > 0) {
    return ' <' + protocols.map(toProtocolString).join(', ') + '>';
  } else {
    return '';
  }
}

function implementedProtocolsIncludingNSObject(implementedProtocols:ObjC.Protocol[]):ObjC.Protocol[] {
  return implementedProtocols.concat({
    name: 'NSObject'
  });
}

const HEADER_FUNCTIONS_SECTION_BEGIN:string = '#ifdef __cplusplus\nextern "C" {\n#endif\n\n';
const HEADER_FUNCTIONS_SECTION_END:string = '\n\n#ifdef __cplusplus\n}\n#endif';

function isPublicFunction(functionDefinition:ObjC.Function):boolean {
  return functionDefinition.isPublic;
}

function toFunctionHeaderString(functionDefinition:ObjC.Function):string {
  const functionHeaderComments = functionDefinition.comments.map(toCommentString).join('\n');
  const functionHeaderCommentsSection = codeSectionForCodeStringWithoutExtraSpace(functionHeaderComments);

  return functionHeaderCommentsSection + functionDeclarationForFunction(functionDefinition) + ';';
}

function toCommentString(comment:ObjC.Comment):string {
  return comment.content;
}

function addCommaToEndOfString(str:string):string {
  return str + ',';
}

function toNSEnumDeclaration(enumeration:ObjC.Enumeration):string {
  const enumComments = enumeration.comments.map(toCommentString).join('\n');
  const enumCommentsSection = codeSectionForCodeStringWithoutExtraSpace(enumComments);
  const declaration:string = enumCommentsSection + 'typedef NS_ENUM(' + enumeration.underlyingType + ', ' + enumeration.name + ') {';
  const values:string[] = enumeration.values.map(StringUtils.indent(2));
  const valuesContainingCommas:string[] = values.slice(0, values.length - 1).map(addCommaToEndOfString).concat(values.slice(values.length - 1));
  return [declaration].concat(valuesContainingCommas).concat('};').join('\n');
}

function enumerationIsPublic(isPublic:boolean):(enumeration:ObjC.Enumeration) => boolean {
  return function(enumeration:ObjC.Enumeration):boolean {
    return enumeration.isPublic === isPublic;
  };
}

const NS_ASSUME_NONNULL_BEGIN:string = 'NS_ASSUME_NONNULL_BEGIN';
const NS_ASSUME_NONNULL_END:string = 'NS_ASSUME_NONNULL_END';

function prefixClassMacros(classInfo:ObjC.Class):string[] {
  var macros:string[] = [];
  switch (classInfo.nullability) {
    case ObjC.ClassNullability.assumeNonnull:
      macros.push(NS_ASSUME_NONNULL_BEGIN);
      break;
    case ObjC.ClassNullability.default:
      break;
  }
  return macros;
}

function postfixClassMacros(classInfo:ObjC.Class):string[] {
  var macros:string[] = [];
  switch (classInfo.nullability) {
    case ObjC.ClassNullability.assumeNonnull:
      macros.push(NS_ASSUME_NONNULL_END);
      break;
    case ObjC.ClassNullability.default:
      break;
  }
  return macros;
}

function prefixBlockTypeMacros(blockType:ObjC.BlockType):string[] {
  var macros:string[] = [];
  switch (blockType.nullability) {
    case ObjC.ClassNullability.assumeNonnull:
      macros.push(NS_ASSUME_NONNULL_BEGIN);
      break;
    case ObjC.ClassNullability.default:
      break;
  }
  return macros;
}

function postfixBlockTypeMacros(blockType:ObjC.BlockType):string[] {
  var macros:string[] = [];
  switch (blockType.nullability) {
    case ObjC.ClassNullability.assumeNonnull:
      macros.push(NS_ASSUME_NONNULL_END);
      break;
    case ObjC.ClassNullability.default:
      break;
  }
  return macros;
}

export function toBlockTypeParameterString(parameter:ObjC.BlockTypeParameter):string {
  const nullabilityModifier:String = parameter.nullability.match(
    returnString(''),
    returnString('_Nonnull '),
    returnString('_Nullable ')
  );
  return renderableTypeReferenceNestingSubsequentToken(parameter.type.reference) + nullabilityModifier + parameter.name;
}

function toBlockTypeDeclaration(blockType:ObjC.BlockType):string {
  const prefixBlockTypeMacrosStr:string = prefixBlockTypeMacros(blockType).join('\n');
  const prefixBlockTypeMacrosSection:string = prefixBlockTypeMacrosStr !== '' ? prefixBlockTypeMacrosStr + '\n' : '';

  const blockTypeComments = blockType.comments.map(toCommentString).join('\n');
  const blockTypeCommentsSection = codeSectionForCodeStringWithoutExtraSpace(blockTypeComments);

  const postfixBlockTypeMacrosStr:string = postfixBlockTypeMacros(blockType).join('\n');
  const postfixBlockTypeMacrosSection:string = postfixBlockTypeMacrosStr !== '' ? '\n' + postfixBlockTypeMacrosStr : '';

  return prefixBlockTypeMacrosSection + blockTypeCommentsSection + 'typedef ' + toFunctionReturnTypeString(blockType.returnType) + '(^' + blockType.name + ')(' + blockType.parameters.map(toBlockTypeParameterString).join(', ') + ');' + postfixBlockTypeMacrosSection;
}

function blockTypeIsPublic(isPublic:boolean):(blockType:ObjC.BlockType) => boolean {
  return function(blockType:ObjC.BlockType):boolean {
    return blockType.isPublic === isPublic;
  };
}

function headerFunctionsSection(functions:ObjC.Function[]):string {
  const functionsToIncludeInHeader = functions.filter(isPublicFunction);
  if (functionsToIncludeInHeader.length > 0) {
    return HEADER_FUNCTIONS_SECTION_BEGIN + functionsToIncludeInHeader.map(toFunctionHeaderString).join('\n') + HEADER_FUNCTIONS_SECTION_END;
  } else {
    return '';
  }
}

function templateTypeDeclaration(templateType:CPlusPlus.TemplateType):string {
  return templateType.match(function():string {
    return 'typename';
  }, function():string {
    return 'class';
  });
}

function toTemplatedTypeContents(templatedType:CPlusPlus.TemplatedType):string {
  return templateTypeDeclaration(templatedType.type) + ' ' + templatedType.value;
}

function toTemplateContents(template:CPlusPlus.Template):string[] {
  const templateDeclaration:string = 'template <' + template.templatedTypes.map(toTemplatedTypeContents).join(', ') + '>';
  return [templateDeclaration].concat(template.code);
}

function buildTemplateContents(soFar:string[], templateContents:string[]):string[] {
  return soFar.concat(templateContents);
}

function toNamespaceContents(namespace:CPlusPlus.Namespace):string {
  const namespaceDeclaration:string = 'namespace ' + namespace.name + ' {';
  const endNamespaceDeclaration:string = '}';

  return [namespaceDeclaration].concat(namespace.templates.map(toTemplateContents).reduce(buildTemplateContents, []).map(StringUtils.indent(2))).concat(endNamespaceDeclaration).join('\n');
}

function headerNeedsToIncludeInternalProperty(internalProperty:ObjC.Property):boolean {
  return internalProperty.access.match(function privateAccess():boolean {
    return false;
  }, function packageAccess():boolean {
    return true;
  }, function publicAccess():boolean {
    return true;
  });
}

function implementationNeedsToIncludeInternalProperty(internalProperty:ObjC.Property):boolean {
  return !headerNeedsToIncludeInternalProperty(internalProperty);
}

function accessIdentifierForAccess(propertyAccess:ObjC.PropertyAccess):string {
  return propertyAccess.match(function privateAccess():string {
    return '@private';
  }, function packageAccess():string {
    return '@package';
  }, function publicAccess():string {
    return '@public';
  });
}

function buildInternalPropertiesContainingAccessIdentifiers(soFar:string[], internalProperty:ObjC.Property):string[] {
  return soFar.concat([accessIdentifierForAccess(internalProperty.access), toInternalPropertyString(internalProperty)]);
}

function headerClassSection(classInfo:ObjC.Class):string {
  const prefixClassMacrosStr:string = prefixClassMacros(classInfo).join('\n');
  const prefixClassMacrosSection:string = prefixClassMacrosStr !== '' ? prefixClassMacrosStr + '\n\n' : '';

  const classComments = classInfo.comments.map(toCommentString).join('\n');
  const classCommentsSection = codeSectionForCodeStringWithoutExtraSpace(classComments);

  const protocolsStr = protocolsString(classInfo.implementedProtocols);

  const classSection = '@interface ' + classInfo.name + ' : ' + classInfo.baseClassName + protocolsStr;

  const internalPropertiesStr:string = classInfo.internalProperties.filter(headerNeedsToIncludeInternalProperty).reduce(buildInternalPropertiesContainingAccessIdentifiers, []).map(StringUtils.indent(2)).join('\n');
  const internalPropertiesSection:string = internalPropertiesStr !== '' ? '{\n' + internalPropertiesStr + '\n}\n\n' : '\n';

  const propertiesStr = classInfo.properties.map(toPropertyString).join('\n');
  const propertiesSection = codeSectionForCodeString(propertiesStr);

  const classMethodsStr = classInfo.classMethods.map(toClassMethodHeaderString).join('\n\n');
  const classMethodsSection = codeSectionForCodeString(classMethodsStr);

  const instanceMethodsStr = classInfo.instanceMethods.filter(FunctionUtils.pApplyf2(implementedProtocolsIncludingNSObject(classInfo.implementedProtocols), includeMethodInHeader))
                                                    .map(toInstanceMethodHeaderString).join('\n\n');
  const instanceMethodsSection = codeSectionForCodeString(instanceMethodsStr);

  const postfixClassMacrosStr:string = postfixClassMacros(classInfo).join('\n');
  const postfixClassMacrosSection:string = postfixClassMacrosStr !== '' ? '\n\n' + postfixClassMacrosStr : '';

  return prefixClassMacrosSection + classCommentsSection + classSection + '\n' + internalPropertiesSection + propertiesSection + classMethodsSection + instanceMethodsSection + '@end' + postfixClassMacrosSection;
}

function toDeclarationString(forwardDeclaration:ObjC.ForwardDeclaration) {
  return forwardDeclaration.match<string>(
      function(classDeclarationName:string):string {
        return '@class ' + classDeclarationName + ';';
      },
      function(protocolDeclarationName:string):string {
        return '@protocol ' + protocolDeclarationName + ';';
      });
}

export function renderHeader(file:Code.File):Maybe.Maybe<string> {
  const commentsStr = file.comments.map(toCommentString).join('\n');
  const commentsSection = codeSectionForCodeString(commentsStr);

  const imports = file.imports.filter(isPublicImport).map(toImportString);
  const importStr = arrayWithDuplicatesRemoved(imports).join('\n');
  const importsSection = codeSectionForCodeString(importStr);

  const declarations = file.forwardDeclarations.map(toDeclarationString);
  const declarationsStr = arrayWithDuplicatesRemoved(declarations).join('\n');
  const declarationsSection = codeSectionForCodeString(declarationsStr);

  const enumerationsStr:string = file.enumerations.filter(enumerationIsPublic(true)).map(toNSEnumDeclaration).join('\n');
  const enumerationsSection:string = codeSectionForCodeString(enumerationsStr);

  const blocksStr:string = file.blockTypes.filter(blockTypeIsPublic(true)).map(toBlockTypeDeclaration).join('\n');
  const blocksSection:string = codeSectionForCodeString(blocksStr);

  const functionsSection = codeSectionForCodeString(headerFunctionsSection(file.functions));

  const classSection = file.classes.map(headerClassSection).join('\n\n');

  const namespacesStr:string = file.namespaces.map(toNamespaceContents).join('\n');
  const namespacesSection:string = codeSectionForCodeString(namespacesStr);

  const contents:string = commentsSection + importsSection + declarationsSection + enumerationsSection + blocksSection + functionsSection + namespacesSection + classSection + '\n\n';
  return Maybe.Just<string>(contents);
}

function toMemorySemanticString(memorySemantic:ObjC.MemorySemantic):string {
  return memorySemantic.match(returnString('assign'),
                              returnString('copy'),
                              returnString('strong'),
                              returnString('__unsafe_unretained'),
                              returnString('weak'));
}

function toStaticConstantString(constant:ObjC.Constant):string {
  const constantComments = constant.comments.map(toCommentString).join('\n');
  const constantCommentsSection = codeSectionForCodeStringWithoutExtraSpace(constantComments);

  return constantCommentsSection + 'static ' + toMemorySemanticString(constant.memorySemantic) + ' ' + constant.type.reference + ' const ' + constant.name + ' = ' + constant.value + ';';
}

function qualifierForFunction(functionDefinition:ObjC.Function):string {
  if (functionDefinition.isPublic) {
    return 'extern';
  } else {
    return 'static';
  }
}

function returnVoidWithASpace():string {
  return returnVoid() + ' ';
}

function toFunctionReturnTypeString(returnType:Maybe.Maybe<ObjC.Type>):string {
  return renderableTypeReferenceNestingSubsequentToken(toTypeString(returnType));
}

function toFunctionParameterString(functionParameter:ObjC.FunctionParameter):string {
  return renderableTypeReferenceNestingSubsequentToken(functionParameter.type.reference) + functionParameter.name;
}

function declarationCommentsForFunctionImplementation(functionDefinition:ObjC.Function):string {
  if (!functionDefinition.isPublic) {
    const functionDeclarationComments = functionDefinition.comments.map(toCommentString).join('\n');
    const functionDeclarationCommentsSection = codeSectionForCodeStringWithoutExtraSpace(functionDeclarationComments);

    return functionDeclarationCommentsSection;
  } else {
    return '';
  }
}

function functionDeclarationForFunction(functionDefinition:ObjC.Function):string {
  return qualifierForFunction(functionDefinition) + ' ' + toFunctionReturnTypeString(functionDefinition.returnType) + functionDefinition.name + '(' + functionDefinition.parameters.map(toFunctionParameterString).join(', ') + ')';
}

const BEGINNING_OF_DEFINE = '#';

function indentFunctionCode(indentFunc:(str:string) => string, code:string):string {
  if (code.charAt(0) !== BEGINNING_OF_DEFINE) {
    return indentFunc(code);
  } else {
    return code;
  }
}

export function toFunctionImplementationString(functionDefinition:ObjC.Function):string {
  return declarationCommentsForFunctionImplementation(functionDefinition) + functionDeclarationForFunction(functionDefinition) + ' {\n' +
    functionDefinition.code.map(FunctionUtils.pApplyf2(StringUtils.indent(2), indentFunctionCode)).join('\n') +
    '\n}';
}

function toInternalPropertyModifierString(modifier:ObjC.PropertyModifier):string {
  return modifier.match(returnString(''),
                        returnString(''),
                        returnString(''),
                        returnString(''),
                        returnString(''),
                        returnString(''),
                        returnString(''),
                        returnString(''),
                        returnString('__strong'),
                        returnString('__weak'),
                        returnString('__unsafe_unretained'));
}

function toInternalPropertyString(property:ObjC.Property):string {
  const propertyComments = property.comments.map(toCommentString).join('\n');
  const propertyCommentsSection = codeSectionForCodeStringWithoutExtraSpace(propertyComments);
  const memorySemantics:string = property.modifiers.map(toInternalPropertyModifierString).join(' ');
  const typeString:string = renderableTypeReferenceNestingSubsequentToken(property.returnType.reference);
  const name:string = '_' + property.name;
  return propertyCommentsSection + (memorySemantics.length > 0 ? memorySemantics + ' ' : '') + typeString + name + ';';
}

function toDiagnosticIgnoreString(diagnosticIgnore:string):string {
  return '#pragma GCC diagnostic ignored "' + diagnosticIgnore + '"';
}

function implementationClassSection(classInfo:ObjC.Class):string {
  const prefixClassMacrosStr:string = prefixClassMacros(classInfo).join('\n');
  const prefixClassMacrosSection:string = prefixClassMacrosStr !== '' ? prefixClassMacrosStr + '\n\n' : '';

  const classSection:string = '@implementation ' + classInfo.name + '\n';
  const internalPropertiesStr:string = classInfo.internalProperties.filter(implementationNeedsToIncludeInternalProperty).map(toInternalPropertyString).map(StringUtils.indent(2)).join('\n');
  const internalPropertiesSection:string = internalPropertiesStr !== '' ? '{\n' + internalPropertiesStr + '\n}\n\n' : '\n';
  const classMethodsStr:string = classInfo.classMethods.map(toClassMethodImplementationString).join('\n\n');
  const classMethodsSection = codeSectionForCodeString(classMethodsStr);
  const instanceMethodsSection = classInfo.instanceMethods.map(toInstanceMethodImplementationString).join('\n\n');

  const postfixClassMacrosStr:string = postfixClassMacros(classInfo).join('\n');
  const postfixClassMacrosSection:string = postfixClassMacrosStr !== '' ? '\n\n' + postfixClassMacrosStr : '';

  return prefixClassMacrosSection + classSection + internalPropertiesSection + classMethodsSection + instanceMethodsSection + '\n\n@end' + postfixClassMacrosSection;
}

function codeSectionForCodeString(codeStr:string):string {
  return codeStr.length > 0 ? codeStr + '\n\n' : '';
}

function codeSectionForCodeStringWithoutExtraSpace(codeStr:string):string {
  return codeStr.length > 0 ? codeStr + '\n' : '';
}

function importIsPublic(isPublic:boolean):(importToCheck:ObjC.Import) => boolean {
  return function(importToCheck:ObjC.Import):boolean {
    return importToCheck.isPublic == isPublic;
  };
}

function willHaveImplementationForClass(classInfo:ObjC.Class):boolean {
  return classInfo.classMethods.length > 0 || classInfo.instanceMethods.length > 0 || classInfo.internalProperties.filter(implementationNeedsToIncludeInternalProperty).length > 0;
}

function willHaveImplementationForFunction(func:ObjC.Function):boolean {
  return func.code.length > 0 || !func.isPublic;
}

function fileHasImplementationCodeToRender(file:Code.File):boolean {
  const importsRequireImplementation:boolean = file.imports.filter(importIsPublic(false)).length > 0;
  const enumerationsRequireImplementation:boolean = file.enumerations.filter(enumerationIsPublic(false)).length > 0;
  const blockTypesRequireImplementation:boolean = file.blockTypes.filter(blockTypeIsPublic(false)).length > 0;
  const functionsRequireImplementation:boolean = file.functions.filter(willHaveImplementationForFunction).length > 0;
  const classesRequireImplementation:boolean = file.classes.filter(willHaveImplementationForClass).length > 0;

  return importsRequireImplementation ||
         enumerationsRequireImplementation ||
         blockTypesRequireImplementation ||
         functionsRequireImplementation ||
         classesRequireImplementation;
}

function diagnosticIgnoreSectionFromStr(str:string):string {
  if (str.length > 0) {
    return '#pragma clang diagnostic push\n' + str + '\n\n';
  } else {
    return '';
  }
}

function diagnosticIgnoreEndSectionFromStr(str:string):string {
  if (str.length > 0) {
    return '#pragma clang diagnostic pop\n';
  } else {
    return '';
  }
}

function arcCompileFlagCheckSection():string {
  return "#if  ! __has_feature(objc_arc)\n"+
         "#error This file must be compiled with ARC. Use -fobjc-arc flag (or convert project to ARC).\n"+
         "#endif\n\n";
}

export function renderImplementation(file:Code.File):Maybe.Maybe<string> {
  if (fileHasImplementationCodeToRender(file)) {
    const commentsStr = file.comments.map(toCommentString).join('\n');
    const commentsSection = codeSectionForCodeString(commentsStr);

    const imports = file.imports.filter(isPrivateImport).map(toImportString);
    const importStr = arrayWithDuplicatesRemoved(imports).join('\n');
    const importsSection = codeSectionForCodeString(importStr);

    const diagnosticIgnoresStr = file.diagnosticIgnores.map(toDiagnosticIgnoreString).join('\n');
    const diagnosticIgnoresSection = diagnosticIgnoreSectionFromStr(diagnosticIgnoresStr);
    const diagnosticIgnoresEndSection = diagnosticIgnoreEndSectionFromStr(diagnosticIgnoresStr);

    const staticConstantsStr = file.staticConstants.map(toStaticConstantString).join('\n');
    const staticConstantsSection = codeSectionForCodeString(staticConstantsStr);

    const enumerationsStr = file.enumerations.filter(enumerationIsPublic(false)).map(toNSEnumDeclaration).join('\n');
    const enumerationsSection = codeSectionForCodeString(enumerationsStr);

    const blocksStr:string = file.blockTypes.filter(blockTypeIsPublic(false)).map(toBlockTypeDeclaration).join('\n');
    const blocksSection:string = codeSectionForCodeString(blocksStr);

    const functionStr = file.functions.map(toFunctionImplementationString).join('\n\n');
    const functionsSection = codeSectionForCodeString(functionStr);

    const classesSection = file.classes.map(implementationClassSection).join('\n\n');

    const contents:string = commentsSection + arcCompileFlagCheckSection() + importsSection + diagnosticIgnoresSection + staticConstantsSection + enumerationsSection + blocksSection + functionsSection + classesSection + '\n' + diagnosticIgnoresEndSection + '\n';

    return Maybe.Just<string>(contents);
  } else {
    return Maybe.Nothing<string>();
  }
}
