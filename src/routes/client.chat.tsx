import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ChatPage } from "@/pages/chat";

export const Route = createFileRoute("/client/chat")({
  component: () => (
    <AppShell>
      <ChatPage />
    </AppShell>
  ),
});
