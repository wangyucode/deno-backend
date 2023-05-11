import { logger } from "../../logger.ts";
import { Message, MessageType } from "./message.ts";
import { Room } from "./room.ts";

export class User {
  public room?: Room;
  constructor(
    public id: number,
    public lastSeen: Date,
    public websocket: WebSocket,
  ) {
    websocket.addEventListener("message", (e) => {
      logger.debug(`[ws] ${e.data}`);
      this.onMessage(JSON.parse(e.data));
    });
  }

  onMessage(message: Message) {
    if (message.type === MessageType.PING) {
      this.lastSeen = new Date();
      this.send(new Message(MessageType.PONG));
      return;
    }
    const room = this.room;
    if (!room) return;
    logger.info(`[ws] ${room.id} ${message.type} ${message.content}`);
    message.sender = this.id;

    if (message.type === MessageType.LEAVE) {
      room.remove(this.id);
      message.sender = "system";
      message.content = this.id;
      this.destroy();
    }
    room.send(message);
  }

  send(message: Message) {
    if (this.websocket.readyState !== WebSocket.OPEN) return;
    if (
      (message.type === MessageType.JOIN ||
        message.type === MessageType.RECONNECT) &&
      message.content === this.id
    ) {
      this.room?.messages.forEach((msg) =>
        this.websocket.send(JSON.stringify(msg))
      );
    }
    this.websocket.send(JSON.stringify(message));
  }

  destroy() {
    this.room = undefined;
    this.websocket.close();
    this.id = -1;
  }
}
