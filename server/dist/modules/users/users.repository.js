import { createJsonStore } from "../../services/json-store.service.js";
const store = createJsonStore("users");
export const usersRepository = {
    findByWallet(walletAddress) {
        return (store.list().find((user) => user.walletAddress === walletAddress) ?? null);
    },
    upsert(user) {
        return store.upsert(user);
    },
    listArtists() {
        return store.list().filter((user) => user.role === "artist");
    },
};
