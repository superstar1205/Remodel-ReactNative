Feature: Controlling includes/excludes from command line

  @announce
  Scenario: Add builder via command line
    Given a file named "project/values/RMValueType.value" with:
      """
      # Simple file
      RMValueType {
        BOOL doesUserLike
        NSString* identifier
      }
      """
    And a file named "project/.valueObjectConfig" with:
      """
      { }
      """
    When I run `../../bin/generate project --include=RMBuilder`
    Then the file "project/values/RMValueType.h" should contain:
      """
      #import <Foundation/Foundation.h>

      /**
       * Simple file
       */
      @interface RMValueType : NSObject <NSCopying>

      @property (nonatomic, readonly) BOOL doesUserLike;
      @property (nonatomic, readonly, copy) NSString *identifier;

      + (instancetype)new NS_UNAVAILABLE;

      - (instancetype)init NS_UNAVAILABLE;

      - (instancetype)initWithDoesUserLike:(BOOL)doesUserLike identifier:(NSString *)identifier NS_DESIGNATED_INITIALIZER;

      @end

      """
   And the file "project/values/RMValueType.m" should contain:
      """
      #import "RMValueType.h"

      @implementation RMValueType

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

      - (BOOL)isEqual:(RMValueType *)object
      {
        if (self == object) {
          return YES;
        } else if (self == nil || object == nil || ![object isKindOfClass:[self class]]) {
          return NO;
        }
        return
          _doesUserLike == object->_doesUserLike &&
          (_identifier == object->_identifier ? YES : [_identifier isEqual:object->_identifier]);
      }

      @end

      """
    And the file "project/values/RMValueTypeBuilder.h" should contain:
      """
      #import <Foundation/Foundation.h>

      @class RMValueType;

      @interface RMValueTypeBuilder : NSObject

      + (instancetype)valueType;

      + (instancetype)valueTypeFromExistingValueType:(RMValueType *)existingValueType;

      - (RMValueType *)build;

      - (instancetype)withDoesUserLike:(BOOL)doesUserLike;

      - (instancetype)withIdentifier:(NSString *)identifier;

      @end

      """
    And the file "project/values/RMValueTypeBuilder.m" should contain:
      """
      #if  ! __has_feature(objc_arc)
      #error This file must be compiled with ARC. Use -fobjc-arc flag (or convert project to ARC).
      #endif

      #import "RMValueType.h"
      #import "RMValueTypeBuilder.h"

      @implementation RMValueTypeBuilder
      {
        BOOL _doesUserLike;
        NSString *_identifier;
      }

      + (instancetype)valueType
      {
        return [[RMValueTypeBuilder alloc] init];
      }

      + (instancetype)valueTypeFromExistingValueType:(RMValueType *)existingValueType
      {
        return [[[RMValueTypeBuilder valueType]
                 withDoesUserLike:existingValueType.doesUserLike]
                withIdentifier:existingValueType.identifier];
      }

      - (RMValueType *)build
      {
        return [[RMValueType alloc] initWithDoesUserLike:_doesUserLike identifier:_identifier];
      }

      - (instancetype)withDoesUserLike:(BOOL)doesUserLike
      {
        _doesUserLike = doesUserLike;
        return self;
      }

      - (instancetype)withIdentifier:(NSString *)identifier
      {
        _identifier = [identifier copy];
        return self;
      }

      @end
      """

  @announce
  Scenario: Prevent files from containing includes()/excludes()
    Given a file named "project/values/RMValueType.value" with:
      """
      # Simple file
      RMValueType includes(RMBuilder) {
        BOOL doesUserLike
        NSString* identifier
      }
      """
    And a file named "project/.valueObjectConfig" with:
      """
      { }
      """
    When I run `../../bin/generate project --prohibit-embedded-includes`
    Then the file "project/values/RMValueType.h" should not exist
