export interface Participant {
  id: string;
  name: string;
  vote?: number | "?";
}

export interface PokerState {
  roomId: string;
  name: string;
  participants: Participant[];
}

// WebSocket message types
export type WSMessage =
  | { type: "join"; payload: { id: string; name: string } }
  | { type: "vote"; payload: { id: string; vote: number | string } }
  | { type: "reset"; payload: {} }
  | {
      type: "sync";
      payload: { participants: Array<{ id: string; name: string; vote?: number | string }> };
    };
