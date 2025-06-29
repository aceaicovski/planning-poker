import { useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState } from "@/store";

export const useStoreState: TypedUseSelectorHook<RootState> = useSelector;
