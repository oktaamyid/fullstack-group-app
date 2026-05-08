import { getAuthToken } from "./auth";

const BASE_URL = "/api/contact";

async function request(path = "", options = {}) {
  const token = getAuthToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json();

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || "Contact request failed");
  }

  return payload.data;
}

export function submitContact(body) {
  return request("", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
