import { createFileRoute } from "@tanstack/react-router";
import { ClientGate } from "@/components/client-gate";
import { ChatPage } from "@/pages/chat";

export const Route = createFileRoute("/client/chat")({
  component: () => (
    <ClientGate>
      <ChatPage />
    </ClientGate>
  ),
});
