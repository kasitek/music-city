"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { usersApi } from "@/features/users/lib/users-api";

export const OnboardingForm = () => {
  const router = useRouter();
  const { session, refreshSessionProfile } = useAuth();
  const [displayName, setDisplayName] = useState(session?.displayName ?? "");
  const [role, setRole] = useState<"artist" | "fan">("artist");
  const [location, setLocation] = useState("");
  const [genres, setGenres] = useState("");
  const [bio, setBio] = useState("");
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
      await usersApi.saveMe(session.token, {
        displayName,
        role,
        location,
        bio,
        genres: genres
          .split(",")
          .map((genre) => genre.trim())
          .filter(Boolean),
      });
      await refreshSessionProfile();
      toast.success("Profile saved");
      router.push(role === "artist" ? "/dashboard" : "/stream");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      className="max-w-2xl space-y-5 rounded-lg border border-white/10 bg-white/5 p-6"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
          className="border-white/10 bg-slate-950/70 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Account type</Label>
        <select
          id="role"
          value={role}
          onChange={(event) => setRole(event.target.value as "artist" | "fan")}
          className="h-10 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-white"
        >
          <option value="artist">Artist</option>
          <option value="fan">Fan</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="border-white/10 bg-slate-950/70 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="genres">Genres</Label>
        <Input
          id="genres"
          value={genres}
          onChange={(event) => setGenres(event.target.value)}
          placeholder="Amapiano, Afro-fusion"
          className="border-white/10 bg-slate-950/70 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className="min-h-28 border-white/10 bg-slate-950/70 text-white"
        />
      </div>

      <Button
        className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
};
