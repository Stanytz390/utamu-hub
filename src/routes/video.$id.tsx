import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/video/$id")({
  loader: async ({ params }) => {
    const { id } = params;
    const { data, error } = await supabase
      .from("videos")
      .select("video_url, status")
      .eq("id", id)
      .maybeSingle();

    if (error || !data || data.status !== "available") {
      throw redirect({ to: "/utamu" });
    }

    return { videoUrl: data.video_url };
  },
  component: VideoRedirect,
});

function VideoRedirect() {
  const { videoUrl } = Route.useLoaderData();
  window.location.href = videoUrl;
  return null;
}