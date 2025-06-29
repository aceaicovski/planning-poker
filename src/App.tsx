import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Lobby from "./modules/Lobby.tsx";
import Room from "./modules/Room.tsx";
import NotFound from "./components/NotFound.tsx";
import { SocketInitializer } from "./components/SocketInitializer.tsx";

function App() {
  return (
    <SocketInitializer>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Lobby />} />

          <Route path="/room/:roomId" element={<Room />} />

          <Route path="/lobby" element={<Navigate to="/" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </SocketInitializer>
  );
}

export default App;
