import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Participant, PokerState } from "../types/types.ts";
import { persist } from "../utils/localStorage.ts";

const savedState = sessionStorage.getItem("pokerState");
const initialState: PokerState = savedState
  ? JSON.parse(savedState)
  : {
      roomId: "",
      name: "",
      participants: [],
    };

const mainSlice = createSlice({
  name: "poker",
  initialState,
  reducers: {
    setName(state, action: PayloadAction<string>) {
      state.name = action.payload;
      persist(state);
    },

    joinRoom(state, action: PayloadAction<string>) {
      state.roomId = action.payload;
      persist(state);
    },

    updateParticipants(state, action: PayloadAction<Participant[]>) {
      state.participants = action.payload;
      persist(state);
    },

    vote(state, action: PayloadAction<number | "?">) {
      const { name } = state;
      state.participants = state.participants.map((p) =>
        p.name === name ? { ...p, vote: action.payload } : p
      );
      persist(state);
    },

    resetVotes(state) {
      state.participants = state.participants.map((p) => ({ ...p, vote: undefined }));
      persist(state);
    },

    addOrUpdateParticipant(state, action: PayloadAction<Participant>) {
      const exists = state.participants.find((p) => p.id === action.payload.id);
      if (!exists) state.participants.push(action.payload);
      persist(state);
    },
  },
});

export const { setName, joinRoom, updateParticipants, vote, resetVotes, addOrUpdateParticipant } =
  mainSlice.actions;

export default mainSlice.reducer;
