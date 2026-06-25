import type { StellarAssetDescriptor } from "@music-city/shared";

import { HttpError } from "./http-error.js";

const STELLAR_PUBLIC_KEY_REGEX = /^G[A-Z2-7]{55}$/;
const STELLAR_ASSET_CODE_REGEX = /^[A-Z0-9]{1,12}$/;
const DECIMAL_AMOUNT_REGEX = /^\d+(?:\.\d{1,7})?$/;

const parseAmount = (value: string, label: string) => {
  const parsed = value.trim();

  if (!DECIMAL_AMOUNT_REGEX.test(parsed) || Number(parsed) <= 0) {
    throw new HttpError(400, `${label} must be a positive amount with up to 7 decimals`);
  }

  return parsed;
};

const parseAssetCode = (value: string, label: string) => {
  const parsed = value.trim().toUpperCase();

  if (!STELLAR_ASSET_CODE_REGEX.test(parsed)) {
    throw new HttpError(400, `${label} asset code is invalid`);
  }

  return parsed;
};

const parseAssetIssuer = (value: string | undefined, label: string) => {
  const parsed = value?.trim();

  if (parsed && !STELLAR_PUBLIC_KEY_REGEX.test(parsed)) {
    throw new HttpError(400, `${label} asset issuer is invalid`);
  }

  return parsed || undefined;
};

export const normalizeStellarAsset = (
  input: {
    code: string;
    issuer?: string;
  },
  label: string,
): StellarAssetDescriptor => {
  const code = parseAssetCode(input.code, label);
  const issuer = parseAssetIssuer(input.issuer, label);

  if (code === "XLM") {
    return {
      code,
      issuer: undefined,
      isNative: true,
    };
  }

  if (!issuer) {
    throw new HttpError(400, `${label} asset issuer is required for non-XLM assets`);
  }

  return {
    code,
    issuer,
    isNative: false,
  };
};

export const normalizePositiveAmount = (value: string, label: string) =>
  parseAmount(value, label);
