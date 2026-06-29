import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const SALT_BYTES = 16;
const KEY_BYTES = 64;

export const passwordService = {
  async hashPassword(password: string) {
    const salt = randomBytes(SALT_BYTES).toString("hex");
    const derivedKey = (await scrypt(password, salt, KEY_BYTES)) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
  },

  async verifyPassword(password: string, storedHash: string) {
    const [salt, hash] = storedHash.split(":");

    if (!salt || !hash) {
      return false;
    }

    const derivedKey = (await scrypt(password, salt, KEY_BYTES)) as Buffer;
    const storedKey = Buffer.from(hash, "hex");

    if (storedKey.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(storedKey, derivedKey);
  },
};
