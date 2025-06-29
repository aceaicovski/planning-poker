import { useSocket } from "@/hooks/useSocket";

export const SocketInitializer = ({ children }: { children: React.ReactNode }) => {
  // Initialize socket connection
  useSocket();

  return <>{children}</>;
};
