import { apiError, serverError } from "@/lib/api";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!env.cronSecret || request.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return apiError("Tidak diizinkan.", 401, "UNAUTHORIZED");
  }
  try {
    const { data, error } = await createAdminClient().rpc("expire_unpaid_orders");
    if (error) throw error;
    return Response.json({ expired: data });
  } catch (error) {
    return serverError(error);
  }
}

export const GET = POST;
