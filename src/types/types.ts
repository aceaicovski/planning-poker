export interface Participant {
  id: string;
  name: string;
  vote?: number | string;
}

export interface PokerState {
  roomId: string;
  name: string;
  participants: Participant[];
}