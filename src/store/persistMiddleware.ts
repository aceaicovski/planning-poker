import type { Middleware } from '@reduxjs/toolkit';
import { persistState } from '@/lib/sessionStorage';

export const persistMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Save state to sessionStorage after every action
  const state = store.getState();
  if (state.poker.userId && state.poker.userName) {
    // Only persist if we have user info
    persistState(state.poker);
  }
  
  return result;
};