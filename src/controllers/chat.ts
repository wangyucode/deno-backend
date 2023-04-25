import { helpers, lodash } from "../../deps.ts";
import { Context } from "../types.ts";
import { Message, MessageType } from "./chat/message.ts";
import { RoomType } from "./chat/room.ts";
import { Room } from "./chat/room.ts";
import { User } from "./chat/user.ts";

const MAX_ROOMS = 10000;
const rooms = new Map<number, Room>();
const unusedId: number[] = [];

function init(): void {
  for (let i = 1; i < MAX_ROOMS; i++) {
    unusedId.push(i);
  }

  const defaultRoom = new Room("0000", RoomType.CHAT, "wycode");
  rooms.set(0, defaultRoom);
}

init();

export function create(ctx: Context) {
  const { type, password } = helpers.getQuery(ctx, { mergeParams: true });
  if (
    !type || !(Object.values(RoomType) as string[]).includes(type.toString())
  ) {
    ctx.throw(400, "type not valid");
  }

  if (!ctx.isUpgradable) ctx.throw(400, "websocket required");
  const websocket = ctx.upgrade();

  websocket.onopen = () => {
    const user = new User(0, new Date(), websocket);
    const id =
      unusedId.splice(Math.floor(Math.random() * unusedId.length), 1)[0];
    const room = new Room(
      id.toString().padStart(4, "0"),
      type as RoomType,
      password,
    );
    rooms.set(id, room);
    room.join(user);

    room.send(new Message(MessageType.CREATED, room.id, new Date(), "system"));
  };
}

// Join a room
export function join(ctx: Context) {
  const { id, type, password } = helpers.getQuery(ctx, { mergeParams: true });
  if (!id) ctx.throw(400, "id required");
  if (
    !type || !(Object.values(RoomType) as string[]).includes(type.toString())
  ) {
    ctx.throw(400, "type not valid");
  }
  const room = rooms.get(Number.parseInt(id));
  if (!room || room.type !== type) ctx.throw(404, "room not found");
  if (room.password !== password) ctx.throw(401, "password not valid");

  if (!ctx.isUpgradable) ctx.throw(400, "websocket required");
  const websocket = ctx.upgrade();

  websocket.onopen = () => {
    const user = new User(room.users.size, new Date(), websocket);
    room.join(user);

    room.send(
      new Message(
        MessageType.JOIN,
        { user: lodash.omit(user, "websocket") },
        new Date(),
        "system",
      ),
    );
  };
}
