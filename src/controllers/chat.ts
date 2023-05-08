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
  for (let i = 0; i < MAX_ROOMS; i++) {
    unusedId.push(i);
  }
}

init();

export function create(ctx: Context) {
  const queries = helpers.getQuery(ctx, { mergeParams: true });
  const type = Number.parseInt(queries.type);
  if (
    !type || type > RoomType.CHAT
  ) {
    ctx.throw(400, "type not valid");
  }

  if (!ctx.isUpgradable) ctx.throw(400, "websocket required");
  const websocket = ctx.upgrade();

  websocket.onopen = () => {
    const user = new User(1, new Date(), websocket);
    const id =
      unusedId.splice(Math.floor(Math.random() * unusedId.length), 1)[0];
    const room = new Room(
      id.toString().padStart(4, "0"),
      type as RoomType,
    );
    rooms.set(id, room);
    room.send(new Message(MessageType.CREATED, room.id, new Date(), "system"));
    room.join(user);
    room.send(
      new Message(
        MessageType.JOIN,
        lodash.pick(user, "id"),
        new Date(),
        "system",
      ),
    );
  };
}

// Join a room
export function join(ctx: Context) {
  const { id, type } = helpers.getQuery(ctx, { mergeParams: true });
  if (!id) ctx.throw(400, "id required");
  const roomType = Number.parseInt(type);
  if (
    !roomType || roomType > RoomType.CHAT
  ) {
    ctx.throw(400, "type not valid");
  }
  const room = rooms.get(Number.parseInt(id));
  if (!room || room.type !== roomType) ctx.throw(404, "room not found");

  if (!ctx.isUpgradable) ctx.throw(400, "websocket required");
  const websocket = ctx.upgrade();

  websocket.onopen = () => {
    const user = new User(room.users.size + 1, new Date(), websocket);
    room.join(user);
    room.send(
      new Message(
        MessageType.JOIN,
        lodash.pick(user, "id"),
        new Date(),
        "system",
      ),
    );
  };
}
