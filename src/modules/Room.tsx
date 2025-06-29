import { useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { useStoreState } from "@/store/hooks/useStoreState";
import type { Participant } from "@/store/mainSlice";

const CARD_VALUES = ["1", "2", "3", "5", "8", "13", "?", "☕"];

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const hasInitializedRef = useRef(false);

  const {
    vote,
    revealVotes,
    resetVotes,
    getRoomState,
    initializeConnection,
    reconnectWithExistingUser,
    leaveRoom,
    disconnect,
  } = useSocket();
  const { currentRoom, userId, userName, isConnected } = useStoreState((state) => state.poker);

  // Get current participant data from server state
  const currentParticipant = useMemo(() => {
    return currentRoom?.participants?.find((p: Participant) => p.id === userId) || null;
  }, [currentRoom?.participants, userId]);

  useEffect(() => {
    // If no room ID from URL, redirect to lobby
    if (!roomId) {
      navigate("/");
      return;
    }

    // If user has no session info, redirect to lobby
    if (!userName || !userId) {
      navigate("/");
      return;
    }

    // Initialize connection and get room state only once
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;

      const connectAndGetState = async () => {
        try {
          // If we have user info and room ID, try to reconnect
          if (userId && userName && roomId) {
            console.log("Attempting to reconnect existing user to room");
            try {
              await reconnectWithExistingUser(userId, roomId, userName);
            } catch (error) {
              console.log(
                "Reconnection failed, user was likely removed from room. Redirecting to lobby.",
                error
              );
              // Clear session storage and redirect to lobby
              disconnect();
              navigate("/");
              return;
            }
          } else {
            // New connection
            if (!isConnected) {
              await initializeConnection();
            }
            await getRoomState();
          }
        } catch (error) {
          console.error("Failed to connect or get room state:", error);
          // Clear session and redirect to lobby on any connection failure
          disconnect();
          navigate("/");
        }
      };

      connectAndGetState();
    }
  }, []); // Run once when component mounts

  const handleCardSelect = (value: string) => {
    if (currentRoom?.votesRevealed || currentParticipant?.hasVoted) return;

    vote(value);
  };

  const handleRevealVotes = () => {
    revealVotes();
  };

  const handleResetVotes = () => {
    resetVotes();
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      navigate("/");
    } catch {
      // Navigate anyway in case of error
      navigate("/");
    }
  };

  const allUsersVoted = currentRoom?.participants.every((p: Participant) => p.hasVoted) ?? false;

  if (!currentRoom || !userName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-500">Loading room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg px-6 py-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Planning Poker</h1>
              <p className="text-gray-600">
                Room: <span className="font-mono font-semibold">{roomId}</span>
              </p>
            </div>
            <button
              onClick={() => {
                handleLeaveRoom();
              }}
              className="px-6 py-3 rounded-lg font-medium border-2 border-blue-500 text-blue-500 hover:bg-blue-50 transition cursor-pointer"
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Participants</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentRoom.participants?.map((participant: Participant) => (
              <div
                key={participant.id}
                className={`p-4 rounded-lg border-2 ${
                  participant.id === userId
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="font-medium text-gray-800">
                  {participant.name}
                  {participant.id === userId && " (You)"}
                </div>
                <div className="mt-2">
                  {currentRoom.votesRevealed && participant.vote ? (
                    <div className="text-2xl font-bold text-blue-600">{participant.vote}</div>
                  ) : participant.hasVoted ? (
                    <div className="text-green-600">✓ Voted</div>
                  ) : (
                    <div className="text-gray-400">Thinking...</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voting Cards */}
        {!currentRoom.votesRevealed && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Your Vote</h2>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {CARD_VALUES.map((value) => (
                <button
                  key={value}
                  onClick={() => handleCardSelect(value)}
                  disabled={currentParticipant?.hasVoted}
                  className={`aspect-[3/4] rounded-lg border-2 font-bold text-xl transition-all ${
                    currentParticipant?.hasVoted
                      ? currentParticipant?.vote === value
                        ? "border-blue-500 bg-blue-500 text-white shadow-lg cursor-not-allowed"
                        : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      : currentParticipant?.vote === value
                        ? "border-blue-500 bg-blue-500 text-white shadow-lg hover:scale-105 cursor-pointer"
                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:scale-105 cursor-pointer"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {currentRoom.votesRevealed && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentRoom.participants
                .filter((p: Participant) => p.vote)
                .sort((a: Participant, b: Participant) => {
                  const aNum = parseInt(a.vote || "0");
                  const bNum = parseInt(b.vote || "0");
                  if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                  return 0;
                })
                .map((participant: Participant) => (
                  <div key={participant.id} className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{participant.vote}</div>
                    <div className="text-sm text-gray-600">{participant.name}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex gap-4 justify-center">
            {!currentRoom.votesRevealed && (
              <button
                onClick={handleRevealVotes}
                disabled={!allUsersVoted}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  allUsersVoted
                    ? "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {allUsersVoted ? "Reveal Votes" : "Waiting for all votes..."}
              </button>
            )}
            {currentRoom.votesRevealed && (
              <button
                onClick={handleResetVotes}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer"
              >
                Start New Round
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
