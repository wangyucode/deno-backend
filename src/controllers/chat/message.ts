export class Message {
  constructor(
    public type: MessageType,
    // deno-lint-ignore no-explicit-any
    public content?: any,
    public time?: Date,
    public sender?: string | number,
  ) {}
}

export enum MessageType {
  TEXT = "text",
  PING = "ping",
  PONG = "pong",
  JOIN = "join",
  RECONNECT = "reconnect",
  LEAVE = "leave",
  ERROR = "error",
  CREATED = "created",
  WELCOME = "welcome",
}
