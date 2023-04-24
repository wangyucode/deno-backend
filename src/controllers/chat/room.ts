import { Message } from "./message.ts";
import { User } from "./user.ts";

export class Room {
  users = new Map<number, User>();
  messages: Message[] = [];

  constructor(
    public id: string,
    public type: RoomType,
    public password?: string,
  ) {}

  join(user: User) {
    this.users.set(user.id, user);
    user.join(this);
  }
}

export enum RoomType {
  CHAT = "chat",
}
