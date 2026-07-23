import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/story-upload")({
  component: StoryUpload,
});

function StoryUpload() {
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleUpload = async () => {
    if (!videoFile) return alert("Select a video first");
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate({ to: "/auth" });

      // Upload to Supabase Storage
      const filePath = `stories/${user.id}/${Date.now()}_${videoFile.name}`;
      const { data, error } = await supabase.storage
        .from("story_videos")
        .upload(filePath, videoFile);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("story_videos")
        .getPublicUrl(filePath);

      // Insert story record
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await supabase.from("stories").insert({
        user_id: user.id,
        video_url: publicUrl,
        thumbnail: publicUrl, // Could use video thumbnail generation
        status: "pending",
        expires_at: expiresAt.toISOString(),
      });

      alert("Story uploaded successfully! Awaiting approval.");
      navigate({ to: "/" });
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setUploading(false);
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold">Upload Story</h1>
      <p className="text-sm text-muted-foreground">Upload video ya sekunde 40 (itakaguliwa kwanza)</p>

      <div className="mt-6 border-2 border-dashed border-border rounded-2xl p-8 text-center">
        {preview ? (
          <video src={preview} className="w-full max-h-64 rounded-xl" controls />
        ) : (
          <>
            <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
            <p className="mt-2 text-sm text-muted-foreground">Click or drag to upload video</p>
          </>
        )}
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {videoFile && (
        <div className="mt-4">
          <p className="text-sm">File: {videoFile.name}</p>
          <p className="text-sm text-muted-foreground">Size: {(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!videoFile || uploading}
        className="w-full mt-6 bg-purple-500 text-white py-3 rounded-xl font-semibold hover:bg-purple-600 transition disabled:opacity-50"
      >
        {uploading ? <i className="fas fa-spinner fa-spin"></i> : "Upload Story"}
      </button>

      <p className="mt-2 text-xs text-center text-muted-foreground">
        <i className="fas fa-info-circle mr-1"></i> Story itaisha baada ya saa 24 na lazima iidhinishwe na admin
      </p>
    </div>
  );
}