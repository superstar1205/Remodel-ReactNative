Feature: Outputting expected Algebraic Type matching methods

  @announce
  Scenario: Generating an algebraic type with a bool matcher
    Given a file named "project/values/SimpleADT.adtValue" with:
      """
      SimpleADT includes(BoolMatching) excludes(VoidMatching) {
        subtypeA
        subtypeB
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
      #import <Foundation/Foundation.h>

      typedef BOOL (^SimpleADTBooleanSubtypeAMatchHandler)(void);
      typedef BOOL (^SimpleADTBooleanSubtypeBMatchHandler)(void);

      @interface SimpleADT : NSObject <NSCopying>

      + (instancetype)new NS_UNAVAILABLE;

      + (instancetype)subtypeA;

      + (instancetype)subtypeB;

      - (instancetype)init NS_UNAVAILABLE;

      - (BOOL)matchBooleanSubtypeA:(SimpleADTBooleanSubtypeAMatchHandler NS_NOESCAPE)subtypeAMatchHandler subtypeB:(SimpleADTBooleanSubtypeBMatchHandler NS_NOESCAPE)subtypeBMatchHandler NS_SWIFT_NAME(match(subtypeA:subtypeB:));

      @end
      """
   And the file "project/values/SimpleADT.m" should contain:
      """
      - (BOOL)matchBooleanSubtypeA:(SimpleADTBooleanSubtypeAMatchHandler NS_NOESCAPE)subtypeAMatchHandler subtypeB:(SimpleADTBooleanSubtypeBMatchHandler NS_NOESCAPE)subtypeBMatchHandler
      {
        __block BOOL result = NO;
        switch (_subtype) {
          case _SimpleADTSubtypessubtypeA: {
            if (subtypeAMatchHandler) {
              result = subtypeAMatchHandler();
            }
            break;
          }
          case _SimpleADTSubtypessubtypeB: {
            if (subtypeBMatchHandler) {
              result = subtypeBMatchHandler();
            }
            break;
          }
        }
        return result;
      }

      @end
      """

  @announce
  Scenario: Generating an algebraic type with a integer matcher
    Given a file named "project/values/SimpleADT.adtValue" with:
      """
      SimpleADT includes(IntegerMatching) excludes(VoidMatching) {
        subtypeA
        subtypeB
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
      #import <Foundation/Foundation.h>

      typedef NSInteger (^SimpleADTIntegerSubtypeAMatchHandler)(void);
      typedef NSInteger (^SimpleADTIntegerSubtypeBMatchHandler)(void);

      @interface SimpleADT : NSObject <NSCopying>

      + (instancetype)new NS_UNAVAILABLE;

      + (instancetype)subtypeA;

      + (instancetype)subtypeB;

      - (instancetype)init NS_UNAVAILABLE;

      - (NSInteger)matchIntegerSubtypeA:(SimpleADTIntegerSubtypeAMatchHandler NS_NOESCAPE)subtypeAMatchHandler subtypeB:(SimpleADTIntegerSubtypeBMatchHandler NS_NOESCAPE)subtypeBMatchHandler NS_SWIFT_NAME(match(subtypeA:subtypeB:));

      @end
      """
   And the file "project/values/SimpleADT.m" should contain:
      """
      - (NSInteger)matchIntegerSubtypeA:(SimpleADTIntegerSubtypeAMatchHandler NS_NOESCAPE)subtypeAMatchHandler subtypeB:(SimpleADTIntegerSubtypeBMatchHandler NS_NOESCAPE)subtypeBMatchHandler
      {
        __block NSInteger result = 0;
        switch (_subtype) {
          case _SimpleADTSubtypessubtypeA: {
            if (subtypeAMatchHandler) {
              result = subtypeAMatchHandler();
            }
            break;
          }
          case _SimpleADTSubtypessubtypeB: {
            if (subtypeBMatchHandler) {
              result = subtypeBMatchHandler();
            }
            break;
          }
        }
        return result;
      }

      @end
      """

  @announce
  Scenario: Generating an algebraic type with a double matcher
    Given a file named "project/values/SimpleADT.adtValue" with:
      """
      SimpleADT includes(DoubleMatching) excludes(VoidMatching) {
        subtypeA
        subtypeB
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
      #import <Foundation/Foundation.h>

      typedef double (^SimpleADTDoubleSubtypeAMatchHandler)(void);
      typedef double (^SimpleADTDoubleSubtypeBMatchHandler)(void);

      @interface SimpleADT : NSObject <NSCopying>

      + (instancetype)new NS_UNAVAILABLE;

      + (instancetype)subtypeA;

      + (instancetype)subtypeB;

      - (instancetype)init NS_UNAVAILABLE;

      - (double)matchDoubleSubtypeA:(SimpleADTDoubleSubtypeAMatchHandler NS_NOESCAPE)subtypeAMatchHandler subtypeB:(SimpleADTDoubleSubtypeBMatchHandler NS_NOESCAPE)subtypeBMatchHandler NS_SWIFT_NAME(match(subtypeA:subtypeB:));

      @end
      """
   And the file "project/values/SimpleADT.m" should contain:
      """
      - (double)matchDoubleSubtypeA:(SimpleADTDoubleSubtypeAMatchHandler NS_NOESCAPE)subtypeAMatchHandler subtypeB:(SimpleADTDoubleSubtypeBMatchHandler NS_NOESCAPE)subtypeBMatchHandler
      {
        __block double result = 0.0f;
        switch (_subtype) {
          case _SimpleADTSubtypessubtypeA: {
            if (subtypeAMatchHandler) {
              result = subtypeAMatchHandler();
            }
            break;
          }
          case _SimpleADTSubtypessubtypeB: {
            if (subtypeBMatchHandler) {
              result = subtypeBMatchHandler();
            }
            break;
          }
        }
        return result;
      }

      @end
      """

  @announce
  Scenario: Generating an algebraic type with a generic matcher
    Given a file named "project/values/SimpleADT.adtValue" with:
      """
      SimpleADT includes(GenericMatching) excludes(VoidMatching) {
        subtypeA
        subtypeB
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
    Then the file "project/values/SimpleADTMatcher.h" should contain:
      """
      #import <Foundation/Foundation.h>
      #import "SimpleADT.h"

      __attribute__((objc_subclassing_restricted)) 
      @interface SimpleADTMatcher<__covariant ObjectType> : NSObject

      typedef ObjectType (^SimpleADTObjectTypeSubtypeAMatchHandler)(void);
      typedef ObjectType (^SimpleADTObjectTypeSubtypeBMatchHandler)(void);

      + (ObjectType)match:(SimpleADT *)simpleADT subtypeA:(SimpleADTObjectTypeSubtypeAMatchHandler NS_NOESCAPE)subtypeAMatchHandler subtypeB:(SimpleADTObjectTypeSubtypeBMatchHandler NS_NOESCAPE)subtypeBMatchHandler;

      @end
      """
   And the file "project/values/SimpleADTMatcher.m" should contain:
      """
      + (id)match:(SimpleADT *)simpleADT subtypeA:(SimpleADTObjectTypeSubtypeAMatchHandler NS_NOESCAPE)subtypeAMatchHandler subtypeB:(SimpleADTObjectTypeSubtypeBMatchHandler NS_NOESCAPE)subtypeBMatchHandler
      {
        __block id result = nil;

        SimpleADTSubtypeAMatchHandler matchSubtypeA = ^(void) {
          result = subtypeAMatchHandler();
        };

        SimpleADTSubtypeBMatchHandler matchSubtypeB = ^(void) {
          result = subtypeBMatchHandler();
        };

        [simpleADT matchSubtypeA:matchSubtypeA subtypeB:matchSubtypeB];

        return result;
      }
      """
