import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

import type { AuthSession } from "@music-city/shared";

import { env } from "../config/env.js";
import { usersService } from "../modules/users/users.service.js";
import { HttpError } from "../utils/http-error.js";

type DynamicVerifiedCredential = {
  address?: string;
  chain?: string;
  publicIdentifier?: string;
  email?: string;
  walletName?: string;
  signInEnabled?: boolean;
};

type DynamicJwtPayload = JWTPayload & {
  alias?: string;
  email?: string;
  environmentId?: string;
  scope?: string;
  verifiedCredentials?: DynamicVerifiedCredential[];
};

const getJwksUrl = () => {
  if (env.DYNAMIC_JWKS_URL) {
    return env.DYNAMIC_JWKS_URL;
  }

  if (!env.DYNAMIC_ENVIRONMENT_ID) {
    throw new HttpError(501, "Dynamic environment is not configured");
  }

  return `https://app.dynamic.xyz/api/v0/sdk/${env.DYNAMIC_ENVIRONMENT_ID}/.well-known/jwks`;
};

const getExpectedIssuer = () => {
  if (!env.DYNAMIC_ENVIRONMENT_ID) {
    throw new HttpError(501, "Dynamic environment is not configured");
  }

  return `app.dynamic.xyz/${env.DYNAMIC_ENVIRONMENT_ID}`;
};

const findStellarWalletAddress = (
  payload: DynamicJwtPayload,
  requestedWalletAddress?: string,
) => {
  const credentials = payload.verifiedCredentials ?? [];
  const stellarCredentials = credentials.filter(
    (credential) =>
      credential.chain?.toLowerCase() === "stellar" &&
      credential.address &&
      credential.signInEnabled !== false,
  );

  if (requestedWalletAddress) {
    const exactMatch = stellarCredentials.find(
      (credential) => credential.address === requestedWalletAddress,
    );

    if (!exactMatch?.address) {
      throw new HttpError(
        403,
        "Requested Stellar wallet is not linked to this Dynamic user",
      );
    }

    return exactMatch.address;
  }

  const primary = stellarCredentials[0]?.address;

  if (!primary) {
    throw new HttpError(403, "No Stellar wallet is linked to this account");
  }

  return primary;
};

const buildDisplayName = (
  payload: DynamicJwtPayload,
  walletAddress: string,
  existingDisplayName?: string,
) => {
  return (
    existingDisplayName ??
    payload.alias ??
    payload.email ??
    walletAddress.slice(0, 8)
  );
};

export const dynamicAuthService = {
  async createSession(dynamicToken: string, requestedWalletAddress?: string) {
    if (!env.DYNAMIC_ENVIRONMENT_ID) {
      throw new HttpError(501, "Dynamic environment is not configured");
    }

    let payload: DynamicJwtPayload;

    try {
      const jwks = createRemoteJWKSet(new URL(getJwksUrl()));
      const verified = await jwtVerify(dynamicToken, jwks, {
        issuer: getExpectedIssuer(),
      });

      payload = verified.payload as DynamicJwtPayload;
    } catch {
      throw new HttpError(401, "Invalid or expired Dynamic auth token");
    }

    if (payload.environmentId !== env.DYNAMIC_ENVIRONMENT_ID) {
      throw new HttpError(401, "Dynamic auth token is for a different environment");
    }

    if (!payload.scope?.split(" ").includes("user")) {
      throw new HttpError(403, "Dynamic auth token is missing user scope");
    }

    const walletAddress = findStellarWalletAddress(payload, requestedWalletAddress);
    const profile = usersService.getProfile(walletAddress);

    const session: Omit<AuthSession, "token"> = {
      walletAddress,
      displayName: buildDisplayName(payload, walletAddress, profile?.displayName),
      role: profile?.role ?? "fan",
      profileComplete: Boolean(profile),
    };

    return session;
  },
};
