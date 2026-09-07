import { PlayerProfile } from "../types";

type SocketListener = (payload: any) => void;

class GameSocketClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<SocketListener>>();
  private reconnectTimer: any = null;
  private currentProfile: PlayerProfile | null = null;
  private isExplicitlyClosed = false;

  public status: "connecting" | "connected" | "disconnected" = "disconnected";

  public connect(profile: PlayerProfile) {
    if (typeof window === "undefined") return;
    this.currentProfile = profile;
    this.isExplicitlyClosed = false;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.status = "connecting";
    this.emitStatus();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.status = "connected";
        this.emitStatus();
        // Register current player
        this.send({
          type: "register_player",
          playerId: profile.id,
          name: profile.name,
          avatar: profile.avatar,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.trigger(data.type, data);
        } catch (err) {
          console.error("Failed to parse WS incoming message:", err);
        }
      };

      this.ws.onclose = () => {
        this.status = "disconnected";
        this.emitStatus();
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn("WebSocket encounter:", err);
      };
    } catch (err) {
      console.error("WebSocket connection failure:", err);
      this.status = "disconnected";
      this.emitStatus();
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.currentProfile && !this.isExplicitlyClosed) {
        this.connect(this.currentProfile);
      }
    }, 2500);
  }

  public send(payload: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  public on(event: string, callback: SocketListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off(event: string, callback: SocketListener) {
    const list = this.listeners.get(event);
    if (list) {
      list.delete(callback);
    }
  }

  private trigger(event: string, data: any) {
    const list = this.listeners.get(event);
    if (list) {
      list.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in event listener for '${event}':`, err);
        }
      });
    }
  }

  private emitStatus() {
    this.trigger("connection_status", { status: this.status });
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = "disconnected";
    this.emitStatus();
  }
}

export const socketClient = new GameSocketClient();
