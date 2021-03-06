import { Predicate } from "@thi.ng/api";

import { Transducer } from "../api";
import { comp } from "../func/comp";
import { iterator1 } from "../iterator";
import { filter } from "./filter";
import { take } from "./take";

/**
 * Transducer composition / syntax sugar for:
 *
 * ```
 * comp(filter(pred), take(1))
 * ```
 *
 * Yields none or only the first value which passed the predicate check
 * and then causes early termination.
 *
 * @param pred predicate function
 */
export function matchFirst<T>(pred: Predicate<T>): Transducer<T, T>;
export function matchFirst<T>(pred: Predicate<T>, src: Iterable<T>): IterableIterator<T>;
export function matchFirst<T>(pred: Predicate<T>, src?: Iterable<T>): any {
    return src ?
        [...iterator1(matchFirst(pred), src)][0] :
        comp(filter(pred), take(1));
}
