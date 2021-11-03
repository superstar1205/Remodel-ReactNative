/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as AlgebraicType from './algebraic-type';
import * as AlgebraicTypeCreation from './algebraic-type-creation';
import * as AlgebraicTypeParser from './algebraic-type-parser';
import * as CommandLine from './commandline';
import * as Configuration from './configuration';
import * as Either from './either';
import * as Error from './error';
import * as File from './file';
import * as FileFinder from './file-finder';
import * as FileWriter from './file-writer';
import * as List from './list';
import * as Logging from './logging';
import * as LoggingSequenceUtils from './logged-sequence-utils';
import * as Maybe from './maybe';
import * as OutputControl from './output-control';
import * as PathUtils from './path-utils';
import * as PluginInclusionUtils from './plugin-inclusion-utils';
import * as Promise from './promise';
import * as ReadFileUtils from './file-logged-sequence-read-utils';
import * as RequirePlugin from './require-plugin';
import * as WriteFileUtils from './file-logged-sequence-write-utils';

interface AlgebraicTypeCreationContext {
  baseClassName: string;
  baseClassLibraryName: string | null;
  diagnosticIgnores: List.List<string>;
  plugins: List.List<AlgebraicType.Plugin>;
  defaultIncludes: List.List<string>;
}

interface PathAndTypeInfo {
  path: File.AbsoluteFilePath;
  typeInformation: AlgebraicType.Type;
}

interface GenerationOptions {
  outputPath: File.AbsoluteFilePath | null;
  outputFlags: OutputControl.OutputFlags;
}

const BASE_INCLUDES: List.List<string> = List.of(
  'AlgebraicTypeInitialization',
  'RMAssertNullability',
  'RMCopying',
  'RMDescription',
  'RMEquality',
  'RMInitNewUnavailable',
  'VoidMatching',
);

const BASE_PLUGINS: List.List<string> = List.of(
  'algebraic-type-initialization',
  'assert-nullability',
  'assume-nonnull',
  'coding',
  'copying',
  'copying-type-safety',
  'description',
  'equality',
  'init-new-unavailable',
  'subclassing-restricted',
  'use-cpp',
  'algebraic-type-matching-bool',
  'algebraic-type-matching-double',
  'algebraic-type-matching-generic',
  'algebraic-type-matching-integer',
  'algebraic-type-matching-void',
  'algebraic-type-case-matching',
  'algebraic-type-templated-matching',
);

function evaluateUnparsedAlgebraicTypeCreationRequest(
  request: ReadFileUtils.UnparsedObjectCreationRequest,
): Either.Either<Error.Error[], PathAndTypeInfo> {
  const parseResult: Either.Either<Error.Error[], AlgebraicType.Type> =
    AlgebraicTypeParser.parse(File.getContents(request.fileContents));
  return Either.map(function (foundType: AlgebraicType.Type) {
    return {path: request.path, typeInformation: foundType};
  }, parseResult);
}

function parseValues(
  either: Either.Either<
    Error.Error[],
    ReadFileUtils.UnparsedObjectCreationRequest
  >,
): Promise.Future<
  Logging.Context<Either.Either<Error.Error[], PathAndTypeInfo>>
> {
  return Promise.munit(
    Logging.munit(
      Either.mbind(evaluateUnparsedAlgebraicTypeCreationRequest, either),
    ),
  );
}

function typeInformationContainingDefaultIncludes(
  typeInformation: AlgebraicType.Type,
  defaultIncludes: List.List<string>,
): AlgebraicType.Type {
  return {
    annotations: typeInformation.annotations,
    comments: typeInformation.comments,
    excludes: typeInformation.excludes,
    includes: PluginInclusionUtils.includesContainingDefaultIncludes(
      typeInformation.includes,
      typeInformation.excludes,
      defaultIncludes,
    ),
    libraryName: typeInformation.libraryName,
    name: typeInformation.name,
    typeLookups: typeInformation.typeLookups,
    subtypes: typeInformation.subtypes,
  };
}

function processAlgebraicTypeCreationRequest(
  options: GenerationOptions,
  future: Promise.Future<
    Either.Either<Error.Error[], AlgebraicTypeCreationContext>
  >,
  either: Either.Either<Error.Error[], PathAndTypeInfo>,
): Promise.Future<
  Logging.Context<Either.Either<Error.Error[], FileWriter.FileWriteRequest>>
> {
  return Promise.map(function (
    creationContextEither: Either.Either<
      Error.Error[],
      AlgebraicTypeCreationContext
    >,
  ) {
    return Logging.munit(
      Either.mbind(function (pathAndTypeInfo: PathAndTypeInfo) {
        return Either.mbind(function (
          creationContext: AlgebraicTypeCreationContext,
        ) {
          const request: AlgebraicTypeCreation.Request = {
            diagnosticIgnores: creationContext.diagnosticIgnores,
            baseClassLibraryName: creationContext.baseClassLibraryName,
            baseClassName: creationContext.baseClassName,
            path: pathAndTypeInfo.path,
            outputPath: options.outputPath,
            outputFlags: options.outputFlags,
            typeInformation: typeInformationContainingDefaultIncludes(
              pathAndTypeInfo.typeInformation,
              creationContext.defaultIncludes,
            ),
          };

          return AlgebraicTypeCreation.fileWriteRequest(
            request,
            creationContext.plugins,
          );
        },
        creationContextEither);
      }, either),
    );
  },
  future);
}

function pluginsFromPluginConfigs(
  pluginConfigs: List.List<Configuration.PluginConfig>,
): Either.Either<Error.Error[], List.List<AlgebraicType.Plugin>> {
  return List.foldr(
    function (
      soFar: Either.Either<Error.Error[], List.List<AlgebraicType.Plugin>>,
      config: Configuration.PluginConfig,
    ): Either.Either<Error.Error[], List.List<AlgebraicType.Plugin>> {
      return Either.mbind(function (
        list: List.List<AlgebraicType.Plugin>,
      ): Either.Either<Error.Error[], List.List<AlgebraicType.Plugin>> {
        return Either.map(function (
          maybePlugin: AlgebraicType.Plugin | null,
        ): List.List<AlgebraicType.Plugin> {
          return Maybe.match(
            function (plugin: AlgebraicType.Plugin) {
              return List.cons(plugin, list);
            },
            function () {
              return list;
            },
            maybePlugin,
          );
        },
        RequirePlugin.requireAlgebraicTypePlugin(config.absolutePath));
      },
      soFar);
    },
    Either.Right<Error.Error[], List.List<AlgebraicType.Plugin>>(
      List.of<AlgebraicType.Plugin>(),
    ),
    pluginConfigs,
  );
}

function getAlgebraicTypeCreationContext(
  findConfigFuture: Promise.Future<File.AbsoluteFilePath | null>,
  parsedArgs: CommandLine.Arguments,
): Promise.Future<Either.Either<Error.Error[], AlgebraicTypeCreationContext>> {
  return Promise.mbind(function (
    maybePath: File.AbsoluteFilePath | null,
  ): Promise.Future<
    Either.Either<Error.Error[], AlgebraicTypeCreationContext>
  > {
    const configurationContext: Configuration.ConfigurationContext = {
      basePlugins: BASE_PLUGINS,
      baseIncludes: BASE_INCLUDES,
    };
    const configFuture: Promise.Future<
      Either.Either<Error.Error[], Configuration.GenerationConfig>
    > = Configuration.generateConfig(maybePath, configurationContext);

    return Promise.map(function (
      either: Either.Either<Error.Error[], Configuration.GenerationConfig>,
    ): Either.Either<Error.Error[], AlgebraicTypeCreationContext> {
      return Either.match(
        function (
          error: Error.Error[],
        ): Either.Either<Error.Error[], AlgebraicTypeCreationContext> {
          return Either.Left<Error.Error[], AlgebraicTypeCreationContext>(
            error,
          );
        },
        function (
          configuration: Configuration.GenerationConfig,
        ): Either.Either<Error.Error[], AlgebraicTypeCreationContext> {
          const pluginsEither: Either.Either<
            Error.Error[],
            List.List<AlgebraicType.Plugin>
          > = pluginsFromPluginConfigs(configuration.pluginConfigs);
          return Either.map(function (
            plugins: List.List<AlgebraicType.Plugin>,
          ): AlgebraicTypeCreationContext {
            return {
              baseClassName: configuration.baseClassName,
              baseClassLibraryName: configuration.baseClassLibraryName,
              diagnosticIgnores: configuration.diagnosticIgnores,
              plugins: plugins,
              defaultIncludes: List.fromArray<string>(
                PluginInclusionUtils.includesContainingDefaultIncludes(
                  parsedArgs.includes,
                  parsedArgs.excludes,
                  configuration.defaultIncludes,
                ),
              ),
            };
          },
          pluginsEither);
        },
        either,
      );
    },
    configFuture);
  },
  findConfigFuture);
}

function outputDirectory(
  directoryRunFrom: string,
  outputPath: string | undefined,
): File.AbsoluteFilePath | null {
  if (outputPath === undefined || outputPath === '') {
    return null;
  } else {
    return PathUtils.getAbsolutePathFromDirectoryAndAbsoluteOrRelativePath(
      File.getAbsoluteFilePath(directoryRunFrom),
      outputPath,
    );
  }
}

export function generate(
  directoryRunFrom: string,
  optionalConfigPath: string | undefined,
  parsedArgs: CommandLine.Arguments,
): Promise.Future<List.List<WriteFileUtils.ConsoleOutputResults>> {
  const promises = parsedArgs.givenPaths.map((givenPath) => {
    const requestedPath: File.AbsoluteFilePath =
      PathUtils.getAbsolutePathFromDirectoryAndAbsoluteOrRelativePath(
        File.getAbsoluteFilePath(directoryRunFrom),
        givenPath,
      );
    const outputPath: File.AbsoluteFilePath | null = outputDirectory(
      directoryRunFrom,
      parsedArgs.outputPath,
    );

    const configPath = optionalConfigPath
      ? FileFinder.findConfigAtPath(
          File.getAbsoluteFilePath(optionalConfigPath),
        )
      : FileFinder.searchForConfig('.algebraicTypeConfig', requestedPath);

    const algebraicTypeCreationContextFuture = getAlgebraicTypeCreationContext(
      configPath,
      parsedArgs,
    );

    const readFileSequence = ReadFileUtils.loggedSequenceThatReadsFiles(
      requestedPath,
      'adtValue',
    );

    const parsedSequence = LoggingSequenceUtils.mapLoggedSequence(
      readFileSequence,
      parseValues,
    );

    const options: GenerationOptions = {
      outputPath: outputPath,
      outputFlags: parsedArgs.outputFlags,
    };

    const pluginProcessedSequence = LoggingSequenceUtils.mapLoggedSequence(
      parsedSequence,
      (either) =>
        processAlgebraicTypeCreationRequest(
          options,
          algebraicTypeCreationContextFuture,
          either,
        ),
    );

    return WriteFileUtils.evaluateObjectFileWriteRequestSequence(
      parsedArgs,
      pluginProcessedSequence,
    );
  });

  return Promise.all(List.fromArray(promises));
}
