// components/NotFound.tsx
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Room Not Found</h1>
          <p className="text-gray-600">The page or room you're looking for doesn't exist.</p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Go to Lobby
          </Link>

          <div className="text-sm text-gray-500">
            <p>Make sure you have the correct room ID or</p>
            <p>create a new room from the lobby.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
