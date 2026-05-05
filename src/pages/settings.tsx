import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { joinDemoWorkspace } from "@/server/demo-tenant.functions";
import { toast } from "sonner";

const DEMO_SLUG = "acme_hospitality_demo";

export function SettingsPage() {
  const { user, profile, membership, refresh } = useAuth();
  const [joining, setJoining] = useState(false);

  const isDemoMember = membership?.tenant?.slug === DEMO_SLUG;

  const handleJoinDemo = async () => {
    if (!user) return;
    setJoining(true);
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;

      if (!accessToken) {
        toast.error("Please sign in before joining the demo workspace");
        return;
      }

      const joined = await joinDemoWorkspace({
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      toast.success(`Joined ${joined.tenantName} (demo)`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to join demo workspace");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your workspace and profile.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account & Workspace status</CardTitle>
          <CardDescription>Live data from your Intergrai account</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Logged-in email" value={user?.email ?? "—"} />
          <Field label="Profile ID" value={profile?.id ?? user?.id ?? "—"} mono />
          <Field label="Current tenant" value={membership?.tenant?.name ?? "None"} />
          <Field label="Tenant slug" value={membership?.tenant?.slug ?? "—"} mono />
          <Field label="Tenant role" value={membership?.role ?? "—"} />
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Demo membership</div>
            <Badge variant={isDemoMember ? "default" : "secondary"}>
              {isDemoMember ? "Joined" : "Not joined"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demo onboarding (development)</CardTitle>
          <CardDescription>
            Temporary helper. Joins your account to the existing Acme Hospitality Group demo workspace
            as <code>client_admin</code>. Safe to click multiple times.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleJoinDemo} disabled={joining || !user}>
            {joining ? "Joining…" : isDemoMember ? "Re-join demo workspace" : "Join demo workspace"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your user account</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input defaultValue={profile?.full_name ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input defaultValue={user?.email ?? ""} disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={mono ? "truncate font-mono text-xs" : "truncate"}>{value}</div>
    </div>
  );
}
