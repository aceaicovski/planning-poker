import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import { useStoreState } from "../store/hooks/useStoreState";
import { useStoreActions } from "../store/hooks/useStoreActions";
import { useWebSocket } from "../websocket/useWebsocket.ts";
import type { Participant } from "../types/types.ts";

const cardValues = [1, 2, 3, 5, 8, 13, "?"];

const Room = () => {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { participants, name, roomId } = useStoreState((s) => s.poker);
  const { vote, resetVotes, updateParticipants, addOrUpdateParticipant, setName, joinRoom } =
    useStoreActions();

  // Get name from URL params or redirect to lobby if missing
  const urlName = searchParams.get("name");

  useEffect(() => {
    if (!urlRoomId || !urlName) {
      navigate("/");
      return;
    }

    // Sync URL params with Redux state if they don't match
    if (name !== urlName) {
      setName(urlName);
    }
    if (roomId !== urlRoomId) {
      joinRoom(urlRoomId);
    }
  }, [urlRoomId, urlName, name, roomId, navigate, setName, joinRoom]);

  // Generate a consistent user ID based on name and room for this session
  const userId = `${name}_${roomId}_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, "");

  const currentUser = participants.find((p) => p.name === name);
  const allVoted = participants.length > 1 && participants.every((p) => p.vote !== undefined);
  const hasVoted = currentUser?.vote !== undefined;

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case "join":
        // Add or update participant (skip if it's the current user to avoid duplicates)
        if (data.payload.name !== name) {
          addOrUpdateParticipant({
            id: data.payload.id,
            name: data.payload.name,
            vote: undefined,
          });
        }
        break;

      case "vote":
        // Update participant's vote by name
        updateParticipants(
          participants.map((p) =>
            p.name === data.payload.name ? { ...p, vote: data.payload.vote } : p
          )
        );
        break;

      case "reset":
        // Reset all votes
        resetVotes();
        break;

      case "sync": {
        // Filter out current user to avoid duplicates // Sync all participants (useful for new joiners)
        const otherParticipants = data.payload.participants.filter(
          (p: Participant) => p.name !== name
        );
        const currentUserData = participants.find((p) => p.name === name);

        if (currentUserData) {
          updateParticipants([currentUserData, ...otherParticipants]);
        } else {
          updateParticipants(otherParticipants);
        }
        break;
      }

      default:
        console.warn("Unknown WebSocket message type:", data);
    }
  };

  const { sendMessage, status } = useWebSocket(roomId, handleWebSocketMessage);

  // Send join message when component mounts or user changes
  useEffect(() => {
    if (status === "open" && userId && name && roomId) {
      // Add current user to participants if not already there
      const currentUserExists = participants.find((p) => p.name === name);
      if (!currentUserExists) {
        addOrUpdateParticipant({
          id: userId,
          name: name,
          vote: undefined,
        });
      }

      // Broadcast join to other users
      sendMessage({
        type: "join",
        payload: { id: userId, name },
      });
    }
  }, [status, userId, name, roomId, sendMessage, participants, addOrUpdateParticipant]);

  // Send sync message when all votes are in (optional - for any late joiners)
  useEffect(() => {
    if (allVoted && status === "open") {
      sendMessage({
        type: "sync",
        payload: { participants },
      });
    }
  }, [allVoted, participants, status, sendMessage]);

  // Don't render if we don't have the required data
  if (!name || !roomId) {
    return (
      <div className="p-6 font-sans max-w-4xl mx-auto text-center">
        <div className="text-gray-500">Loading room...</div>
      </div>
    );
  }

  // Send vote update when user votes
  const handleVote = (value: number | string) => {
    vote(value);

    if (status === "open") {
      sendMessage({
        type: "vote",
        payload: { id: userId, name: name, vote: value },
      });
    }
  };

  // Send reset message when resetting votes
  const handleReset = () => {
    resetVotes();

    if (status === "open") {
      sendMessage({
        type: "reset",
        payload: {},
      });
    }
  };

  return (
    <div className="p-6 font-sans max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold">Room: {currentUser?.name}</h2>
        <div
          className={`px-2 py-1 rounded text-sm ${
            status === "open"
              ? "bg-green-100 text-green-800"
              : status === "connecting"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {status === "open"
            ? "Connected"
            : status === "connecting"
              ? "Connecting..."
              : "Disconnected"}
        </div>
      </div>

      <h3 className="text-xl mb-4">Hello, {name}</h3>

      {!hasVoted && !allVoted && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">Choose your estimate:</h4>
          <div className="flex flex-wrap gap-3">
            {cardValues?.map((val) => (
              <button
                key={val}
                onClick={() => handleVote(val)}
                disabled={status !== "open"}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasVoted && !allVoted && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            ✅ You voted <strong>{currentUser?.vote}</strong>. Waiting for others...
          </p>
        </div>
      )}

      <h4 className="text-lg font-semibold mb-2">Participants ({participants.length}):</h4>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        {participants.map((p) => (
          <div
            key={p.id}
            className={`bg-white border rounded-lg shadow p-4 text-center ${
              p.name === name ? "border-blue-500 bg-blue-50" : "border-gray-200"
            }`}
          >
            <div className="font-semibold">
              {p.name} {p.name === name && "(You)"}
            </div>
            <div className="text-2xl mt-2">
              {allVoted ? (
                <span className="text-green-600 font-bold">{p.vote}</span>
              ) : p.vote !== undefined ? (
                <span className="text-blue-600">✅</span>
              ) : (
                <span className="text-gray-400">⏳</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {allVoted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h4 className="text-lg font-semibold text-green-800 mb-2">🎉 All votes are in!</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {participants.map((p) => (
              <span key={p.id} className="px-2 py-1 bg-green-100 text-green-800 rounded">
                {p.name}: {p.vote}
              </span>
            ))}
          </div>
          <button
            onClick={handleReset}
            disabled={status !== "open"}
            className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset Votes
          </button>
        </div>
      )}

      {participants.length === 1 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            💡 Open this room in another tab or share the room ID with others to start voting
            together!
          </p>
        </div>
      )}
    </div>
  );
};

export default Room;
