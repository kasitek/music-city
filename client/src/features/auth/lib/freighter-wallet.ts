type DynamicFreighterModule = {
  isBrowser?: boolean;
  isConnected?: () => Promise<{ isConnected: boolean; error?: unknown }>;
  getAddress?: () => Promise<
    string | { address?: string; publicKey?: string; error?: string }
  >;
  getPublicKey?: () => Promise<string>;
  signTransaction?: (
    xdr: string,
    options?: Record<string, unknown>,
  ) => Promise<string | { signedTxXdr?: string; error?: string }>;
  requestAccess?: () => Promise<{ address?: string; error?: string } | unknown>;
  setAllowed?: () => Promise<unknown>;
};

const withTimeout = async <T>(promise: Promise<T>, label: string, timeoutMs = 8000) => {
  console.log("[auth][freighter] starting", { label, timeoutMs });
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      console.warn("[auth][freighter] timeout", { label, timeoutMs });
      reject(
        new Error(
          `${label} timed out. Check that Freighter is installed, unlocked, and allowed on this site.`,
        ),
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    console.log("[auth][freighter] completed", { label, result });
    return result;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const DOWNLOAD_URL = "https://www.freighter.app/";

const resolveAddress = async (module: DynamicFreighterModule) => {
  const getter = module.getAddress ?? module.getPublicKey;

  if (!getter) {
    throw new Error("Freighter address API is unavailable");
  }

  const result = await getter();

  if (typeof result === "string") {
    return result;
  }

  if (result.error) {
    throw new Error(result.error);
  }

  return result.address ?? result.publicKey ?? "";
};

export const freighterWallet = {
  downloadUrl: DOWNLOAD_URL,

  openInstallPage() {
    if (typeof window !== "undefined") {
      window.location.assign(DOWNLOAD_URL);
    }
  },

  async isAvailable() {
    console.log("[auth][freighter] checking availability");
    const module = (await import("@stellar/freighter-api")) as DynamicFreighterModule;
    console.log("[auth][freighter] module loaded", {
      isBrowser: module.isBrowser,
      hasRequestAccess: Boolean(module.requestAccess),
      hasGetAddress: Boolean(module.getAddress),
      hasIsConnected: Boolean(module.isConnected),
    });

    if (module.isBrowser === false) {
      console.warn("[auth][freighter] unavailable: not in browser");
      return false;
    }

    if (!module.requestAccess && !module.getAddress) {
      console.warn("[auth][freighter] unavailable: API missing");
      return false;
    }

    if (!module.isConnected) {
      console.log("[auth][freighter] availability fallback: no isConnected export, assuming available");
      return true;
    }

    try {
      const connection = await withTimeout(
        module.isConnected(),
        "Freighter detection",
        3000,
      );

      const available = Boolean(connection.isConnected && !connection.error);
      console.log("[auth][freighter] availability result", {
        connection,
        available,
      });
      return available;
    } catch {
      console.warn("[auth][freighter] availability check threw");
      return false;
    }
  },

  async connect() {
    console.log("[auth][freighter] connect called");
    const module = (await import("@stellar/freighter-api")) as DynamicFreighterModule;
    console.log("[auth][freighter] connect module loaded", {
      isBrowser: module.isBrowser,
      hasRequestAccess: Boolean(module.requestAccess),
      hasGetAddress: Boolean(module.getAddress),
      hasIsConnected: Boolean(module.isConnected),
    });

    if (module.isBrowser === false) {
      throw new Error("Freighter can only be used in a browser");
    }

    if (!module.requestAccess && !module.getAddress) {
      throw new Error("Freighter API is unavailable in this browser");
    }

    if (module.isConnected) {
      const connection = await withTimeout(
        module.isConnected(),
        "Freighter detection",
        3000,
      );
      console.log("[auth][freighter] connect isConnected response", connection);

      if (connection.error) {
        throw new Error(String(connection.error));
      }

      if (!connection.isConnected) {
        throw new Error(
          "Freighter extension was not detected. Install it, enable it, and refresh the page.",
        );
      }
    }

    const requestAccess = module.requestAccess ?? module.setAllowed;

    if (requestAccess) {
      console.log("[auth][freighter] requesting access");
      const accessResult = await withTimeout(
        requestAccess(),
        "Freighter access request",
      );
      console.log("[auth][freighter] access result", accessResult);

      if (
        accessResult &&
        typeof accessResult === "object" &&
        "error" in accessResult &&
        typeof accessResult.error === "string"
      ) {
        throw new Error(accessResult.error);
      }
    }

    const address = await resolveAddress(module);
    console.log("[auth][freighter] resolved address", { address });

    if (!address) {
      throw new Error("Failed to resolve a Stellar address from Freighter");
    }

    return address;
  },

  async signChallenge(
    transactionXdr: string,
    walletAddress: string,
    networkPassphrase?: string,
  ) {
    console.log("[auth][freighter] signChallenge called", {
      walletAddress,
      hasNetworkPassphrase: Boolean(networkPassphrase),
    });
    const module = (await import("@stellar/freighter-api")) as DynamicFreighterModule;

    if (!module.signTransaction) {
      throw new Error("Freighter signing API is unavailable");
    }

    const signed = await withTimeout(
      module.signTransaction(transactionXdr, {
        address: walletAddress,
        networkPassphrase,
      }),
      "Freighter signature request",
      15000,
    );
    console.log("[auth][freighter] signTransaction result", signed);

    if (typeof signed === "string") {
      return signed;
    }

    if (signed.error) {
      throw new Error(signed.error);
    }

    if (!signed.signedTxXdr) {
      throw new Error("Freighter did not return a signed transaction");
    }

    return signed.signedTxXdr;
  },
};
