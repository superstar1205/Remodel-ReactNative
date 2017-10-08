Feature: Outputting Algebraic Types

  @announce
  Scenario: Generating an algebraic type with coding
    Given a file named "project/values/SimpleADT.adtValue" with:
      """
      SimpleADT {
        FirstSubtype {
          NSString *firstValue
          NSUInteger secondValue
        }
        SecondSubtype {
          BOOL something
        }
      }
      """
    And a file named "project/.algebraicTypeConfig" with:
      """
      {
        "defaultIncludes": [
          "RMCoding"
         ]
      }
      """
    When I run `../../bin/generate project`
    Then the file "project/values/SimpleADT.h" should contain:
      """
      #import <Foundation/Foundation.h>

      typedef void (^SimpleADTFirstSubtypeMatchHandler)(NSString *firstValue, NSUInteger secondValue);
      typedef void (^SimpleADTSecondSubtypeMatchHandler)(BOOL something);

      @interface SimpleADT : NSObject <NSCopying, NSCoding>

      + (instancetype)firstSubtypeWithFirstValue:(NSString *)firstValue secondValue:(NSUInteger)secondValue;

      + (instancetype)new NS_UNAVAILABLE;

      + (instancetype)secondSubtypeWithSomething:(BOOL)something;

      - (instancetype)init NS_UNAVAILABLE;

      - (void)matchFirstSubtype:(SimpleADTFirstSubtypeMatchHandler)firstSubtypeMatchHandler secondSubtype:(SimpleADTSecondSubtypeMatchHandler)secondSubtypeMatchHandler;

      @end

      """
   And the file "project/values/SimpleADT.m" should contain:
      """
      #import "SimpleADT.h"

      static __unsafe_unretained NSString * const kCodedSubtypeKey = @"CODED_SUBTYPE";
      static __unsafe_unretained NSString * const kFirstSubtypeFirstValueKey = @"FIRST_SUBTYPE_FIRST_VALUE";
      static __unsafe_unretained NSString * const kFirstSubtypeSecondValueKey = @"FIRST_SUBTYPE_SECOND_VALUE";
      static __unsafe_unretained NSString * const kSecondSubtypeSomethingKey = @"SECOND_SUBTYPE_SOMETHING";

      typedef NS_ENUM(NSUInteger, _SimpleADTSubtypes) {
        _SimpleADTSubtypesFirstSubtype,
        _SimpleADTSubtypesSecondSubtype
      };

      @implementation SimpleADT
      {
        _SimpleADTSubtypes _subtype;
        NSString *_firstSubtype_firstValue;
        NSUInteger _firstSubtype_secondValue;
        BOOL _secondSubtype_something;
      }

      + (instancetype)firstSubtypeWithFirstValue:(NSString *)firstValue secondValue:(NSUInteger)secondValue
      {
        SimpleADT *object = [[SimpleADT alloc] init];
        object->_subtype = _SimpleADTSubtypesFirstSubtype;
        object->_firstSubtype_firstValue = firstValue;
        object->_firstSubtype_secondValue = secondValue;
        return object;
      }

      + (instancetype)secondSubtypeWithSomething:(BOOL)something
      {
        SimpleADT *object = [[SimpleADT alloc] init];
        object->_subtype = _SimpleADTSubtypesSecondSubtype;
        object->_secondSubtype_something = something;
        return object;
      }

      - (instancetype)initWithCoder:(NSCoder *)aDecoder
      {
        if ((self = [super init])) {
          NSString *codedSubtype = [aDecoder decodeObjectForKey:kCodedSubtypeKey];
          if([codedSubtype isEqualToString:@"SUBTYPE_FIRST_SUBTYPE"]) {
            _firstSubtype_firstValue = [aDecoder decodeObjectForKey:kFirstSubtypeFirstValueKey];
            _firstSubtype_secondValue = [aDecoder decodeIntegerForKey:kFirstSubtypeSecondValueKey];
            _subtype = _SimpleADTSubtypesFirstSubtype;
          }
          else if([codedSubtype isEqualToString:@"SUBTYPE_SECOND_SUBTYPE"]) {
            _secondSubtype_something = [aDecoder decodeBoolForKey:kSecondSubtypeSomethingKey];
            _subtype = _SimpleADTSubtypesSecondSubtype;
          }
          else {
            @throw([NSException exceptionWithName:@"InvalidSubtypeException" reason:@"nil or unknown subtype provided" userInfo:@{@"subtype": codedSubtype}]);
          }
        }
        return self;
      }

      - (id)copyWithZone:(NSZone *)zone
      {
        return self;
      }

      - (NSString *)description
      {
        switch (_subtype) {
          case _SimpleADTSubtypesFirstSubtype: {
            return [NSString stringWithFormat:@"%@ - FirstSubtype \n\t firstValue: %@; \n\t secondValue: %tu; \n", [super description], _firstSubtype_firstValue, _firstSubtype_secondValue];
            break;
          }
          case _SimpleADTSubtypesSecondSubtype: {
            return [NSString stringWithFormat:@"%@ - SecondSubtype \n\t something: %@; \n", [super description], _secondSubtype_something ? @"YES" : @"NO"];
            break;
          }
        }
      }

      - (void)encodeWithCoder:(NSCoder *)aCoder
      {
        switch (_subtype) {
          case _SimpleADTSubtypesFirstSubtype: {
            [aCoder encodeObject:_firstSubtype_firstValue forKey:kFirstSubtypeFirstValueKey];
            [aCoder encodeInteger:_firstSubtype_secondValue forKey:kFirstSubtypeSecondValueKey];
            [aCoder encodeObject:@"SUBTYPE_FIRST_SUBTYPE" forKey:kCodedSubtypeKey];
            break;
          }
          case _SimpleADTSubtypesSecondSubtype: {
            [aCoder encodeBool:_secondSubtype_something forKey:kSecondSubtypeSomethingKey];
            [aCoder encodeObject:@"SUBTYPE_SECOND_SUBTYPE" forKey:kCodedSubtypeKey];
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
        } else if (self == nil || object == nil || ![object isKindOfClass:[self class]]) {
          return NO;
        }
        return
          _subtype == object->_subtype &&
          _firstSubtype_secondValue == object->_firstSubtype_secondValue &&
          _secondSubtype_something == object->_secondSubtype_something &&
          (_firstSubtype_firstValue == object->_firstSubtype_firstValue ? YES : [_firstSubtype_firstValue isEqual:object->_firstSubtype_firstValue]);
      }

      - (void)matchFirstSubtype:(SimpleADTFirstSubtypeMatchHandler)firstSubtypeMatchHandler secondSubtype:(SimpleADTSecondSubtypeMatchHandler)secondSubtypeMatchHandler
      {
        switch (_subtype) {
          case _SimpleADTSubtypesFirstSubtype: {
            firstSubtypeMatchHandler(_firstSubtype_firstValue, _firstSubtype_secondValue);
            break;
          }
          case _SimpleADTSubtypesSecondSubtype: {
            secondSubtypeMatchHandler(_secondSubtype_something);
            break;
          }
        }
      }

      @end

      """
