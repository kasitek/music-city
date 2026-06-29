import type {
  AdminAccount,
  AdminBootstrapStatus,
  AdminPlatformSubscriptionSettings,
  AdminSession,
  AdminLoginInput,
  BootstrapAdminInput,
  CreateAdminInput,
} from "@music-city/shared";

import { httpClient } from "@/lib/api/http-client";

type AuthResponse = {
  admin: AdminAccount;
  session: AdminSession;
};

export const adminApi = {
  getBootstrapStatus() {
    return httpClient.get<AdminBootstrapStatus>("/auth/bootstrap-status");
  },

  bootstrap(input: BootstrapAdminInput) {
    return httpClient.post<AuthResponse>("/auth/bootstrap", input);
  },

  login(input: AdminLoginInput) {
    return httpClient.post<AuthResponse>("/auth/login", input);
  },

  getMe(token: string) {
    return httpClient.get<AuthResponse>("/auth/me", token);
  },

  listAdmins(token: string) {
    return httpClient
      .get<{ items: AdminAccount[] }>("/admins", token)
      .then((response) => response.items);
  },

  createAdmin(input: CreateAdminInput, token: string) {
    return httpClient
      .post<{ admin: AdminAccount }>("/admins", input, token)
      .then((response) => response.admin);
  },

  getPlatformSubscriptionSettings(token: string) {
    return httpClient
      .get<{ settings: AdminPlatformSubscriptionSettings }>(
        "/subscriptions/platform-plan",
        token,
      )
      .then((response) => response.settings);
  },

  updatePlatformSubscriptionSettings(
    input: AdminPlatformSubscriptionSettings,
    token: string,
  ) {
    return httpClient
      .put<{ settings: AdminPlatformSubscriptionSettings }>(
        "/subscriptions/platform-plan",
        input,
        token,
      )
      .then((response) => response.settings);
  },
};
