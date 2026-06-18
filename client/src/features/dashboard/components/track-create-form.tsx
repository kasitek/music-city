"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { tracksApi } from "@/features/music/lib/tracks-api";
import { uploadsApi } from "@/features/uploads/lib/uploads-api";

interface TrackCreateFormProps {
  onCreated: () => void;
  onClose?: () => void;
}

export const TrackCreateForm = ({
  onCreated,
  onClose,
}: TrackCreateFormProps) => {
  const router = useRouter();
  const { session } = useAuth();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.token) {
      toast.error("Connect your wallet first");
      router.push("/auth");
      return;
    }

    setIsSaving(true);

    try {
      const track = await tracksApi.createTrack(session.token, {
        title,
        genre,
        description,
        priceLabel: "Private",
        access: "private",
      });

      if (file) {
        const uploadSession = await uploadsApi.createSession(session.token, {
          trackId: track.id,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        });
        const eTag = await uploadsApi.uploadFile(uploadSession, file);
        await uploadsApi.completeSession(session.token, uploadSession.id, {
          uploadSessionId: uploadSession.id,
          eTag,
        });
      }

      setTitle("");
      setGenre("");
      setDescription("");
      setFile(null);
      onCreated();
      onClose?.();
      toast.success(file ? "Track uploaded" : "Track draft created");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      className="space-y-5 rounded-lg border border-white/10 bg-white/5 p-6"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="trackTitle">Track title</Label>
          <Input
            id="trackTitle"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="border-white/10 bg-slate-950/70 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trackGenre">Genre</Label>
          <Input
            id="trackGenre"
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
            required
            className="border-white/10 bg-slate-950/70 text-white"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="trackDescription">Description</Label>
        <Textarea
          id="trackDescription"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-24 border-white/10 bg-slate-950/70 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="trackFile">Audio file</Label>
        <Input
          id="trackFile"
          type="file"
          accept="audio/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="border-white/10 bg-slate-950/70 text-white file:text-white"
        />
      </div>
      <Button
        className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Create track"}
      </Button>
      {onClose ? (
        <Button
          type="button"
          variant="outline"
          className="ml-3 border-white/15 bg-white/5 text-white hover:bg-white/10"
          onClick={onClose}
        >
          Cancel
        </Button>
      ) : null}
    </form>
  );
};
