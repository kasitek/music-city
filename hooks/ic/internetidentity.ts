"use client";
import { AuthClient } from "@dfinity/auth-client";
import { WalletType } from "./types";
import { getIIURL } from "../constants/urls";


const loginOptions = {
  identityProvider: getIIURL()
};

const connectInternetIdentityWallet = async (callback : any) => {
  const authClient = await AuthClient.create();

  const onConnectCallback = async () => {
    if (await authClient.isAuthenticated()) {
      callback(true, WalletType.InternetIdentity);
    }
    callback(false, null);
  };

  authClient.login({
    ...loginOptions,
    onSuccess: () => {
      onConnectCallback();
    },
  });
};

export { connectInternetIdentityWallet };
