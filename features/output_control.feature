# Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

Feature: Controlling exactly what is output when generating files.

  @announce
  Scenario: Generating only headers
    Given a file named "project/values/RMValueTypeHeaderOnly.value" with:
      """
      # Simple file
      RMValueTypeHeaderOnly {
        BOOL doesUserLike
        NSString* identifier
      }
      """
    And a file named "project/.valueObjectConfig" with:
      """
      { }
      """
    When I run `../../bin/generate project --headers-only`
    Then the file "project/values/RMValueTypeHeaderOnly.h" should contain:
      """
      /**
       * This file is generated using the remodel generation script.
       * The name of the input file is RMValueTypeHeaderOnly.value
       */

      #import <Foundation/Foundation.h>

      /**
       * Simple file
       */
      @interface RMValueTypeHeaderOnly : NSObject <NSCopying>

      @property (nonatomic, readonly) BOOL doesUserLike;
      @property (nonatomic, readonly, copy) NSString *identifier;

      + (instancetype)new NS_UNAVAILABLE;

      - (instancetype)init NS_UNAVAILABLE;

      - (instancetype)initWithDoesUserLike:(BOOL)doesUserLike identifier:(NSString *)identifier NS_DESIGNATED_INITIALIZER;

      @end

      """
   And the file "project/values/RMValueTypeHeaderOnly.m" should not exist

  @announce
  Scenario: Generating only implementation
    Given a file named "project/values/RMValueTypeImplOnly.value" with:
      """
      # Simple file
      RMValueTypeImplOnly {
        BOOL doesUserLike
        NSString* identifier
      }
      """
    And a file named "project/.valueObjectConfig" with:
      """
      { }
      """
    When I run `../../bin/generate project --implementations-only`
   Then the file "project/values/RMValueTypeImplOnly.m" should contain:
      """
      /**
       * This file is generated using the remodel generation script.
       * The name of the input file is RMValueTypeImplOnly.value
       */

      #if  ! __has_feature(objc_arc)
      #error This file must be compiled with ARC. Use -fobjc-arc flag (or convert project to ARC).
      #endif

      #import "RMValueTypeImplOnly.h"

      @implementation RMValueTypeImplOnly

      - (instancetype)initWithDoesUserLike:(BOOL)doesUserLike identifier:(NSString *)identifier
      {
        if ((self = [super init])) {
          _doesUserLike = doesUserLike;
          _identifier = [identifier copy];
        }

        return self;
      }

      - (id)copyWithZone:(nullable NSZone *)zone
      {
        return self;
      }

      - (NSString *)description
      {
        return [NSString stringWithFormat:@"%@ - \n\t doesUserLike: %@; \n\t identifier: %@; \n", [super description], _doesUserLike ? @"YES" : @"NO", _identifier];
      }

      - (NSUInteger)hash
      {
        NSUInteger subhashes[] = {(NSUInteger)_doesUserLike, [_identifier hash]};
        NSUInteger result = subhashes[0];
        for (int ii = 1; ii < 2; ++ii) {
          unsigned long long base = (((unsigned long long)result) << 32 | subhashes[ii]);
          base = (~base) + (base << 18);
          base ^= (base >> 31);
          base *=  21;
          base ^= (base >> 11);
          base += (base << 6);
          base ^= (base >> 22);
          result = base;
        }
        return result;
      }

      - (BOOL)isEqual:(RMValueTypeImplOnly *)object
      {
        if (self == object) {
          return YES;
        } else if (object == nil || ![object isKindOfClass:[self class]]) {
          return NO;
        }
        return
          _doesUserLike == object->_doesUserLike &&
          (_identifier == object->_identifier ? YES : [_identifier isEqual:object->_identifier]);
      }

      @end

      """
   And the file "project/values/RMValueTypeImplOnly.h" should not exist

  @announce
  Scenario: Generating TemplatedMatching as single file
    Given a file named "project/values/RMValueTypeSingleFile.adtValue" with:
      """
      RMValueTypeSingleFile includes(TemplatedMatching) {
        optionOne
        %singleAttributeType attributeType="NSString *"
        optionTwo
      }
      """
    And a file named "project/.valueObjectConfig" with:
      """
      { }
      """
    When I run `../../bin/generate project --output-single-file`
    Then the file "project/values/RMValueTypeSingleFile.h" should contain:
      """
      /**
       * This file is generated using the remodel generation script.
       * The name of the input file is RMValueTypeSingleFile.adtValue
       */

      #import <FBValueObject/FBIvarBasedEqualityObject.h>
      #import <Foundation/Foundation.h>
      #import "RMValueTypeSingleFile.h"
      #ifdef __cplusplus
      #import <memory>
      #endif

      typedef void (^RMValueTypeSingleFileOptionOneMatchHandler)(void);
      typedef void (^RMValueTypeSingleFileOptionTwoMatchHandler)(void);

      __attribute__((objc_subclassing_restricted)) 
      @interface RMValueTypeSingleFile : FBIvarBasedEqualityObject

      + (instancetype)new NS_UNAVAILABLE;

      + (instancetype)optionOne;

      + (instancetype)optionTwo;

      - (instancetype)init NS_UNAVAILABLE;

      - (void)matchOptionOne:(NS_NOESCAPE __unsafe_unretained RMValueTypeSingleFileOptionOneMatchHandler)optionOneMatchHandler optionTwo:(NS_NOESCAPE __unsafe_unretained RMValueTypeSingleFileOptionTwoMatchHandler)optionTwoMatchHandler NS_SWIFT_NAME(match(optionOne:optionTwo:));

      @end

      #ifdef __cplusplus
      template <typename T>
      struct RMValueTypeSingleFileMatcher {

        static T match(RMValueTypeSingleFile *valueTypeSingleFile, T(^optionOneMatchHandler)(), T(^optionTwoMatchHandler)()) {
          NSCAssert(valueTypeSingleFile != nil, @"The ADT object valueTypeSingleFile is nil");
          __block std::unique_ptr<T> result;

          RMValueTypeSingleFileOptionOneMatchHandler matchOptionOne = ^(void) {
            result = std::make_unique<T>(optionOneMatchHandler());
          };

          RMValueTypeSingleFileOptionTwoMatchHandler matchOptionTwo = ^(void) {
            result = std::make_unique<T>(optionTwoMatchHandler());
          };

          [valueTypeSingleFile matchOptionOne:matchOptionOne optionTwo:matchOptionTwo];
          return *result;
        }
        static T match(T(^optionOneMatchHandler)(), T(^optionTwoMatchHandler)(), RMValueTypeSingleFile *valueTypeSingleFile) {
          return match(valueTypeSingleFile, optionOneMatchHandler, optionTwoMatchHandler);
        }
      };
      #endif // __cplusplus

      """
   And the file "project/values/RMValueTypeSingleFile.m" should contain:
      """
      /**
       * This file is generated using the remodel generation script.
       * The name of the input file is RMValueTypeSingleFile.adtValue
       */

      #if  ! __has_feature(objc_arc)
      #error This file must be compiled with ARC. Use -fobjc-arc flag (or convert project to ARC).
      #endif

      #import "RMValueTypeSingleFile.h"

      typedef NS_ENUM(NSUInteger, RMValueTypeSingleFileSubtypes) {
        RMValueTypeSingleFileSubtypesOptionOne,
        RMValueTypeSingleFileSubtypesOptionTwo
      };

      @implementation RMValueTypeSingleFile
      {
        RMValueTypeSingleFileSubtypes _subtype;
      }

      + (instancetype)optionOne
      {
        RMValueTypeSingleFile *object = [(id)self new];
        object->_subtype = RMValueTypeSingleFileSubtypesOptionOne;
        return object;
      }

      + (instancetype)optionTwo
      {
        RMValueTypeSingleFile *object = [(id)self new];
        object->_subtype = RMValueTypeSingleFileSubtypesOptionTwo;
        return object;
      }

      #if ENABLE_LOGGING
      - (NSString *)description
      {
        switch (_subtype) {
          case RMValueTypeSingleFileSubtypesOptionOne: {
            return [NSString stringWithFormat:@"%@ - optionOne \n", [super description]];
            break;
          }
          case RMValueTypeSingleFileSubtypesOptionTwo: {
            return [NSString stringWithFormat:@"%@ - optionTwo \n", [super description]];
            break;
          }
        }
      }
      #endif

      - (void)matchOptionOne:(NS_NOESCAPE __unsafe_unretained RMValueTypeSingleFileOptionOneMatchHandler)optionOneMatchHandler optionTwo:(NS_NOESCAPE __unsafe_unretained RMValueTypeSingleFileOptionTwoMatchHandler)optionTwoMatchHandler
      {
        switch (_subtype) {
          case RMValueTypeSingleFileSubtypesOptionOne: {
            if (optionOneMatchHandler) {
              optionOneMatchHandler();
            }
            break;
          }
          case RMValueTypeSingleFileSubtypesOptionTwo: {
            if (optionTwoMatchHandler) {
              optionTwoMatchHandler();
            }
            break;
          }
        }
      }

      @end

      """

  @announce
  Scenario: Generating Builder as single file
    Given a file named "project/values/RMValueTypeSingleFile.value" with:
      """
      RMValueTypeSingleFile includes(RMBuilder) {
        NSString *itemOne
        NSNumber *itemTwo
      }
      """
    And a file named "project/.valueObjectConfig" with:
      """
      { }
      """
    When I run `../../bin/generate project --output-single-file`
    Then the file "project/values/RMValueTypeSingleFile.h" should contain:
      """
      /**
       * This file is generated using the remodel generation script.
       * The name of the input file is RMValueTypeSingleFile.value
       */

      #import <Foundation/Foundation.h>

      @class RMValueTypeSingleFile;

      @interface RMValueTypeSingleFile : NSObject <NSCopying>

      @property (nonatomic, readonly, copy) NSString *itemOne;
      @property (nonatomic, readonly, copy) NSNumber *itemTwo;

      + (instancetype)new NS_UNAVAILABLE;

      - (instancetype)init NS_UNAVAILABLE;

      - (instancetype)initWithItemOne:(NSString *)itemOne itemTwo:(NSNumber *)itemTwo NS_DESIGNATED_INITIALIZER;

      @end

      @interface RMValueTypeSingleFileBuilder : NSObject

      + (instancetype)valueTypeSingleFile;

      + (instancetype)valueTypeSingleFileFromExistingValueTypeSingleFile:(RMValueTypeSingleFile *)existingValueTypeSingleFile;

      - (RMValueTypeSingleFile *)build;

      - (instancetype)withItemOne:(NSString *)itemOne;

      - (instancetype)withItemTwo:(NSNumber *)itemTwo;

      @end
      """
   And the file "project/values/RMValueTypeSingleFile.m" should contain:
      """
      /**
       * This file is generated using the remodel generation script.
       * The name of the input file is RMValueTypeSingleFile.value
       */

      #if  ! __has_feature(objc_arc)
      #error This file must be compiled with ARC. Use -fobjc-arc flag (or convert project to ARC).
      #endif

      #import "RMValueTypeSingleFile.h"

      @implementation RMValueTypeSingleFile

      - (instancetype)initWithItemOne:(NSString *)itemOne itemTwo:(NSNumber *)itemTwo
      {
        if ((self = [super init])) {
          _itemOne = [itemOne copy];
          _itemTwo = [itemTwo copy];
        }

        return self;
      }

      - (id)copyWithZone:(nullable NSZone *)zone
      {
        return self;
      }

      - (NSString *)description
      {
        return [NSString stringWithFormat:@"%@ - \n\t itemOne: %@; \n\t itemTwo: %@; \n", [super description], _itemOne, _itemTwo];
      }

      - (NSUInteger)hash
      {
        NSUInteger subhashes[] = {[_itemOne hash], [_itemTwo hash]};
        NSUInteger result = subhashes[0];
        for (int ii = 1; ii < 2; ++ii) {
          unsigned long long base = (((unsigned long long)result) << 32 | subhashes[ii]);
          base = (~base) + (base << 18);
          base ^= (base >> 31);
          base *=  21;
          base ^= (base >> 11);
          base += (base << 6);
          base ^= (base >> 22);
          result = base;
        }
        return result;
      }

      - (BOOL)isEqual:(RMValueTypeSingleFile *)object
      {
        if (self == object) {
          return YES;
        } else if (object == nil || ![object isKindOfClass:[self class]]) {
          return NO;
        }
        return
          (_itemOne == object->_itemOne ? YES : [_itemOne isEqual:object->_itemOne]) &&
          (_itemTwo == object->_itemTwo ? YES : [_itemTwo isEqual:object->_itemTwo]);
      }

      @end

      @implementation RMValueTypeSingleFileBuilder
      {
        NSString *_itemOne;
        NSNumber *_itemTwo;
      }

      + (instancetype)valueTypeSingleFile
      {
        return [RMValueTypeSingleFileBuilder new];
      }

      + (instancetype)valueTypeSingleFileFromExistingValueTypeSingleFile:(RMValueTypeSingleFile *)existingValueTypeSingleFile
      {
        return [[[RMValueTypeSingleFileBuilder valueTypeSingleFile]
                 withItemOne:existingValueTypeSingleFile.itemOne]
                withItemTwo:existingValueTypeSingleFile.itemTwo];
      }

      - (RMValueTypeSingleFile *)build
      {
        return [[RMValueTypeSingleFile alloc] initWithItemOne:_itemOne itemTwo:_itemTwo];
      }

      - (instancetype)withItemOne:(NSString *)itemOne
      {
        _itemOne = [itemOne copy];
        return self;
      }

      - (instancetype)withItemTwo:(NSNumber *)itemTwo
      {
        _itemTwo = [itemTwo copy];
        return self;
      }

      @end

      """
