import { configureStore } from "@reduxjs/toolkit";
import mainSlice from "./mainSlice.ts";

export const store = configureStore({
  reducer: {
    poker: mainSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
