import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/client/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("thandi@acmehg.co.za");
  const [password, setPassword] = useState("••••••••");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div
        className="relative hidden flex-col justify-between p-10 text-brand-foreground lg:flex"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5" /> Intergrai
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Your private AI operating system.
          </h1>
          <p className="max-w-md text-sm/6 opacity-90">
            Submit tasks, generate leads, draft outreach and watch your AI workforce execute — all
            from one workspace.
          </p>
        </div>
        <p className="text-xs opacity-70">© 2026 Intergrai • app.intergrai.co.za</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in to your workspace</h2>
            <p className="text-sm text-muted-foreground">
              Welcome back. Enter your credentials to continue.
            </p>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/client/dashboard" });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            Need an account?{" "}
            <Link to="/client/login" className="font-medium text-foreground hover:underline">
              Contact your workspace admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
