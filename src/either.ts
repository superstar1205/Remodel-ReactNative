/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function Left<T, U>(val: T) {
  return new Either<T, U>(val, null);
}

export function Right<T, U>(val: U) {
  return new Either<T, U>(null, val);
}

export class Either<T, U> {
  public left: T;
  public right: U;
  constructor(left: T, right: U) {
    this.left = left;
    this.right = right;
  }

  map<V>(f: (u: U) => V): Either<T, V> {
    return map(f, this);
  }
}

export function match<T, U, V>(
  left: (t: T) => V,
  right: (u: U) => V,
  either: Either<T, U>,
): V {
  if (either.left != null) {
    return left(either.left);
  } else {
    return right(either.right);
  }
}

export function map<T, U, V>(
  f: (u: U) => V,
  either: Either<T, U>,
): Either<T, V> {
  const left = function(t: T) {
    return Left<T, V>(either.left);
  };
  const right = function(u: U) {
    return Right<T, V>(f(either.right));
  };
  return match(left, right, either);
}

export function mbind<T, U, V>(
  f: (u: U) => Either<T, V>,
  either: Either<T, U>,
): Either<T, V> {
  const left = function(t: T) {
    return Left<T, V>(either.left);
  };
  const right = function(u: U) {
    return f(either.right);
  };
  return match(left, right, either);
}

export function munit<T, U>(u: U): Either<T, U> {
  return Right<T, U>(u);
}
