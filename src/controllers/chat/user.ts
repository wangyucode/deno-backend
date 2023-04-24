import { Room } from "./room.ts";

export class User {
  constructor(
    public id: number,
    public lastSeen: Date,
    public websocket: WebSocket,
    public room?: Room,
    public name?: string,
    public avatar?: string,
    public gender?: 0 | 1,
  ) {
  }

  destroy() {
    this.room = undefined;
    this.websocket.close();
    this.id = -1;
  }

  join(room: Room) {
    this.room = room;
  }
}
