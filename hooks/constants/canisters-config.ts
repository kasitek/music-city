
export { idlFactory as backendIDL } from "../../src/declarations/music_city_backend";
import productionCanisterIds from "../../canister_ids.json";
import localCanisterIds from "../../public/canister_ids.json";

type Env = "ic" | "local";

const requestedNetwork = process.env.NEXT_PUBLIC_ENVIRONMENT as Env | undefined;
const network: Env = requestedNetwork || (process.env.VERCEL ? "ic" : "local");

interface CanisterConfigType {
  [key: string]: {
    [env: string]: string | undefined;
  };
}

const canisterIdsByNetwork: Record<Env, CanisterConfigType> = {
  ic: productionCanisterIds,
  local: localCanisterIds,
};

const fallbackCanisterIds: CanisterConfigType = {
  internet_identity: {
    ic: "rdmx6-jaaaa-aaaaa-aaadq-cai",
    local: "rdmx6-jaaaa-aaaaa-aaadq-cai",
  },
};

const envCanisterOverrides: Record<string, string | undefined> = {
  internet_identity: process.env.NEXT_PUBLIC_INTERNET_IDENTITY_CANISTER_ID,
  music_city_backend: process.env.NEXT_PUBLIC_MUSIC_CITY_BACKEND_CANISTER_ID,
  storage_bucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET_CANISTER_ID,
  storage_index: process.env.NEXT_PUBLIC_STORAGE_INDEX_CANISTER_ID,
};

export function getCanisterId(key: string): string {
  const envOverride = envCanisterOverrides[key];
  if (envOverride) {
    return envOverride;
  }

  const canisterId =
    canisterIdsByNetwork[network]?.[key]?.[network] ||
    fallbackCanisterIds[key]?.[network];
  if (canisterId) {
    return canisterId;
  }

  console.error(`Canister ID for key "${key}" not found in ${network} configuration.`);
  return "";
}


interface CanisterConfig {
  backendCanisterId: string;
  internetIdentityCanisterId: string;

}

const productionCanisters: CanisterConfig = {
  backendCanisterId: getCanisterId('music_city_backend'),
  internetIdentityCanisterId: getCanisterId('internet_identity'),
};

const localCanisters: CanisterConfig = {
  backendCanisterId: getCanisterId('music_city_backend'),
  internetIdentityCanisterId: getCanisterId('internet_identity'),
};

const canisterConfigs: Record<Env, CanisterConfig> = {
  ic:  productionCanisters,
  local: localCanisters,
};

export const {
  backendCanisterId,
  internetIdentityCanisterId,
} = canisterConfigs[network as Env];
