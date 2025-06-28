import type { PokerState } from "@/types/types.ts";

export const persistState = (state: PokerState) => {
  sessionStorage.setItem("pokerState", JSON.stringify(state));
};
