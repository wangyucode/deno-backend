import { logger } from "../../logger.ts";
import { Message, MessageType } from "./message.ts";
import { Room } from "./room.ts";

export class User {
  public room?: Room;
  constructor(
    public id: number,
    public lastSeen: Date,
    public websocket: WebSocket,
    public name?: string,
    public avatar?: string,
    public gender?: 0 | 1,
  ) {
    websocket.addEventListener("message", (e) => {
      logger.info(`[ws] ${e.data}`);
      this.onMessage(JSON.parse(e.data));
    });
  }

  onMessage(message: Message) {
    if (message.type === MessageType.PING) {
      this.lastSeen = new Date();
      this.send(
        new Message(
          MessageType.PONG,
          null,
          new Date(),
          "system",
        ),
      );
      return;
    }
    if (!this.room) return;
    this.room.send(message);
  }

  send(message: Message) {
    if (this.websocket.readyState !== WebSocket.OPEN) return;
    if (
      message.type === MessageType.JOIN || message.content.user.id === this.id
    ) {
      message.content.room = this.room;
    }
    this.websocket.send(JSON.stringify(message));
  }

  destroy() {
    this.room = undefined;
    this.websocket.close();
    this.id = -1;
  }
}
