import { Message } from "./message.ts";
import { User } from "./user.ts";

export class Room {
  users = new Map<number, User>();
  messages: Message[] = [];

  constructor(
    public id: string,
    public type: RoomType,
  ) {}

  join(user: User) {
    this.users.set(user.id, user);
    user.room = this;
  }

  send(msg: Message) {
    this.users.forEach((user) => user.send(msg));
    this.messages.push(msg);
  }
}

export enum RoomType {
  CHAT = 1,
}
