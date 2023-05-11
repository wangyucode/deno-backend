import { helpers } from "../../deps.ts";
import { logger } from "../logger.ts";
import { sendEmail } from "../notifier.ts";
import { Context } from "../types.ts";
import { Message, MessageType } from "./chat/message.ts";
import { RoomType } from "./chat/room.ts";
import { Room } from "./chat/room.ts";
import { User } from "./chat/user.ts";

const MAX_ROOMS = 10000;
const rooms = new Map<number, Room>();
const unusedId: number[] = [];
const CLEAR_INTERVAL = 1000 * 60 * 5;

function init(): void {
  for (let i = 0; i < MAX_ROOMS; i++) {
    unusedId.push(i);
  }
  setInterval(() => {
    clear();
  }, CLEAR_INTERVAL);
}

init();

// clear all rooms
export function clear() {
  const now = new Date();
  rooms.forEach((room) => {
    room.users.forEach((user) => {
      if (now.getTime() - user.lastSeen.getTime() > CLEAR_INTERVAL) {
        logger.info(`[ws] [clear] ${room.id} ${user.id} offline`);
        room.remove(user.id);
        room.send(
          new Message(MessageType.OFFLINE, user.id, new Date(), "system"),
        );
        user.destroy();
      }
    });
    if (room.users.size === 0) {
      logger.info(`[ws] [clear] remove ${room.id}`);
      rooms.delete(Number.parseInt(room.id));
      unusedId.push(Number.parseInt(room.id));
    }
  });
}

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
    room.join(user);
    room.send(new Message(MessageType.CREATED, room.id, new Date(), "system"));
    room.send(new Message(MessageType.JOIN, user.id, new Date(), "system"));
    user.send(new Message(MessageType.WELCOME, user.id, new Date(), "system"));
    if (rooms.size % 100 === 0) {
      sendEmail(`chat: ${rooms.size} rooms`);
    }
  };
}

// Join a room
export function join(ctx: Context) {
  const { rid, type, uid } = helpers.getQuery(ctx, { mergeParams: true });
  if (!rid) ctx.throw(400, "id required");
  const roomType = Number.parseInt(type);
  if (
    !roomType || roomType > RoomType.CHAT
  ) {
    ctx.throw(400, "type not valid");
  }
  const room = rooms.get(Number.parseInt(rid));
  if (!room || room.type !== roomType) ctx.throw(404, "room not found");

  if (!ctx.isUpgradable) ctx.throw(400, "websocket required");
  const websocket = ctx.upgrade();

  websocket.onopen = () => {
    const reconnectUserId = Number.parseInt(uid);
    const newUserId = room.maxUserId + 1;
    const user = new User(
      reconnectUserId ? reconnectUserId : newUserId,
      new Date(),
      websocket,
    );
    room.remove(reconnectUserId);
    room.join(user);
    room.send(
      new Message(
        reconnectUserId ? MessageType.RECONNECT : MessageType.JOIN,
        user.id,
        new Date(),
        "system",
      ),
    );
    user.send(new Message(MessageType.WELCOME, user.id, new Date(), "system"));
    if (room.users.size % 5 === 0) {
      sendEmail(`chat: ${room.id} has ${room.users.size} users`);
    }
  };
}
