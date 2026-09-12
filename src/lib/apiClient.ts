function getStoredOrgId(): string | null {
  try {
    const saved = localStorage.getItem('mizan_current_org');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.id || null;
    }
  } catch {}
  return null;
}

let currentOrgId: string | null = getStoredOrgId();

export function setApiOrganizationId(orgId: string | null) {
  currentOrgId = orgId;
}

export function getApiOrganizationId(): string | null {
  return currentOrgId || getStoredOrgId();
}

function getStoredUserEmail(): string | null {
  try {
    const saved = localStorage.getItem('mizan_current_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.email || null;
    }
  } catch {}
  return null;
}

function getStoredAdminToken(): string | null {
  try {
    return localStorage.getItem('mizan_admin_token') || null;
  } catch {}
  return null;
}

let currentAdminToken: string | null = getStoredAdminToken();

export function setApiAdminToken(token: string | null) {
  currentAdminToken = token;
  try {
    if (token) {
      localStorage.setItem('mizan_admin_token', token);
    } else {
      localStorage.removeItem('mizan_admin_token');
    }
  } catch {}
}

export function getApiAdminToken(): string | null {
  return currentAdminToken || getStoredAdminToken();
}

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const customHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const orgIdToSend = currentOrgId || getStoredOrgId();
  if (orgIdToSend) {
    customHeaders['x-org-id'] = orgIdToSend;
  }

  const userEmail = getStoredUserEmail();
  if (userEmail) {
    customHeaders['x-user-email'] = userEmail;
  }

  const adminToken = currentAdminToken || getStoredAdminToken();
  if (adminToken) {
    customHeaders['x-admin-token'] = adminToken;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...customHeaders,
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    let errorMsg = 'حدث خطأ في الخادم';
    try {
      const errData = await res.json();
      if (errData.error) errorMsg = errData.error;
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}
