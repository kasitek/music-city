import { clientEnv } from "@/lib/config/env";

export class ApiClientError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ApiClientError";
  }
}

const authHeaders = (token?: string): Record<string, string> => {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const httpClient = {
  async get<T>(path: string, token?: string): Promise<T> {
    const response = await fetch(`${clientEnv.apiBaseUrl}${path}`, {
      credentials: "include",
      cache: "no-store",
      headers: authHeaders(token),
    });

    if (!response.ok) {
      throw new ApiClientError("Request failed", response.status);
    }

    return (await response.json()) as T;
  },

  async post<T>(path: string, body: unknown, token?: string): Promise<T> {
    const response = await fetch(`${clientEnv.apiBaseUrl}${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new ApiClientError("Request failed", response.status);
    }

    return (await response.json()) as T;
  },

  async put<T>(path: string, body: unknown, token?: string): Promise<T> {
    const response = await fetch(`${clientEnv.apiBaseUrl}${path}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new ApiClientError("Request failed", response.status);
    }

    return (await response.json()) as T;
  },
};
