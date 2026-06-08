type DynamicFreighterModule = {
  getAddress?: () => Promise<string | { address?: string; publicKey?: string }>;
  getPublicKey?: () => Promise<string>;
  signTransaction?: (
    xdr: string,
    options?: Record<string, unknown>,
  ) => Promise<string | { signedTxXdr?: string }>;
  requestAccess?: () => Promise<unknown>;
  setAllowed?: () => Promise<unknown>;
};

const resolveAddress = async (module: DynamicFreighterModule) => {
  const getter = module.getAddress ?? module.getPublicKey;

  if (!getter) {
    throw new Error("Freighter address API is unavailable");
  }

  const result = await getter();

  if (typeof result === "string") {
    return result;
  }

  return result.address ?? result.publicKey ?? "";
};

export const freighterWallet = {
  async connect() {
    const module = (await import("@stellar/freighter-api")) as DynamicFreighterModule;

    const requestAccess = module.requestAccess ?? module.setAllowed;

    if (requestAccess) {
      await requestAccess();
    }

    const address = await resolveAddress(module);

    if (!address) {
      throw new Error("Failed to resolve a Stellar address from Freighter");
    }

    return address;
  },

  async signChallenge(transactionXdr: string, walletAddress: string) {
    const module = (await import("@stellar/freighter-api")) as DynamicFreighterModule;

    if (!module.signTransaction) {
      throw new Error("Freighter signing API is unavailable");
    }

    const signed = await module.signTransaction(transactionXdr, {
      address: walletAddress,
    });

    if (typeof signed === "string") {
      return signed;
    }

    return signed.signedTxXdr ?? "";
  },
};
