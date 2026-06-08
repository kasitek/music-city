import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

type WithId = { id: string };

const ensureFile = (filePath: string) => {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });

  if (!existsSync(filePath)) {
    writeFileSync(filePath, "[]\n", "utf8");
  }
};

const readRows = <T>(filePath: string): T[] => {
  ensureFile(filePath);
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T[];
};

const writeRows = <T>(filePath: string, rows: T[]) => {
  ensureFile(filePath);
  writeFileSync(filePath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
};

export const createJsonStore = <T extends WithId>(name: string) => {
  const filePath = join(process.cwd(), "server", "data", `${name}.json`);

  return {
    list() {
      return readRows<T>(filePath);
    },

    findById(id: string) {
      return readRows<T>(filePath).find((row) => row.id === id) ?? null;
    },

    replace(rows: T[]) {
      writeRows(filePath, rows);
    },

    upsert(row: T) {
      const rows = readRows<T>(filePath);
      const index = rows.findIndex((item) => item.id === row.id);

      if (index >= 0) {
        rows[index] = row;
      } else {
        rows.push(row);
      }

      writeRows(filePath, rows);
      return row;
    },
  };
};
