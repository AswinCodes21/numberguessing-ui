
import * as signalR from "@microsoft/signalr";

const HUB_URL = "https://number-guessing-backend-thhc.onrender.com/gameHub";

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private _isConnected: boolean = false;

  public get isConnected(): boolean {
    return this._isConnected;
  }

  public getConnection(): signalR.HubConnection {
    if (!this.connection) {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.connection.onreconnecting((error) => {
        this._isConnected = false;
        console.warn("[SignalR: STATUS] Reconnecting...", error);
      });

      this.connection.onreconnected((connectionId) => {
        this._isConnected = true;
        console.log(`[SignalR: STATUS] Reconnected. New ID: ${connectionId}`);
      });

      this.connection.onclose((error) => {
        this._isConnected = false;
        console.error("[SignalR: STATUS] Connection closed.", error);
      });
    }
    return this.connection;
  }

  public async start(): Promise<void> {
    const conn = this.getConnection();
    if (conn.state === signalR.HubConnectionState.Disconnected) {
      try {
        console.log(`[SignalR: STATUS] Attempting to connect to ${HUB_URL}...`);
        await conn.start();
        this._isConnected = true;
        console.log("[SignalR: STATUS] Connected successfully.");
      } catch (err) {
        this._isConnected = false;
        console.error("[SignalR: STATUS] Connection failed:", err);
        // Retry logic
        setTimeout(() => this.start(), 5000);
      }
    }
  }

  public async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this._isConnected = false;
      console.log("[SignalR: STATUS] Connection stopped manually.");
    }
  }
}

export const signalRService = new SignalRService();
