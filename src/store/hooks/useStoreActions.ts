import { useDispatch } from "react-redux";
import type { AppDispatch, RootState } from "../index";
import {
  setName,
  joinRoom,
  vote,
  resetVotes,
  updateParticipants,
  addOrUpdateParticipant,
} from "../mainSlice";

export const useStoreActions = () => {
  const dispatch = useDispatch<AppDispatch>();

  return {
    setName: (name: string) => dispatch(setName(name)),
    joinRoom: (roomId: string) => dispatch(joinRoom(roomId)),
    vote: (value: number | "?") => dispatch(vote(value)),
    resetVotes: () => dispatch(resetVotes()),
    updateParticipants: (participants: RootState["poker"]["participants"]) =>
      dispatch(updateParticipants(participants)),
    addOrUpdateParticipant: (participant: RootState["poker"]["participants"][number]) =>
      dispatch(addOrUpdateParticipant(participant)),
  };
};
