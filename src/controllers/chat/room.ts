import { Message } from "./message.ts";
import { User } from "./user.ts";

export class Room {
  users = new Map<number, User>();
  messages: Message[] = [];
  maxUserId = 0;

  constructor(
    public id: string,
    public type: RoomType,
  ) {}

  join(user: User) {
    this.users.set(user.id, user);
    user.room = this;
    if (user.id > this.maxUserId) this.maxUserId = user.id;
  }

  send(msg: Message) {
    this.users.forEach((user) => user.send(msg));
    this.messages.push(msg);
  }

  remove(id: number) {
    this.users.delete(id);
  }
}

export enum RoomType {
  CHAT = 1,
}
