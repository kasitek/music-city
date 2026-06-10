import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

import type { AuthSession } from "@music-city/shared";

import { env } from "../config/env.js";
import { usersService } from "../modules/users/users.service.js";
import { HttpError } from "../utils/http-error.js";

type DynamicVerifiedCredential = {
  address?: string;
  chain?: string;
  publicIdentifier?: string;
  public_identifier?: string;
  email?: string;
  walletName?: string;
  wallet_name?: string;
  signInEnabled?: boolean;
  sign_in_enabled?: boolean;
};

type DynamicJwtPayload = JWTPayload & {
  alias?: string;
  email?: string;
  environmentId?: string;
  environment_id?: string;
  scope?: string;
  verifiedCredentials?: DynamicVerifiedCredential[];
  verified_credentials?: DynamicVerifiedCredential[];
};

const DYNAMIC_TOKEN_SCOPE = "user:basic";

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

  return [
    `app.dynamic.xyz/${env.DYNAMIC_ENVIRONMENT_ID}`,
    `https://app.dynamic.xyz/${env.DYNAMIC_ENVIRONMENT_ID}`,
    `app.dynamicauth.com/${env.DYNAMIC_ENVIRONMENT_ID}`,
    `https://app.dynamicauth.com/${env.DYNAMIC_ENVIRONMENT_ID}`,
  ];
};

const normalizeCredentialAddress = (credential: DynamicVerifiedCredential) =>
  credential.address ??
  credential.public_identifier ??
  credential.publicIdentifier ??
  "";

const summarizeCredential = (credential: DynamicVerifiedCredential) => ({
  chain: credential.chain ?? null,
  address: normalizeCredentialAddress(credential) || null,
  signInEnabled:
    credential.sign_in_enabled ?? credential.signInEnabled ?? null,
  walletName: credential.wallet_name ?? credential.walletName ?? null,
});

const isStellarCredential = (credential: DynamicVerifiedCredential) =>
  credential.chain?.toLowerCase().includes("stellar") &&
  normalizeCredentialAddress(credential).length > 0;

const findStellarWalletAddress = (
  payload: DynamicJwtPayload,
  requestedWalletAddress?: string,
) => {
  const credentials =
    payload.verified_credentials ?? payload.verifiedCredentials ?? [];
  console.log(
    "[server][dynamic] verified credentials",
    credentials.map(summarizeCredential),
  );
  const stellarCredentials = credentials.filter(isStellarCredential);
  const stellarAddresses = stellarCredentials.map(normalizeCredentialAddress);

  if (requestedWalletAddress) {
    const exactMatch = stellarCredentials.find(
      (credential) =>
        normalizeCredentialAddress(credential).toLowerCase() ===
        requestedWalletAddress.toLowerCase(),
    );

    if (!exactMatch) {
      throw new HttpError(
        403,
        `Requested Stellar wallet is not linked to this Dynamic user. Token Stellar addresses: ${
          stellarAddresses.length > 0 ? stellarAddresses.join(", ") : "none"
        }`,
      );
    }

    return normalizeCredentialAddress(exactMatch);
  }

  const primary = stellarAddresses[0];

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
    } catch (error) {
      const detail = error instanceof Error ? error.message : "unknown verification failure";
      throw new HttpError(
        401,
        `Invalid or expired Dynamic auth token: ${detail}`,
      );
    }

    const payloadEnvironmentId =
      payload.environment_id ?? payload.environmentId;

    if (payloadEnvironmentId !== env.DYNAMIC_ENVIRONMENT_ID) {
      throw new HttpError(401, "Dynamic auth token is for a different environment");
    }

    if (!payload.scope?.split(" ").includes(DYNAMIC_TOKEN_SCOPE)) {
      throw new HttpError(
        403,
        "Dynamic auth token is missing the user:basic scope required for a completed login",
      );
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
