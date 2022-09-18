import { openDB } from "idb";

const DB_NAME = "kitsustats";
const DB_VERSION = 1;
const STORE_NAME = "userData";

const db = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME);
  },
});

async function get(userId) {
  return (await db).get(STORE_NAME, userId);
}

async function set(userId, data) {
  return (await db).put(STORE_NAME, data, userId);
}

async function del(userId) {
  return (await db).delete(STORE_NAME, userId);
}

async function keys() {
  return (await db).getAllKeys(STORE_NAME);
}

async function getAll() {
  return (await db).getAll(STORE_NAME);
}

export default {
  get,
  set,
  del,
  keys,
  getAll,
};
