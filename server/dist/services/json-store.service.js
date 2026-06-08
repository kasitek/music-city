import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
const ensureFile = (filePath) => {
    const dir = dirname(filePath);
    mkdirSync(dir, { recursive: true });
    if (!existsSync(filePath)) {
        writeFileSync(filePath, "[]\n", "utf8");
    }
};
const readRows = (filePath) => {
    ensureFile(filePath);
    const raw = readFileSync(filePath, "utf8");
    return JSON.parse(raw);
};
const writeRows = (filePath, rows) => {
    ensureFile(filePath);
    writeFileSync(filePath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
};
export const createJsonStore = (name) => {
    const filePath = join(process.cwd(), "server", "data", `${name}.json`);
    return {
        list() {
            return readRows(filePath);
        },
        findById(id) {
            return readRows(filePath).find((row) => row.id === id) ?? null;
        },
        replace(rows) {
            writeRows(filePath, rows);
        },
        upsert(row) {
            const rows = readRows(filePath);
            const index = rows.findIndex((item) => item.id === row.id);
            if (index >= 0) {
                rows[index] = row;
            }
            else {
                rows.push(row);
            }
            writeRows(filePath, rows);
            return row;
        },
    };
};
