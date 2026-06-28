const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
export const API_BASE_URL = configuredApiBaseUrl || (import.meta.env.DEV ? "http://localhost:5000" : "");

if (!API_BASE_URL) {
  console.error("Missing VITE_API_BASE_URL. Set it to the deployed Render backend URL.");
}

export function getBackendFileUrl(fileUrl?: string): string {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  if (!fileUrl.startsWith("/uploads/") && !fileUrl.startsWith("/cv.pdf")) return fileUrl;
  if (!API_BASE_URL) return fileUrl;
  return `${API_BASE_URL}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
}

export function getResumeUrl(): string {
  return getBackendFileUrl(`/cv.pdf?ts=${Date.now()}`);
}

export interface Certificate {
  _id?: string;
  title: string;
  event: string;
  college: string;
  location: string;
  description: string;
  fileUrl?: string;
  fileName?: string;
  date?: string;
}

export interface Project {
  _id?: string;
  title: string;
  role: string;
  description: string;
  link?: string;
  highlights?: string[];
  gradient?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  sessionId: string;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── Contact ───
export async function sendContactMessage(data: ContactPayload): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to send message" }));
    throw new Error(err.message || "Failed to send message");
  }
  return res.json();
}

// ─── Certificates ───
export async function fetchCertificates(): Promise<Certificate[]> {
  const res = await fetch(`${API_BASE_URL}/api/certificates`);
  if (!res.ok) throw new Error("Failed to fetch certificates");
  const certificates = (await res.json()) as Certificate[];
  return certificates.map((certificate) => ({
    ...certificate,
    fileUrl: getBackendFileUrl(certificate.fileUrl),
  }));
}

export async function uploadCertificate(formData: FormData, token?: string): Promise<Certificate> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/certificates/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to upload certificate" }));
    throw new Error(err.message || "Failed to upload certificate");
  }

  const data = await res.json();
  return { ...data.certificate, fileUrl: getBackendFileUrl(data.certificate?.fileUrl) };
}

export async function deleteCertificate(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/certificates/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to delete certificate" }));
    throw new Error(err.message || "Failed to delete certificate");
  }
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE_URL}/api/projects`);
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function createProject(project: Partial<Project>, token: string): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(project),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to create project" }));
    throw new Error(err.message || "Failed to create project");
  }
  const data = await res.json();
  return data.project;
}

export async function deleteProject(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to delete project" }));
    throw new Error(err.message || "Failed to delete project");
  }
}

export async function uploadCV(formData: FormData, token: string): Promise<{ fileUrl: string }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/upload-cv`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to upload CV" }));
    throw new Error(err.message || "Failed to upload CV");
  }

  return res.json();
}

export async function updateCertificate(id: string, updates: Partial<Certificate>, token: string): Promise<Certificate> {
  const res = await fetch(`${API_BASE_URL}/api/certificates/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to update certificate" }));
    throw new Error(err.message || "Failed to update certificate");
  }
  const data = await res.json();
  return { ...data.certificate, fileUrl: getBackendFileUrl(data.certificate?.fileUrl) };
}

export async function updateProject(id: string, updates: Partial<Project>, token: string): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to update project" }));
    throw new Error(err.message || "Failed to update project");
  }
  const data = await res.json();
  return data.project;
}

export async function seedAdminData(token: string): Promise<{ certificates: Certificate[]; projects: Project[] }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/seed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to seed data" }));
    throw new Error(err.message || "Failed to seed data");
  }
  const data = await res.json();
  return {
    certificates: data.certificates.map((certificate: Certificate) => ({
      ...certificate,
      fileUrl: getBackendFileUrl(certificate.fileUrl),
    })),
    projects: data.projects,
  };
}

export async function adminLogin(password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Invalid admin password" }));
    throw new Error(err.message || "Invalid admin password");
  }
  return res.json();
}

export async function fetchChatSession(sessionId: string): Promise<ChatSession> {
  const res = await fetch(`${API_BASE_URL}/api/chat/${sessionId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to fetch chat session' }));
    throw new Error(err.message || 'Failed to fetch chat session');
  }
  const data = await res.json();
  return data.session;
}

// ─── AI Chat ───
export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  sessionId?: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to get response" }));
    throw new Error(err.message || "Failed to get response");
  }
  const data = await res.json();
  return {
    success: data.success,
    reply: data.reply || data.message || data.response,
    sessionId: data.sessionId
  };
}
