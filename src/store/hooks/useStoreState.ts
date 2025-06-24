import { useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState } from "../index";

export const useStoreState: TypedUseSelectorHook<RootState> = useSelector;
