import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const name = searchParams.get("name");

  useEffect(() => {
    if (!roomId || !name) {
      navigate("/");
      return;
    }
  }, [roomId, name, navigate]);

  if (!name || !roomId) {
    return (
      <div className="p-6 font-sans max-w-4xl mx-auto text-center">
        <div className="text-gray-500">Loading room...</div>
      </div>
    );
  }

  return (
    <div className="p-6 font-sans max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Room: {roomId}</h2>
      <h3 className="text-xl mb-4">Hello, {name}</h3>

      <p className="text-gray-600"></p>
    </div>
  );
};

export default Room;
