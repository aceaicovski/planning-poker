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
    if (!globalSocket) {
      globalSocket = new WebSocket("ws://localhost:3001");

      globalSocket.onopen = () => {
        console.log("Connected to WebSocket server");
        setConnectionStatus(true);
      };

      globalSocket.onclose = () => {
        console.log("Disconnected from WebSocket server");
        setConnectionStatus(false);
      };

      globalSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus(false);
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
    }

    socketRef.current = globalSocket;

    return () => {
      // Don't disconnect on component unmount, keep connection alive
    };
  }, [setConnectionStatus, updateRoom]);

  const createRoom = useCallback(
    (userName: string) => {
      return new Promise<{ roomId: string; userId: string }>((resolve, reject) => {
        setLoading(true);

        sendMessage<{ success: boolean; roomId: string; userId: string }>(
          "create-room",
          { userName },
          true
        )
          .then((response) => {
            setLoading(false);
            setUserInfo({
              userId: response.userId,
              userName: userName,
            });
            resolve({ roomId: response.roomId, userId: response.userId });
          })
          .catch((error) => {
            setLoading(false);
            const errorMessage = error instanceof Error ? error.message : "Failed to create room";
            setError(errorMessage);
            reject(error);
          });
      });
    },
    [sendMessage, setError, setLoading, setUserInfo]
  );

  const joinRoom = useCallback(
    (roomId: string, userName: string) => {
      return new Promise<{ roomId: string; userId: string }>((resolve, reject) => {
        setLoading(true);

        sendMessage<{ success: boolean; roomId: string; userId: string }>(
          "join-room",
          { roomId, userName },
          true
        )
          .then((response) => {
            setLoading(false);
            setUserInfo({
              userId: response.userId,
              userName: userName,
            });
            resolve({ roomId: response.roomId, userId: response.userId });
          })
          .catch((error) => {
            setLoading(false);
            const errorMessage = error instanceof Error ? error.message : "Failed to join room";
            setError(errorMessage);
            reject(error);
          });
      });
    },
    [sendMessage, setError, setLoading, setUserInfo]
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

  const getRoomState = useCallback(() => {
    return new Promise<Room>((resolve, reject) => {
      sendMessage<{ success: boolean; room: Room }>("get-room-state", {}, true)
        .then((response) => {
          setRoom(response.room);
          resolve(response.room);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }, [setRoom, sendMessage]);

  const disconnect = useCallback(() => {
    if (globalSocket) {
      globalSocket.close();
      globalSocket = null;
    }
    reset();
  }, [reset]);

  return {
    socket: socketRef.current,
    createRoom,
    joinRoom,
    vote,
    revealVotes,
    resetVotes,
    getRoomState,
    disconnect,
  };
};
