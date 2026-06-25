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
  stellarHorizonUrl:
    process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ??
    "https://horizon-testnet.stellar.org",
  stellarNetworkPassphrase:
    process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ??
    "Test SDF Network ; September 2015",
  isDynamicConfigured:
    dynamicEnvironmentId !== "dynamic-environment-id-required",
};
