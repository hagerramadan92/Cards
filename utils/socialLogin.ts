export type SocialLoginPayload = {
  provider: string;
  provider_id: string;
  email: string;
  name: string;
  image?: string;
};

type SocialLoginUser = {
  id?: number;
  name?: string;
  email?: string;
  image?: string;
};

export type SocialLoginResponse = {
  status?: boolean;
  message?: string;
  data?: {
    token?: string;
    user?: SocialLoginUser;
  };
};

type ParsedResponse = {
  data: SocialLoginResponse | null;
  rawBody: string;
};

export class SocialLoginError extends Error {
  status: number;
  statusText: string;
  data: SocialLoginResponse | null;
  rawBody: string;

  constructor(
    message: string,
    details: {
      status?: number;
      statusText?: string;
      data?: SocialLoginResponse | null;
      rawBody?: string;
    } = {}
  ) {
    super(message);
    this.name = "SocialLoginError";
    this.status = details.status || 0;
    this.statusText = details.statusText || "";
    this.data = details.data || null;
    this.rawBody = details.rawBody || "";
  }
}

async function parseResponse(response: Response): Promise<ParsedResponse> {
  const rawBody = await response.text();

  if (!rawBody) {
    return { data: null, rawBody };
  }

  try {
    return { data: JSON.parse(rawBody), rawBody };
  } catch {
    return { data: null, rawBody };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function extractErrorMessage(data: unknown): string | null {
  if (!isRecord(data)) return null;

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }

  if (isRecord(data.errors)) {
    const firstError = Object.values(data.errors)
      .flat()
      .find((value) => typeof value === "string" && value.trim());

    if (typeof firstError === "string") {
      return firstError;
    }
  }

  return null;
}

export async function postSocialLogin(
  payload: SocialLoginPayload,
  language: string = "ar"
): Promise<SocialLoginResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  if (!apiUrl) {
    throw new SocialLoginError("خطأ في إعدادات الخادم");
  }

  const response = await fetch(`${apiUrl}/auth/social-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Language": language || "ar",
    },
    body: JSON.stringify(payload),
  });

  const { data, rawBody } = await parseResponse(response);

  if (response.ok && data?.status && data.data?.token) {
    return data;
  }

  const apiMessage = extractErrorMessage(data);
  const fallbackMessage = response.ok
    ? "فشل تسجيل الدخول"
    : `فشل تسجيل الدخول (${response.status})`;

  throw new SocialLoginError(apiMessage || fallbackMessage, {
    status: response.status,
    statusText: response.statusText,
    data,
    rawBody,
  });
}
