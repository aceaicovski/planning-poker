import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loadState, clearState } from "@/lib/sessionStorage";

export interface Participant {
  id: string;
  name: string;
  hasVoted: boolean;
  vote: string | null;
}

export interface Room {
  id: string;
  participants: Participant[];
  votesRevealed: boolean;
}

export interface PokerState {
  userId: string;
  userName: string;
  currentRoom: Room | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

// Load persisted state on initialization
const defaultState: PokerState = {
  userId: "",
  userName: "",
  currentRoom: null,
  isConnected: false,
  isLoading: false,
  error: null,
};

const initialState: PokerState = {
  ...defaultState,
  ...loadState()
};

const mainSlice = createSlice({
  name: "poker",
  initialState,
  reducers: {
    setConnectionStatus(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
    },
    setUserInfo(state, action: PayloadAction<{ userId: string; userName: string }>) {
      state.userId = action.payload.userId;
      state.userName = action.payload.userName;
    },
    setRoom(state, action: PayloadAction<Room>) {
      state.currentRoom = action.payload;
    },
    updateRoom(state, action: PayloadAction<Room>) {
      if (state.currentRoom && state.currentRoom.id === action.payload.id) {
        state.currentRoom = action.payload;
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    leaveRoom(state) {
      state.currentRoom = null;
    },
    reset(state) {
      state.userId = "";
      state.userName = "";
      state.currentRoom = null;
      state.isLoading = false;
      state.error = null;
      
      // Clear persisted state
      clearState();
    },
  },
});

export const mainSliceActions = mainSlice.actions;

export default mainSlice.reducer;