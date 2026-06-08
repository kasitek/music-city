export const createId = (prefix) => {
    return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
};
