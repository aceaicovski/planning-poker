import { useEffect, useRef, useCallback } from "react";
import { useStoreActions } from "@/store/hooks/useStoreActions";
import { type Room } from "@/store/mainSlice";

let globalSocket: WebSocket | null = null;
let messageId = 0;
interface PendingRequest<T = unknown> {
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

const pendingRequests = new Map<number, PendingRequest<unknown>>();

export const useSocket = () => {
  const { setConnectionStatus, updateRoom, setLoading, setUserInfo, reset, setError, setRoom } =
    useStoreActions();
  const socketRef = useRef<WebSocket | null>(null);

  const initializeConnection = useCallback((existingUserId?: string, roomId?: string, userName?: string) => {
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      socketRef.current = globalSocket;
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      if (globalSocket) {
        globalSocket.close();
      }

      globalSocket = new WebSocket("ws://localhost:3001");
      socketRef.current = globalSocket;

      globalSocket.onopen = () => {
        console.log("Connected to WebSocket server");
        setConnectionStatus(true);
        
        // If we have existing user info, try to reconnect
        if (existingUserId && roomId && userName) {
          console.log("Attempting to reconnect with existing user data");
          sendMessage("reconnect", { userId: existingUserId, roomId, userName }, true)
            .then(() => {
              console.log("Reconnection successful");
              resolve();
            })
            .catch((error) => {
              console.log("Reconnection failed, continuing as new connection:", error);
              resolve();
            });
        } else {
          resolve();
        }
      };

      globalSocket.onclose = () => {
        console.log("Disconnected from WebSocket server");
        setConnectionStatus(false);
      };

      globalSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus(false);
        reject(error);
      };

      globalSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, payload, id } = message;

          // Handle responses to requests
          if (id && pendingRequests.has(id)) {
            const { resolve, reject } = pendingRequests.get(id)!;
            pendingRequests.delete(id);

            if (type.endsWith("-response")) {
              if (payload.success) {
                resolve(payload);
              } else {
                reject(new Error(payload.error || "Request failed"));
              }
            }
            return;
          }

          // Handle broadcasts
          switch (type) {
            case "room-updated":
              updateRoom(payload as Room);
              break;
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };
    });
  }, [setConnectionStatus, updateRoom]);

  const sendMessage = useCallback(
    <T = unknown>(
      type: string,
      payload: Record<string, unknown>,
      expectResponse = false
    ): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          reject(new Error("WebSocket not connected"));
          return;
        }

        const id = ++messageId;
        const message = { type, payload, id };

        if (expectResponse) {
          pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject });
        } else {
          socketRef.current.send(JSON.stringify(message));
          resolve(undefined as T);
        }

        if (expectResponse) {
          socketRef.current.send(JSON.stringify(message));
        }
      });
    },
    []
  );

  useEffect(() => {
    socketRef.current = globalSocket;
  }, []);

  const createRoom = useCallback(
    async (userName: string) => {
      setLoading(true);
      setError(null);

      try {
        // Initialize connection first
        await initializeConnection();

        // Then create room
        const response = await sendMessage<{ success: boolean; roomId: string; userId: string }>(
          "create-room",
          { userName },
          true
        );

        setLoading(false);
        setUserInfo({
          userId: response.userId,
          userName: userName,
        });

        return { roomId: response.roomId, userId: response.userId };
      } catch (error) {
        setLoading(false);
        const errorMessage = error instanceof Error ? error.message : "Failed to create room";
        setError(errorMessage);
        throw error;
      }
    },
    [initializeConnection, sendMessage, setError, setLoading, setUserInfo]
  );

  const joinRoom = useCallback(
    async (roomId: string, userName: string) => {
      setLoading(true);
      setError(null);

      try {
        // Initialize connection first
        await initializeConnection();

        // Then join room
        const response = await sendMessage<{ success: boolean; roomId: string; userId: string }>(
          "join-room",
          { roomId, userName },
          true
        );

        setLoading(false);
        setUserInfo({
          userId: response.userId,
          userName: userName,
        });

        return { roomId: response.roomId, userId: response.userId };
      } catch (error) {
        setLoading(false);
        const errorMessage = error instanceof Error ? error.message : "Failed to join room";
        setError(errorMessage);
        throw error;
      }
    },
    [initializeConnection, sendMessage, setError, setLoading, setUserInfo]
  );

  const vote = useCallback(
    (voteValue: string | null) => {
      return sendMessage("vote", { vote: voteValue });
    },
    [sendMessage]
  );

  const revealVotes = useCallback(() => {
    return sendMessage("reveal-votes", {});
  }, [sendMessage]);

  const resetVotes = useCallback(() => {
    return sendMessage("reset-votes", {});
  }, [sendMessage]);


  const getRoomState = useCallback(async () => {
    // Only get room state if already connected
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      throw new Error("Not connected to server");
    }

    const response = await sendMessage<{ success: boolean; room: Room }>("get-room-state", {}, true);
    setRoom(response.room);
    return response.room;
  }, [setRoom, sendMessage]);

  const reconnectWithExistingUser = useCallback(async (userId: string, roomId: string, userName: string) => {
    try {
      await initializeConnection(userId, roomId, userName);
      // After reconnection, get the current room state
      const response = await sendMessage<{ success: boolean; room: Room }>("get-room-state", {}, true);
      setRoom(response.room);
      return response.room;
    } catch (error) {
      console.error("Failed to reconnect:", error);
      // Clear any session data if reconnection fails completely
      reset();
      throw error;
    }
  }, [initializeConnection, sendMessage, setRoom, reset]);

  const disconnect = useCallback(() => {
    if (globalSocket) {
      globalSocket.close();
      globalSocket = null;
    }
    reset();
  }, [reset]);

  return {
    socket: socketRef.current,
    initializeConnection,
    reconnectWithExistingUser,
    createRoom,
    joinRoom,
    vote,
    revealVotes,
    resetVotes,
    getRoomState,
    disconnect,
  };
};
