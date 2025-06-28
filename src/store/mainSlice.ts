import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface PokerState {
  roomId: string;
  name: string;
}

const initialState: PokerState = {
  roomId: "",
  name: "",
};

const mainSlice = createSlice({
  name: "poker",
  initialState,
  reducers: {
    setName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    setRoomId(state, action: PayloadAction<string>) {
      state.roomId = action.payload;
    },
    reset(state) {
      state.roomId = "";
      state.name = "";
    },
  },
});

export const mainSliceActions = mainSlice.actions;

export default mainSlice.reducer;