# Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

Feature: Outputting Value Objects

  @announce
  Scenario: Generating a class that prohibits subclassing
    Given a file named "project/values/RMFoo.value" with:
      """
      # some class comment
      RMFoo includes(RMSubclassingRestricted) {
        NSString* x
      }
      """
    And a file named "project/.valueObjectConfig" with:
      """
      { }
      """
    When I run `../../bin/generate project`
    And the file "project/values/RMFoo.h" should contain:
      """
      /**
       * This file is generated using the remodel generation script.
       * The name of the input file is RMFoo.value
       */

      #import <Foundation/Foundation.h>

      /**
       * some class comment
       */
      __attribute__((objc_subclassing_restricted)) 
      @interface RMFoo : NSObject <NSCopying>

      @property (nonatomic, readonly, copy) NSString *x;

      + (instancetype)new NS_UNAVAILABLE;

      - (instancetype)init NS_UNAVAILABLE;

      - (instancetype)initWithX:(NSString *)x NS_DESIGNATED_INITIALIZER;

      @end


      """

  @announce
  Scenario: Generating a class that allows subclassing
    Given a file named "project/values/RMFoo.value" with:
      """
      # some class comment
      RMFoo excludes(RMSubclassingRestricted) {
        NSString* x
      }
      """
    And a file named "project/.valueObjectConfig" with:
      """
      { }
      """
    When I run `../../bin/generate project`
    And the file "project/values/RMFoo.h" should contain:
      """
      /**
       * This file is generated using the remodel generation script.
       * The name of the input file is RMFoo.value
       */

      #import <Foundation/Foundation.h>

      /**
       * some class comment
       */
      @interface RMFoo : NSObject <NSCopying>

      @property (nonatomic, readonly, copy) NSString *x;

      + (instancetype)new NS_UNAVAILABLE;

      - (instancetype)init NS_UNAVAILABLE;

      - (instancetype)initWithX:(NSString *)x NS_DESIGNATED_INITIALIZER;

      @end


      """
