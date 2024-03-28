import { createSelector as createSelectorCommon } from "lib/selectors";
import { EnhancedSelector, createSelectionContext } from "@taskworld.com/rereselect";
import { Selector } from "reselect";
import { BigNumber } from "@ethersproject/bignumber";
import { OrderOption } from "domain/synthetics/trade/usePositionSellerState";
import { TradeMode, TradeType } from "domain/synthetics/trade/types";
import { LRUCache } from "./LruCache";
import { SyntheticsState } from "./SyntheticsStateContextProvider";
export { useSyntheticsStateSelector as useSelector } from "./SyntheticsStateContextProvider";

export const createSelector = createSelectorCommon.withTypes<SyntheticsState>();
const context = createSelectionContext<SyntheticsState>();

export const createEnhancedSelector = context.makeSelector;

type Arg = boolean | string | BigNumber | undefined | null | number | TradeMode | TradeType | OrderOption;
type SupportedArg = Arg | Record<string, Arg>;

type CachedSelector<T> = EnhancedSelector<SyntheticsState, T> | Selector<SyntheticsState, T>;

export function createSelectorFactory<SelectionResult, Args extends SupportedArg[]>(
  factory: (...args: Args) => CachedSelector<SelectionResult>
): (...args: Args) => CachedSelector<SelectionResult> {
  const cache = new LRUCache<CachedSelector<SelectionResult>>(20);

  return (...args: Args) => {
    const key = getKeyForArgs(...args);

    if (cache.has(key)) {
      const selector = cache.get(key);
      if (!selector) throw new Error("Selector is undefined");
      return selector;
    }

    const selector = factory(...args);
    cache.set(key, selector);

    return selector;
  };
}

function getKeyForArgs(...args: SupportedArg[]) {
  return args
    .map((arg) =>
      typeof arg === "object" && arg
        ? Object.entries(arg)
            .map(([k, v]) => `${k}=${v}`)
            .join(";")
        : arg
    )
    .join(",");
}
