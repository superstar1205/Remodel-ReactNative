# Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

Feature: Outputting ObjC++ Algebraic Types

  @announce
  Scenario: Generating an algebraic type outputs a .mm implementation
    Given a file named "project/values/SimpleADT.adtValue" with:
      """
      SimpleADT includes(RenderCPlusPlusFile) {
        FirstSubtype {
          NSString *firstValue
          NSUInteger secondValue
        }
        SomeRandomSubtype
        SecondSubtype {
          BOOL something
        }
      }
      """
    And a file named "project/.algebraicTypeConfig" with:
      """
      {
        "defaultExcludes": [
          "RMCoding"
         ]
      }
      """
    When I run `../../bin/generate project`
    Then the file "project/values/SimpleADT.h" should contain:
      """
      /**
       * This file is generated using the remodel generation script.
       * The name of the input file is SimpleADT.adtValue
       */

      #import <Foundation/Foundation.h>

      typedef void (^SimpleADTFirstSubtypeMatchHandler)(NSString *firstValue, NSUInteger secondValue);
      typedef void (^SimpleADTSomeRandomSubtypeMatchHandler)(void);
      typedef void (^SimpleADTSecondSubtypeMatchHandler)(BOOL something);

      @interface SimpleADT : NSObject <NSCopying>

      + (instancetype)firstSubtypeWithFirstValue:(NSString *)firstValue secondValue:(NSUInteger)secondValue;

      + (instancetype)new NS_UNAVAILABLE;

      + (instancetype)secondSubtypeWithSomething:(BOOL)something;

      + (instancetype)someRandomSubtype;

      - (instancetype)init NS_UNAVAILABLE;

      - (void)matchFirstSubtype:(NS_NOESCAPE __unsafe_unretained SimpleADTFirstSubtypeMatchHandler)firstSubtypeMatchHandler someRandomSubtype:(NS_NOESCAPE __unsafe_unretained SimpleADTSomeRandomSubtypeMatchHandler)someRandomSubtypeMatchHandler secondSubtype:(NS_NOESCAPE __unsafe_unretained SimpleADTSecondSubtypeMatchHandler)secondSubtypeMatchHandler NS_SWIFT_NAME(match(firstSubtype:someRandomSubtype:secondSubtype:));

      @end


      """
   And the file "project/values/SimpleADT.mm" should contain:
      """
      /**
       * This file is generated using the remodel generation script.
       * The name of the input file is SimpleADT.adtValue
       */

      #if  ! __has_feature(objc_arc)
      #error This file must be compiled with ARC. Use -fobjc-arc flag (or convert project to ARC).
      #endif

      #import "SimpleADT.h"

      typedef NS_ENUM(NSUInteger, SimpleADTSubtypes) {
        SimpleADTSubtypesFirstSubtype,
        SimpleADTSubtypesSomeRandomSubtype,
        SimpleADTSubtypesSecondSubtype
      };

      @implementation SimpleADT
      {
        SimpleADTSubtypes _subtype;
        NSString *_firstSubtype_firstValue;
        NSUInteger _firstSubtype_secondValue;
        BOOL _secondSubtype_something;
      }

      + (instancetype)firstSubtypeWithFirstValue:(NSString *)firstValue secondValue:(NSUInteger)secondValue
      {
        SimpleADT *object = [(id)self new];
        object->_subtype = SimpleADTSubtypesFirstSubtype;
        object->_firstSubtype_firstValue = firstValue;
        object->_firstSubtype_secondValue = secondValue;
        return object;
      }

      + (instancetype)secondSubtypeWithSomething:(BOOL)something
      {
        SimpleADT *object = [(id)self new];
        object->_subtype = SimpleADTSubtypesSecondSubtype;
        object->_secondSubtype_something = something;
        return object;
      }

      + (instancetype)someRandomSubtype
      {
        SimpleADT *object = [(id)self new];
        object->_subtype = SimpleADTSubtypesSomeRandomSubtype;
        return object;
      }

      - (id)copyWithZone:(nullable NSZone *)zone
      {
        return self;
      }

      - (NSString *)description
      {
        switch (_subtype) {
          case SimpleADTSubtypesFirstSubtype: {
            return [NSString stringWithFormat:@"%@ - FirstSubtype \n\t firstValue: %@; \n\t secondValue: %llu; \n", [super description], _firstSubtype_firstValue, (unsigned long long)_firstSubtype_secondValue];
            break;
          }
          case SimpleADTSubtypesSomeRandomSubtype: {
            return [NSString stringWithFormat:@"%@ - SomeRandomSubtype \n", [super description]];
            break;
          }
          case SimpleADTSubtypesSecondSubtype: {
            return [NSString stringWithFormat:@"%@ - SecondSubtype \n\t something: %@; \n", [super description], _secondSubtype_something ? @"YES" : @"NO"];
            break;
          }
        }
      }

      - (NSUInteger)hash
      {
        NSUInteger subhashes[] = {_subtype, [_firstSubtype_firstValue hash], _firstSubtype_secondValue, (NSUInteger)_secondSubtype_something};
        NSUInteger result = subhashes[0];
        for (int ii = 1; ii < 4; ++ii) {
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

      - (BOOL)isEqual:(SimpleADT *)object
      {
        if (self == object) {
          return YES;
        } else if (object == nil || ![object isKindOfClass:[self class]]) {
          return NO;
        }
        return
          _subtype == object->_subtype &&
          _firstSubtype_secondValue == object->_firstSubtype_secondValue &&
          _secondSubtype_something == object->_secondSubtype_something &&
          (_firstSubtype_firstValue == object->_firstSubtype_firstValue ? YES : [_firstSubtype_firstValue isEqual:object->_firstSubtype_firstValue]);
      }

      - (void)matchFirstSubtype:(NS_NOESCAPE __unsafe_unretained SimpleADTFirstSubtypeMatchHandler)firstSubtypeMatchHandler someRandomSubtype:(NS_NOESCAPE __unsafe_unretained SimpleADTSomeRandomSubtypeMatchHandler)someRandomSubtypeMatchHandler secondSubtype:(NS_NOESCAPE __unsafe_unretained SimpleADTSecondSubtypeMatchHandler)secondSubtypeMatchHandler
      {
        switch (_subtype) {
          case SimpleADTSubtypesFirstSubtype: {
            if (firstSubtypeMatchHandler) {
              firstSubtypeMatchHandler(_firstSubtype_firstValue, _firstSubtype_secondValue);
            }
            break;
          }
          case SimpleADTSubtypesSomeRandomSubtype: {
            if (someRandomSubtypeMatchHandler) {
              someRandomSubtypeMatchHandler();
            }
            break;
          }
          case SimpleADTSubtypesSecondSubtype: {
            if (secondSubtypeMatchHandler) {
              secondSubtypeMatchHandler(_secondSubtype_something);
            }
            break;
          }
        }
      }

      @end


      """
