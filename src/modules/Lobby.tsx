import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { useStoreState } from "@/store/hooks/useStoreState";

const Lobby = () => {
  const [nameInput, setNameInput] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");

  const { createRoom, joinRoom } = useSocket();
  const { isLoading, error } = useStoreState((state) => state.poker);
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      alert(error);
    }
  }, [error]);

  const handleCreateRoom = async () => {
    if (!nameInput.trim()) {
      alert("Please enter your name");
      return;
    }

    try {
      const { roomId } = await createRoom(nameInput.trim());
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  const handleJoinRoom = async () => {
    if (!nameInput.trim()) {
      alert("Please enter your name");
      return;
    }

    if (!roomIdInput.trim()) {
      alert("Please enter a room ID");
      return;
    }

    try {
      const roomId = roomIdInput.trim().toUpperCase();
      await joinRoom(roomId, nameInput.trim());
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Failed to join room:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: "create" | "join") => {
    if (e.key === "Enter") {
      if (action === "create") {
        handleCreateRoom();
      } else {
        handleJoinRoom();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Planning Poker</h1>
          <p className="text-gray-600">Estimate story points collaboratively with your team</p>
        </div>

        <div className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, "create")}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              disabled={isLoading}
              maxLength={50}
            />
          </div>

          {/* Create New Room */}
          <div className="space-y-3">
            <button
              onClick={handleCreateRoom}
              disabled={!nameInput.trim() || isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {isLoading ? "Creating Room..." : "Create New Room"}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          {/* Join Existing Room */}
          <div className="space-y-3">
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
              Join Existing Room
            </label>
            <input
              id="roomId"
              type="text"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, "join")}
              placeholder="Enter Room ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              disabled={isLoading}
              maxLength={8}
            />
            <button
              onClick={handleJoinRoom}
              disabled={!nameInput.trim() || !roomIdInput.trim() || isLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {isLoading ? "Joining Room..." : "Join Room"}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-800 mb-2">How it works:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Enter your name and create a new room</li>
            <li>• Share the room ID with your team</li>
            <li>• Vote on story points together</li>
            <li>• Reveal votes when everyone is ready</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
