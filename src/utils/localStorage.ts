import type { PokerState } from "../types/types.ts";

export const persist = (state: PokerState) => {
  sessionStorage.setItem("pokerState", JSON.stringify(state));
};
