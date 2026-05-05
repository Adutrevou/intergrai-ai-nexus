import { createClient } from "@supabase/supabase-js";
import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import type { DemoTenantJoinResult } from "@/lib/demo-tenant.types";

const DEMO_TENANT_SLUG = "acme_hospitality_demo";

async function getSupabaseClaimsFromRequest() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase] ${message}`);
    throw new Response(message, { status: 500 });
  }

  const request = getRequest();
  if (!request?.headers) {
    throw new Response("Unauthorized: No request headers available", { status: 401 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    throw new Response("Unauthorized: No authorization header provided", { status: 401 });
  }
  if (!authHeader.startsWith("Bearer ")) {
    throw new Response("Unauthorized: Only Bearer tokens are supported", { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    throw new Response("Unauthorized: No token provided", { status: 401 });
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    throw new Response("Unauthorized: Invalid token", { status: 401 });
  }
  if (!data.claims.sub) {
    throw new Response("Unauthorized: No user ID found in token", { status: 401 });
  }

  return data.claims;
}

export async function joinDemoWorkspaceForRequest(): Promise<DemoTenantJoinResult> {
  const claims = await getSupabaseClaimsFromRequest();
  const userId = claims.sub;
  const claimEmail = (claims as { email?: unknown }).email;
  const signedInEmail = typeof claimEmail === "string" ? claimEmail : null;

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", DEMO_TENANT_SLUG)
    .maybeSingle();

  if (tenantError) throw new Error(tenantError.message);
  if (!tenant) throw new Error("Demo workspace not found.");

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);

  if (!profile) {
    const { error: insertProfileError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      email: signedInEmail,
      full_name: null,
    });

    if (insertProfileError) throw new Error(insertProfileError.message);
  }

  const { data: existingMembership, error: existingMembershipError } = await supabaseAdmin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMembershipError) throw new Error(existingMembershipError.message);

  const membership = existingMembership ?? { role: "client_admin" };

  if (!existingMembership) {
    const { error: membershipError } = await supabaseAdmin.from("tenant_members").insert({
      tenant_id: tenant.id,
      user_id: userId,
      role: "client_admin",
    });

    if (membershipError) throw new Error(membershipError.message);
  }

  return {
    profileId: userId,
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    tenantRole: membership.role,
    membershipStatus: "joined",
  };
}
