import { ZodType } from "zod";

import { API_URL, STORAGE_KEY } from "@/lib/utils";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string,
  ) {
    super(message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(detail?: string) {
    super(detail ?? "Forbidden", 403, detail);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(detail?: string) {
    super(detail ?? "Unauthorized", 401, detail);
  }
}

async function parseErrorDetail(response: Response) {
  try {
    const data = (await response.json()) as { detail?: string };
    return data.detail;
  } catch {
    return response.statusText;
  }
}

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  userId?: string | null;
};

export async function apiFetch<T>(
  path: string,
  schema: ZodType<T>,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { userId: explicitUserId, headers, body, ...rest } = options;
  const userId = explicitUserId ?? (typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null);

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(userId ? { "X-User-Id": userId } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401) {
    const detail = await parseErrorDetail(response);
    if (typeof window !== "undefined" && window.location.pathname !== "/select-user") {
      window.location.assign("/select-user");
    }
    throw new UnauthorizedError(detail);
  }

  if (response.status === 403) {
    throw new ForbiddenError(await parseErrorDetail(response));
  }

  if (!response.ok) {
    const detail = await parseErrorDetail(response);
    throw new ApiError(detail ?? "Request failed", response.status, detail);
  }

  const data = await response.json();
  return schema.parse(data);
}
