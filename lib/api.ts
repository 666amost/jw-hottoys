import { NextResponse } from "next/server";

export function apiError(message: string, status = 400, code = "BAD_REQUEST") {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
  console.error("[api]", message);
  return apiError("Layanan sedang bermasalah. Silakan coba lagi.", 500, "INTERNAL_ERROR");
}

