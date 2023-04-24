import { Context } from "../types.ts";
import { Message, MessageType } from "./chat/message.ts";
import { RoomType } from "./chat/room.ts";
import { Room } from "./chat/room.ts";
import { User } from "./chat/user.ts";

const MAX_ROOMS = 10000;
const rooms = new Map<number, Room>();
const unusedId: number[] = [];

/**
 * initialize empty rooms, has random id from 0000 to 9999, password is wycode, type is chat
 */
export function init(): void {
  for (let i = 1; i < MAX_ROOMS; i++) {
    unusedId.push(i);
  }

  const defaultRoom = new Room("0000", RoomType.CHAT, "wycode");
  rooms.set(0, defaultRoom);
}

export async function create(ctx: Context): Promise<void> {
  const data = await ctx.request.body().value;
  if (!data || !data.type || !(data.type in RoomType)) {
    ctx.throw(400, "type not valid");
  }
  if (!data.type) ctx.throw(400, "password required");

  if (!ctx.isUpgradable) ctx.throw(400, "websocket required");
  const websocket = ctx.upgrade();

  const user = new User(0, new Date(), websocket);
  const id = unusedId.slice(Math.floor(Math.random() * MAX_ROOMS), 1)[0];
  const room = new Room(
    id.toString().padStart(4, "0"),
    data.type,
    data.password,
  );
  rooms.set(id, room);
  room.join(user);
  websocket.send(
    JSON.stringify(
      new Message(MessageType.CREATED, room.id, new Date(), "system"),
    ),
  );
}

// Join a room
export async function join(ctx: Context): Promise<void> {
  const data = await ctx.request.body().value;
  if (!data || !data.id) ctx.throw(400, "id required");
  const room = rooms.get(data.id);
  if (!room) ctx.throw(404, "room not found");
  if (room.password !== data.password) ctx.throw(400, "password not valid");

  if (!ctx.isUpgradable) ctx.throw(400, "websocket required");
  const websocket = ctx.upgrade();

  const user = new User(room.users.size, new Date(), websocket);
  room.join(user);
}
