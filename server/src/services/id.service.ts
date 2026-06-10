export const createId = (prefix: string) => {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
};
