const trimSlash = (value: string) => value.replace(/\/$/, "");

export const clientEnv = {
  apiBaseUrl: trimSlash(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1",
  ),
};
