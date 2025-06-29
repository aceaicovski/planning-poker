import { configureStore } from "@reduxjs/toolkit";
import mainSlice from "./mainSlice.ts";
import { persistMiddleware } from "./persistMiddleware.ts";

const store = configureStore({
  reducer: {
    poker: mainSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistMiddleware),
});

export { store };
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
