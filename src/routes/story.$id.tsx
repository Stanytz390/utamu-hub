import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/story/$id")({
  loader: async ({ params }) => {
    const { id } = params;
    const { data, error } = await supabase
      .from("stories")
      .select("video_url, status")
      .eq("id", id)
      .maybeSingle();

    if (error || !data || data.status !== "approved") {
      throw redirect({ to: "/" });
    }

    return { videoUrl: data.video_url };
  },
  component: StoryRedirect,
});

function StoryRedirect() {
  const { videoUrl } = Route.useLoaderData();
  window.location.href = videoUrl;
  return null;
}