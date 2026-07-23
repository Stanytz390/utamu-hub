import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/group/$id")({
  loader: async ({ params }) => {
    const { id } = params;
    const { data, error } = await supabase
      .from("groups")
      .select("link")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      throw redirect({ to: "/groups" });
    }

    return { groupLink: data.link };
  },
  component: GroupRedirect,
});

function GroupRedirect() {
  const { groupLink } = Route.useLoaderData();
  window.location.href = groupLink;
  return null;
}