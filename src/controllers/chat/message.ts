import { User } from "./user.ts";

export class Message {
  constructor(
    public type: MessageType,
    public content: string,
    public time: Date,
    public sender: User | string,
  ) {}
}

export enum MessageType {
  TEXT = "text",
  PING = "ping",
  PONG = "pong",
  JOIN = "join",
  LEAVE = "leave",
  ERROR = "error",
  CREATED = "created",
}
