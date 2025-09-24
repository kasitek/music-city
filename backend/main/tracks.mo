import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Result "mo:base/Result";

import T "./types";


  public func updateTrack(
    tracksMap: HashMap.HashMap<Nat, T.Track>,
    caller: Principal,
    trackId: Nat,
    title: ?Text,
    genre: ?Text,
    description: ?Text
  ) : Result.Result<T.Track, Text> {
    switch (tracksMap.get(trackId)) {
      case null { #err("Track not found") };
      case (?track) {
        if (track.artist != caller) { return #err("Only the artist can edit this track") };
        let updated: T.Track = {
          id = track.id;
          title = switch (title) { case (?t) t; case null track.title };
          artist = track.artist;
          duration = track.duration;
          genre = switch (genre) { case (?g) g; case null track.genre };
          coverImage = track.coverImage;
          audioUrl = track.audioUrl;
          audioAssetId = track.audioAssetId;
          imageAssetId = track.imageAssetId;
          plays = track.plays;
          likes = track.likes;
          price = track.price;
          releaseDate = track.releaseDate;
          description = switch (description) { case (?d) d; case null track.description };
          createdTimestamp = track.createdTimestamp;
        };
        tracksMap.put(trackId, updated);
        #ok(updated)
      }
    }
  };

  public func deleteTrack(
    tracksMap: HashMap.HashMap<Nat, T.Track>,
    caller: Principal,
    trackId: Nat
  ) : Result.Result<Bool, Text> {
    switch (tracksMap.get(trackId)) {
      case null { #err("Track not found") };
      case (?track) {
        if (track.artist != caller) { return #err("Only the artist can delete this track") };
        ignore tracksMap.remove(trackId);
        #ok(true)
      }
    }
  };


module {
  public func create(
    tracks : [T.Track],
    caller : Principal,
    isArtist : Bool,
    title : Text,
    duration : Text,
    genre : Text,
    coverImage : Text,
    audioUrl : Text,
    price : Nat,
    releaseDate : Text,
    description : Text,
    nextTrackId : Nat
  ) : Result.Result<([T.Track], T.Track, Nat), Text> {
    if (not isArtist) { return #err("Only artists can create tracks") };
    let track : T.Track = {
      id = nextTrackId; title; artist = caller; duration; genre; coverImage; audioUrl;
      // new optional asset references default to null until wired by client
      audioAssetId = null; imageAssetId = null;
      plays = 0; likes = 0; price; releaseDate; description
    };
    (#ok((Array.append(tracks, [track]), track, nextTrackId + 1)))
  };

  public func list(tracks : [T.Track]) : [T.Track] { tracks };

  public func get(tracks : [T.Track], id : Nat) : ?T.Track {
    Array.find<T.Track>(tracks, func (t) { t.id == id })
  };

  public func incrementPlay(tracks : [T.Track], trackId : Nat) : Result.Result<([T.Track], T.Track), Text> {
    let idxOpt = Array.indexOf<T.Track>({ id = trackId; title = ""; artist = Principal.fromText("aaaaa-aa"); duration = ""; genre = ""; coverImage = ""; audioUrl = ""; audioAssetId = null; imageAssetId = null; plays = 0; likes = 0; price = 0; releaseDate = ""; description = "" }, tracks, func (a, b) { a.id == b.id });
    switch (idxOpt) {
      case null { #err("Track not found") };
      case (?idx) {
        let t = tracks[idx];
        let updated = { t with plays = t.plays + 1 };
        let t1 = Array.tabulate<T.Track>(tracks.size(), func (i) { if (i == idx) { updated } else { tracks[i] } });
        #ok((t1, updated))
      }
    }
  };

  public func setAssets(
    tracks : [T.Track],
    caller : Principal,
    trackId : Nat,
    audioAssetId : ?Nat,
    imageAssetId : ?Nat
  ) : Result.Result<([T.Track], T.Track), Text> {
    let idxOpt = Array.indexOf<T.Track>({ id = trackId; title = ""; artist = Principal.fromText("aaaaa-aa"); duration = ""; genre = ""; coverImage = ""; audioUrl = ""; audioAssetId = null; imageAssetId = null; plays = 0; likes = 0; price = 0; releaseDate = ""; description = "" }, tracks, func (a, b) { a.id == b.id });
    switch (idxOpt) {
      case null { #err("Track not found") };
      case (?idx) {
        let t = tracks[idx];
        if (t.artist != caller) { return #err("Only the artist can modify assets") };
        let updated = { t with audioAssetId = audioAssetId; imageAssetId = imageAssetId };
        let t1 = Array.tabulate<T.Track>(tracks.size(), func (i) { if (i == idx) { updated } else { tracks[i] } });
        #ok((t1, updated))
      }
    }
  };
}
