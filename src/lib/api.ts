// Configure your backend API base URL here
// In development, point to your local Express server
// In production, point to your deployed backend (Railway, Render, etc.)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export interface Certificate {
  _id?: string;
  title: string;
  event: string;
  college: string;
  location: string;
  description: string;
  fileUrl: string;
  date?: string;
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
  return res.json();
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
