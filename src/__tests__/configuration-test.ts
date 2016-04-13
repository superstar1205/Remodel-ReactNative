/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

///<reference path='../type-defs/jasmine.d.ts'/>
///<reference path='../type-defs/jasmine-test-additions.d.ts'/>
///<reference path='../type-defs/node-0.11.d.ts'/>

import Configuration = require('../configuration');
import Either = require('../either');
import Error = require('../error');
import File = require('../file');
import List = require('../list');
import ObjC = require('../objc');
import Maybe = require('../maybe');
import path = require('path');
import PathUtils = require('../path-utils');

const ONE_LEVEL_UP = path.resolve(__dirname, '../');
const PATH_BEFORE_FILES = File.getAbsoluteFilePath(ONE_LEVEL_UP + '/plugins/');

describe('Configuration', function() {
  describe('#parseConfig', function() {
    it('should give the default plugins when there is an empty object in the ' +
       'config', function() {
      const contents = File.Contents('{\n}');
      const configurationContext:Configuration.ConfigurationContext = {
        basePlugins: List.of<string>('some-plugin', 'another-plugin'),
        baseIncludes: List.of<string>('SomePlugin', 'AnotherPlugin')
      };
      const result = Configuration.parseConfig(contents, File.getAbsoluteFilePath('file/path/to/something'), configurationContext);
      const expectedConfigs = List.of<Configuration.PluginConfig>(
        {absolutePath: PathUtils.getAbsolutePathFromDirectoryAndRelativePath(PATH_BEFORE_FILES, 'some-plugin')},
        {absolutePath: PathUtils.getAbsolutePathFromDirectoryAndRelativePath(PATH_BEFORE_FILES, 'another-plugin')}
      );
      const expectedConfig:Configuration.GenerationConfig = {
        baseClassName:'NSObject',
        baseClassLibraryName:Maybe.Nothing<string>(),
        diagnosticIgnores:List.of<string>(),
        pluginConfigs:expectedConfigs,
        defaultIncludes:List.of<string>(
          'SomePlugin',
          'AnotherPlugin'
        )
      };
      const expectedResult = Either.Right(expectedConfig);

      expect(result).toEqualJSON(expectedResult);
    });

    it('should give the default plugins and the given base class when the base ' +
       'class is explicitly given', function() {
      const fileContents =
         '{\n' +
         '  "customBaseClass": { "className": "RMSomeObject" }\n' +
         '}\n';
      const configurationContext:Configuration.ConfigurationContext = {
        basePlugins: List.of<string>('some-plugin', 'another-plugin'),
        baseIncludes: List.of<string>('SomePlugin', 'AnotherPlugin')
      };
      const contents = File.Contents(fileContents);
      const result = Configuration.parseConfig(contents, File.getAbsoluteFilePath('file/path/to/something'), configurationContext);
      const expectedConfigs = List.of<Configuration.PluginConfig>(
        {absolutePath: PathUtils.getAbsolutePathFromDirectoryAndRelativePath(PATH_BEFORE_FILES, 'some-plugin')},
        {absolutePath: PathUtils.getAbsolutePathFromDirectoryAndRelativePath(PATH_BEFORE_FILES, 'another-plugin')}
      );
      const expectedConfig:Configuration.GenerationConfig = {
        baseClassName:'RMSomeObject',
        baseClassLibraryName:Maybe.Nothing<string>(),
        diagnosticIgnores:List.of<string>(),
        pluginConfigs:expectedConfigs,
        defaultIncludes:List.of<string>(
          'SomePlugin',
          'AnotherPlugin'
        )
      };
      const expectedResult = Either.Right(expectedConfig);

      expect(result).toEqualJSON(expectedResult);
    });

    it('should give the default plugins and the given diagnostic ignores ' +
       'when some ignores are explicitly given', function() {
      const fileContents =
         '{\n' +
         '  "diagnosticIgnores": ["-Wprotocol", "-Wincomplete-implementation"]\n' +
         '}\n';
      const contents = File.Contents(fileContents);
      const configurationContext:Configuration.ConfigurationContext = {
        basePlugins: List.of<string>('some-plugin', 'another-plugin'),
        baseIncludes: List.of<string>('SomePlugin', 'AnotherPlugin')
      };
      const result = Configuration.parseConfig(contents, File.getAbsoluteFilePath('file/path/to/something'), configurationContext);
      const expectedConfigs = List.of<Configuration.PluginConfig>(
        {absolutePath: PathUtils.getAbsolutePathFromDirectoryAndRelativePath(PATH_BEFORE_FILES, 'some-plugin')},
        {absolutePath: PathUtils.getAbsolutePathFromDirectoryAndRelativePath(PATH_BEFORE_FILES, 'another-plugin')}
      );
      const expectedConfig:Configuration.GenerationConfig = {
        baseClassName:'NSObject',
        baseClassLibraryName:Maybe.Nothing<string>(),
        diagnosticIgnores:List.of<string>('-Wprotocol', '-Wincomplete-implementation'),
        pluginConfigs:expectedConfigs,
        defaultIncludes:List.of<string>(
          'SomePlugin',
          'AnotherPlugin'
        )
      };
      const expectedResult = Either.Right(expectedConfig);

      expect(result).toEqualJSON(expectedResult);
    });

    it('should exclude one of the base plugins when told ' +
       'to exclude it in the config file', function() {
      const fileContents =
         '{\n' +
         '  "defaultExcludes": [\n' +
         '    "SomePlugin"' +
         '  ]\n' +
         '}\n';
      const contents = File.Contents(fileContents);
      const configurationContext:Configuration.ConfigurationContext = {
        basePlugins: List.of<string>('some-plugin', 'another-plugin'),
        baseIncludes: List.of<string>('SomePlugin', 'AnotherPlugin')
      };
      const result = Configuration.parseConfig(contents, File.getAbsoluteFilePath('file/path/to/something'), configurationContext);
      const expectedConfigs = List.of<Configuration.PluginConfig>(
        {absolutePath: PathUtils.getAbsolutePathFromDirectoryAndRelativePath(PATH_BEFORE_FILES, 'some-plugin')},
        {absolutePath: PathUtils.getAbsolutePathFromDirectoryAndRelativePath(PATH_BEFORE_FILES, 'another-plugin')}
      );
      const expectedConfig:Configuration.GenerationConfig = {
        baseClassName:'NSObject',
        baseClassLibraryName:Maybe.Nothing<string>(),
        diagnosticIgnores:List.of<string>(),
        pluginConfigs:expectedConfigs,
        defaultIncludes:List.of<string>(
          'AnotherPlugin'
        )
      };
      const expectedResult = Either.Right(expectedConfig);

      expect(result).toEqualJSON(expectedResult);
    });

    it('should include one of the base plugins when told ' +
       'to include it in the config file', function() {
      const fileContents =
         '{\n' +
         '  "defaultIncludes": [\n' +
         '    "AnotherPlugin"' +
         '  ]\n' +
         '}\n';
      const contents = File.Contents(fileContents);
      const configurationContext:Configuration.ConfigurationContext = {
        basePlugins: List.of<string>('some-plugin', 'another-plugin'),
        baseIncludes: List.of<string>('SomePlugin')
      };
      const result = Configuration.parseConfig(contents, File.getAbsoluteFilePath('file/path/to/something'), configurationContext);
      const expectedConfigs = List.of<Configuration.PluginConfig>(
        {absolutePath: PathUtils.getAbsolutePathFromDirectoryAndRelativePath(PATH_BEFORE_FILES, 'some-plugin')},
        {absolutePath: PathUtils.getAbsolutePathFromDirectoryAndRelativePath(PATH_BEFORE_FILES, 'another-plugin')}
      );
      const expectedConfig:Configuration.GenerationConfig = {
        baseClassName:'NSObject',
        baseClassLibraryName:Maybe.Nothing<string>(),
        diagnosticIgnores:List.of<string>(),
        pluginConfigs:expectedConfigs,
        defaultIncludes:List.of<string>(
          'SomePlugin',
          'AnotherPlugin'
        )
      };
      const expectedResult = Either.Right(expectedConfig);

      expect(result).toEqualJSON(expectedResult);
    });

    it('should allow the including of custom plugins', function() {
      const fileContents =
         '{\n' +
         '  "defaultIncludes": [\n' +
         '    "CustomPlugin"' +
         '  ],\n' +
         '  "customPluginPaths": [\n' +
         '    "/some/path/to/plugin"' +
         '  ]\n' +
         '}\n';
      const contents = File.Contents(fileContents);
      const configurationContext:Configuration.ConfigurationContext = {
        basePlugins: List.of<string>('some-plugin', 'another-plugin'),
        baseIncludes: List.of<string>('SomePlugin', 'AnotherPlugin')
      };
      const result = Configuration.parseConfig(contents, File.getAbsoluteFilePath('file/path/to/something/.valueConfigFile'), configurationContext);
      const expectedConfigs = List.of<Configuration.PluginConfig>(
        {absolutePath: PathUtils.getAbsolutePathFromDirectoryAndRelativePath(PATH_BEFORE_FILES, 'some-plugin')},
        {absolutePath: PathUtils.getAbsolutePathFromDirectoryAndRelativePath(PATH_BEFORE_FILES, 'another-plugin')},
        {absolutePath: File.getAbsoluteFilePath('file/path/to/something/some/path/to/plugin')}
      );
      const expectedConfig:Configuration.GenerationConfig = {
        baseClassName:'NSObject',
        baseClassLibraryName:Maybe.Nothing<string>(),
        diagnosticIgnores:List.of<string>(),
        pluginConfigs:expectedConfigs,
        defaultIncludes:List.of<string>(
          'SomePlugin',
          'AnotherPlugin',
          'CustomPlugin'
        )
      };
      const expectedResult = Either.Right(expectedConfig);

      expect(result).toEqualJSON(expectedResult);
    });

    it('should give an error when given a malformed config file', function() {
      const contents = File.Contents('{\n');
      const configurationContext:Configuration.ConfigurationContext = {
        basePlugins: List.of<string>('some-plugin', 'another-plugin'),
        baseIncludes: List.of<string>('SomePlugin', 'AnotherPlugin')
      };
      const result = Configuration.parseConfig(contents, File.getAbsoluteFilePath('file/path/to/something'), configurationContext);
      const expectedResult = Either.Left<Error.Error[], List.List<Configuration.PluginConfig>>([Error.Error('Configuration file is malformed and unparseable')]);
      expect(result).toEqualJSON(expectedResult);
    });
  });
});
