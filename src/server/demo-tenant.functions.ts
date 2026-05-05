import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEMO_TENANT_SLUG = "acme_hospitality_demo";

export type DemoTenantJoinResult = {
  profileId: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantRole: string;
  membershipStatus: "joined";
};

export const joinDemoWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DemoTenantJoinResult> => {
    const { claims, userId } = context;
    const signedInEmail = typeof claims.email === "string" ? claims.email : null;

    if (!userId) {
      throw new Error("Authentication required to join the demo workspace.");
    }

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

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("tenant_members")
      .upsert(
        { tenant_id: tenant.id, user_id: userId, role: "client_admin" },
        { onConflict: "tenant_id,user_id" },
      )
      .select("role")
      .single();

    if (membershipError) throw new Error(membershipError.message);

    return {
      profileId: userId,
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      tenantRole: membership.role,
      membershipStatus: "joined",
    };
  });