import { type PokerState } from '@/store/mainSlice';

const SESSION_KEY = 'planning-poker-session';

export const persistState = (state: PokerState): void => {
  try {
    // Save the entire poker state
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to persist state to sessionStorage:', error);
  }
};

export const loadState = (): Partial<PokerState> | null => {
  try {
    const serializedState = sessionStorage.getItem(SESSION_KEY);
    if (!serializedState) {
      return null;
    }
    const state = JSON.parse(serializedState);
    // Reset connection status since we're starting fresh
    return {
      ...state,
      isConnected: false,
      isLoading: false,
      error: null
    };
  } catch (error) {
    console.warn('Failed to load state from sessionStorage:', error);
    clearState();
    return null;
  }
};

export const clearState = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear sessionStorage:', error);
  }
};