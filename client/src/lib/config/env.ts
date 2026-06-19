const trimSlash = (value: string) => value.replace(/\/$/, "");
const dynamicEnvironmentId =
  process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID?.trim() ||
  "dynamic-environment-id-required";

export const clientEnv = {
  apiBaseUrl: trimSlash(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1",
  ),
  appBaseUrl: trimSlash(
    process.env.NEXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3000",
  ),
  dynamicEnvironmentId,
  isDynamicConfigured:
    dynamicEnvironmentId !== "dynamic-environment-id-required",
};
