"use client";

import { useEffect, useState } from "react";
import type { ArtistSummary } from "@music-city/shared";

import { ArtistGrid } from "@/features/music/components/artist-grid";
import { usersApi } from "@/features/users/lib/users-api";

export const ArtistsOverview = () => {
  const [artists, setArtists] = useState<ArtistSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const nextArtists = await usersApi.listArtists();

        if (!cancelled) {
          setArtists(nextArtists);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <div className="text-sm text-slate-400">Loading artists...</div>;
  }

  return <ArtistGrid artists={artists} />;
};
