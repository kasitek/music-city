
export { idlFactory as backendIDL } from "../../src/declarations/music_city_backend";

//FIX ME : Add NEXT_PUBLIC_ENVIRONMENT to the .env with either "local" or "ic"
const network = process.env.NEXT_PUBLIC_ENVIRONMENT || "local";

interface CanisterConfigType {
  [key: string]: {
    [env: string]: string;
  };
}

let prodConfig: CanisterConfigType = {};
let localConfig: CanisterConfigType = {};

try {
  prodConfig = require('../../canister_ids.json');
} catch (error) {
  console.warn('Production canister config not found, using fallback');
}

try {
  if (network === "local") {
    localConfig = require('../../.dfx/local/canister_ids.json');
  }
} catch (error) {
  console.warn('Local canister config not found, using fallback');
}

export function getCanisterId(key: string): string {
  if (network === "ic") {
    const config: CanisterConfigType = prodConfig;
    if (config[key]) {
      return config[key]['ic'];
    } else {
      console.error(`Canister ID for key "${key}" not found in production config.`);
      return "";
    }
  } else {
    const config: CanisterConfigType = localConfig;
    if (config[key]) {
      return config[key]['local'];
    } else {
      console.error(`Canister ID for key "${key}" not found in local configuration.`);
      return "";
    }
  }
}

type Env = "ic" | "local";


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