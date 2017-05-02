/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import CommandLine = require('./commandline');
import Configuration = require('./configuration');
import Either = require('./either');
import Error = require('./error');
import File = require('./file');
import FileFinder = require('./file-finder');
import FileWriter = require('./file-writer');
import FunctionUtils = require('./function-utils');
import List = require('./list');
import Logging = require('./logging');
import LoggingSequenceUtils = require('./logged-sequence-utils');
import Maybe = require('./maybe');
import ObjC = require('./objc');
import ReadFileUtils = require('./file-logged-sequence-read-utils');
import RequirePlugin = require('./require-plugin');
import PathUtils = require('./path-utils');
import PluginInclusionUtils = require('./plugin-inclusion-utils');
import Promise = require('./promise');
import ObjectSpec = require('./object-spec');
import ObjectSpecCreation = require('./object-spec-creation');
import ObjectSpecParser = require('./object-spec-parser');
import WriteFileUtils = require('./file-logged-sequence-write-utils');

const BASE_INCLUDES:List.List<string> = List.of(
  'RMCopying',
  'RMDescription',
  'RMEquality',
  'RMImmutableProperties'
);

const BASE_PLUGINS:List.List<string> = List.of(
  'assume-nonnull',
  'builder',
  'coding',
  'copying',
  'description',
  'equality',
  'fetch-status',
  'immutable-properties',
  'use-cpp'
);

interface ObjectSpecCreationContext {
  baseClassName:string;
  baseClassLibraryName:Maybe.Maybe<string>;
  diagnosticIgnores:List.List<string>;
  plugins:List.List<ObjectSpec.Plugin>;
  defaultIncludes:List.List<string>;
}

type ObjectSpecExtension =
    "value" |
    "object";

interface PathAndTypeInfo {
  path: File.AbsoluteFilePath;
  typeInformation: ObjectSpec.Type;
}

function modifyFoundTypeBasedOnExtension(foundType:ObjectSpec.Type, extension:ObjectSpecExtension):ObjectSpec.Type {
  switch (extension) {
    case "value":
      foundType.includes = foundType.includes.concat(ObjectSpec.VALUE_OBJECT_SEMANTICS);
      break
    case "object":
      foundType.excludes = foundType.excludes.concat(ObjectSpec.VALUE_OBJECT_SEMANTICS);
      break
  }
  return foundType;
}

function evaluateUnparsedObjectSpecCreationRequest(extension: ObjectSpecExtension, request:ReadFileUtils.UnparsedObjectCreationRequest):Either.Either<Error.Error[], PathAndTypeInfo> {
  const parseResult:Either.Either<Error.Error[], ObjectSpec.Type> = ObjectSpecParser.parse(File.getContents(request.fileContents));
  return Either.match(function(errors:Error.Error[]) {
    return Either.Left<Error.Error[], PathAndTypeInfo>(errors.map(function(error:Error.Error) { return Error.Error('[' + File.getAbsolutePathString(request.path) + '] ' + Error.getReason(error)); }));
  }, function(foundType:ObjectSpec.Type) {
    return Either.Right<Error.Error[], PathAndTypeInfo>({path:request.path, typeInformation:modifyFoundTypeBasedOnExtension(foundType, extension)});
  }, parseResult);
}

function parseValues(extension: ObjectSpecExtension, either:Either.Either<Error.Error[], ReadFileUtils.UnparsedObjectCreationRequest>):Promise.Future<Logging.Context<Either.Either<Error.Error[], PathAndTypeInfo>>> {
  return Promise.munit(Logging.munit(Either.mbind(FunctionUtils.pApplyf2(extension, evaluateUnparsedObjectSpecCreationRequest), either)));
}

function typeInformationContainingDefaultIncludes(typeInformation:ObjectSpec.Type, defaultIncludes:List.List<string>):ObjectSpec.Type {
  return {
    annotations: typeInformation.annotations,
    attributes: typeInformation.attributes,
    comments: typeInformation.comments,
    excludes: typeInformation.excludes,
    includes: PluginInclusionUtils.includesContainingDefaultIncludes(typeInformation.includes, typeInformation.excludes, defaultIncludes),
    libraryName: typeInformation.libraryName,
    typeLookups: typeInformation.typeLookups,
    typeName: typeInformation.typeName
  };
}

function processObjectSpecCreationRequest(future:Promise.Future<Either.Either<Error.Error[], ObjectSpecCreationContext>>, either:Either.Either<Error.Error[], PathAndTypeInfo>):Promise.Future<Logging.Context<Either.Either<Error.Error[], FileWriter.FileWriteRequest>>> {
  return Promise.map(function(creationContextEither:Either.Either<Error.Error[], ObjectSpecCreationContext>) {
    return Logging.munit(Either.mbind(function(pathAndTypeInfo:PathAndTypeInfo) {
      return Either.mbind(function(creationContext:ObjectSpecCreationContext) {
        const request:ObjectSpecCreation.Request = {
          diagnosticIgnores:creationContext.diagnosticIgnores,
          baseClassLibraryName:creationContext.baseClassLibraryName,
          baseClassName:creationContext.baseClassName,
          path:pathAndTypeInfo.path,
          typeInformation:typeInformationContainingDefaultIncludes(pathAndTypeInfo.typeInformation, creationContext.defaultIncludes)
        };

        return ObjectSpecCreation.fileWriteRequest(request, creationContext.plugins);
      }, creationContextEither);
    }, either));
  }, future);
}

function pluginsFromPluginConfigs(pluginConfigs:List.List<Configuration.PluginConfig>):Either.Either<Error.Error[], List.List<ObjectSpec.Plugin>> {
  return List.foldr(function(soFar:Either.Either<Error.Error[], List.List<ObjectSpec.Plugin>>, config:Configuration.PluginConfig):Either.Either<Error.Error[], List.List<ObjectSpec.Plugin>> {
    return Either.mbind(function(list:List.List<ObjectSpec.Plugin>):Either.Either<Error.Error[], List.List<ObjectSpec.Plugin>> {
      return Either.map(function(maybePlugin:Maybe.Maybe<ObjectSpec.Plugin>):List.List<ObjectSpec.Plugin> {
        return Maybe.match(function(plugin:ObjectSpec.Plugin) {
                              return List.cons(plugin, list);
                            },function() {
                              return list;
                            }, maybePlugin);
                          }, RequirePlugin.requireObjectSpecPlugin(config.absolutePath));
    }, soFar);
  }, Either.Right<Error.Error[], List.List<ObjectSpec.Plugin>>(List.of<ObjectSpec.Plugin>()), pluginConfigs);
}

function getObjectSpecCreationContext(valueObjectConfigPathFuture:Promise.Future<Maybe.Maybe<File.AbsoluteFilePath>>):Promise.Future<Either.Either<Error.Error[], ObjectSpecCreationContext>> {
  return Promise.mbind(function(maybePath:Maybe.Maybe<File.AbsoluteFilePath>):Promise.Future<Either.Either<Error.Error[], ObjectSpecCreationContext>> {
    const configurationContext:Configuration.ConfigurationContext = {
      basePlugins: BASE_PLUGINS,
      baseIncludes: BASE_INCLUDES
    };
    const configFuture:Promise.Future<Either.Either<Error.Error[], Configuration.GenerationConfig>> = Configuration.generateConfig(maybePath, configurationContext);
    return Promise.map(function(either:Either.Either<Error.Error[], Configuration.GenerationConfig>) {
      return Either.mbind(function(configuration:Configuration.GenerationConfig):Either.Either<Error.Error[], ObjectSpecCreationContext> {
        const pluginsEither = pluginsFromPluginConfigs(configuration.pluginConfigs);
        return Either.map(function(plugins:List.List<ObjectSpec.Plugin>):ObjectSpecCreationContext {
          return {
            baseClassName:configuration.baseClassName,
            baseClassLibraryName:configuration.baseClassLibraryName,
            diagnosticIgnores:configuration.diagnosticIgnores,
            plugins:plugins,
            defaultIncludes:configuration.defaultIncludes
          };
        }, pluginsEither);
      }, either);
    }, configFuture);
  }, valueObjectConfigPathFuture);
}

function valueObjectConfigPathFuture(requestedPath:File.AbsoluteFilePath, configPathFromArguments:string): Promise.Future<Maybe.Maybe<File.AbsoluteFilePath>> {
  var absoluteValueObjectConfigPath: Promise.Future<Maybe.Maybe<File.AbsoluteFilePath>>;
  if (configPathFromArguments === undefined) {
      absoluteValueObjectConfigPath = FileFinder.findConfig('.valueObjectConfig', requestedPath);
  } else {
      absoluteValueObjectConfigPath = Promise.munit(Maybe.Just(File.getAbsoluteFilePath(configPathFromArguments)));
  }
  return absoluteValueObjectConfigPath;
}

export function generate(directoryRunFrom:string, extension:ObjectSpecExtension, parsedArgs:CommandLine.Arguments):Promise.Future<WriteFileUtils.ConsoleOutputResults> {
    const requestedPath:File.AbsoluteFilePath = PathUtils.getAbsolutePathFromDirectoryAndAbsoluteOrRelativePath(File.getAbsoluteFilePath(directoryRunFrom), parsedArgs.givenPath);

    const valueObjectCreationContextFuture = getObjectSpecCreationContext(valueObjectConfigPathFuture(requestedPath, parsedArgs.valueObjectConfigPath));

    const extensionString:string = extension;
    const readFileSequence = ReadFileUtils.loggedSequenceThatReadsFiles(requestedPath, extensionString);

    const parsedSequence = LoggingSequenceUtils.mapLoggedSequence(readFileSequence,
                                                                  FunctionUtils.pApplyf2(extension, parseValues));

    const pluginProcessedSequence = LoggingSequenceUtils.mapLoggedSequence(parsedSequence,
                                                                           FunctionUtils.pApplyf2(valueObjectCreationContextFuture, processObjectSpecCreationRequest));

    return WriteFileUtils.evaluateObjectFileWriteRequestSequence(parsedArgs, pluginProcessedSequence);
}
