import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { mainSliceActions } from "../mainSlice";
import { bindActionCreators } from "@reduxjs/toolkit";

export const useStoreActions = () => {
  const dispatch = useDispatch<AppDispatch>();
  return bindActionCreators(mainSliceActions, dispatch);
};
