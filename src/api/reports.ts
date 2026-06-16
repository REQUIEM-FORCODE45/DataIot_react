import axios from "axios";
import type { ReportDocument } from "@/types/reports";

const reportBaseUrl = import.meta.env.VITE_REPORT_BASE_URL;

if (!reportBaseUrl) {
  throw new Error("Missing VITE_REPORT_BASE_URL in environment");
}

const reportApi = axios.create({
  baseURL: reportBaseUrl,
  withCredentials: true,
});

reportApi.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers["x-token"] = localStorage.getItem("token") || "";
  return config;
});

export class ReportError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`Report generation failed (${status}): ${body}`);
    this.name = "ReportError";
    this.status = status;
    this.body = body;
  }
}

export const generatePDF = async (document: ReportDocument): Promise<Blob> => {
  const response = await reportApi.post<Blob>(
    "/generate",
    { document },
    {
      headers: {
        "Content-Type": "application/json",
      },
      responseType: "blob",
    }
  );
  const contentType = response.headers["content-type"] ?? "";
  if (contentType.includes("application/pdf")) {
    return response.data;
  }
  const text = await new Response(response.data).text();
  throw new ReportError(response.status, text);
};

export const downloadPDF = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
