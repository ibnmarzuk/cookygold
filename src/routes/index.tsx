import { createFileRoute } from "@tanstack/react-router";
import { OvenApp } from "@/components/oven/oven-app";
import { fetchPulse } from "@/lib/cookie/rpc";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      return await fetchPulse();
    } catch {
      return null;
    }
  },
  component: Home,
});

function Home() {
  const initialPulse = Route.useLoaderData();
  return <OvenApp initialPulse={initialPulse} />;
}
