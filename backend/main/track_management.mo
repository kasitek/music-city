import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Nat32 "mo:base/Nat32";
import Array "mo:base/Array";
import Iter "mo:base/Iter";

import ApplicationTypes "./types";
import ApplicationConstants "./constants";
import UserManagement "./user_management";
import TransactionManagement "./transaction_management";

module {

  public func updateTrack(
    tracksMap : TrackMap,
    caller : Principal,
    trackId : Nat,
    title : ?Text,
    genre : ?Text,
    description : ?Text
  ) : Result.Result<ApplicationTypes.Track, Text> {
    switch (tracksMap.get(trackId)) {
      case null { #err("Track not found") };
      case (?track) {
        if (track.artist != caller) { return #err("Only the artist can edit this track") };
        let updated : ApplicationTypes.Track = {
          id = track.id;
          title = switch (title) { case (?t) t; case null track.title };
          artist = track.artist;
          duration = track.duration;
          genre = switch (genre) { case (?g) g; case null track.genre };
          coverImage = track.coverImage;
          audioUrl = track.audioUrl;
          price = track.price;
          releaseDate = track.releaseDate;
          description = switch (description) { case (?d) d; case null track.description };
          plays = track.plays;
          likes = track.likes;
          createdTimestamp = track.createdTimestamp;
          audioAssetId = track.audioAssetId;
          imageAssetId = track.imageAssetId;
        };
        tracksMap.put(trackId, updated);
        #ok(updated)
      }
    }
  };

  public func deleteTrack(
    tracksMap : TrackMap,
    caller : Principal,
    trackId : Nat
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
  type UserMap = HashMap.HashMap<Principal, ApplicationTypes.User>;
  type TrackMap = HashMap.HashMap<Nat, ApplicationTypes.Track>;
  type TransactionMap = HashMap.HashMap<Nat, ApplicationTypes.Transaction>;

  func now() : Nat64 { Nat64.fromIntWrap(Time.now()) };

  public func createTrack(
    tracksMap : TrackMap,
    usersMap : UserMap,
    caller : Principal,
    title : Text,
    duration : Text,
    genre : Text,
    coverImage : Text,
    audioUrl : Text,
    price : Nat,
    releaseDate : Text,
    description : Text,
    trackId : Nat
  ) : Result.Result<ApplicationTypes.Track, Text> {
    switch (usersMap.get(caller)) {
      case null { #err("User not registered") };
      case (?user) {
        switch (user.userType) {
          case (#fan) { #err("Only artists can create tracks") };
          case (#artist) {
            let newTrack : ApplicationTypes.Track = {
              id = trackId;
              title = title;
              artist = caller;
              duration = duration;
              genre = genre;
              coverImage = coverImage;
              audioUrl = audioUrl;
              price = price;
              releaseDate = releaseDate;
              description = description;
              plays = 0;
              likes = 0;
              createdTimestamp = now();
              audioAssetId = null;
              imageAssetId = null;
            };
            tracksMap.put(trackId, newTrack);
            #ok(newTrack)
          };
        }
      };
    }
  };

  public func listTracks(tracksMap : TrackMap) : [ApplicationTypes.Track] {
    let trackEntries = tracksMap.entries() |> Iter.toArray(_);
    Array.map<(Nat, ApplicationTypes.Track), ApplicationTypes.Track>(trackEntries, func (entry) { entry.1 })
  };

  public func setTrackAssets(
    tracksMap : TrackMap,
    caller : Principal,
    trackId : Nat,
    audioAssetId : ?Nat,
    imageAssetId : ?Nat
  ) : Result.Result<ApplicationTypes.Track, Text> {
    switch (tracksMap.get(trackId)) {
      case null { #err("Track not found") };
      case (?existingTrack) {
        if (existingTrack.artist != caller) {
          return #err("Not authorized to modify this track")
        };
        let updatedTrack : ApplicationTypes.Track = {
          id = existingTrack.id;
          title = existingTrack.title;
          artist = existingTrack.artist;
          duration = existingTrack.duration;
          genre = existingTrack.genre;
          coverImage = existingTrack.coverImage;
          audioUrl = existingTrack.audioUrl;
          price = existingTrack.price;
          releaseDate = existingTrack.releaseDate;
          description = existingTrack.description;
          plays = existingTrack.plays;
          likes = existingTrack.likes;
          createdTimestamp = existingTrack.createdTimestamp;
          audioAssetId = audioAssetId;
          imageAssetId = imageAssetId;
        };
        tracksMap.put(trackId, updatedTrack);
        #ok(updatedTrack)
      };
    }
  };

  public func streamTrack(
    tracksMap : TrackMap,
    usersMap : UserMap,
    transactionsMap : TransactionMap,
    trackId : Nat,
    caller : Principal,
    nextTxId : Nat
  ) : Result.Result<Nat, Text> {
    switch (tracksMap.get(trackId)) {
      case null { #err("Track not found") };
      case (?existingTrack) {
        // Increment play count
        let updatedTrack : ApplicationTypes.Track = {
          id = existingTrack.id;
          title = existingTrack.title;
          artist = existingTrack.artist;
          duration = existingTrack.duration;
          genre = existingTrack.genre;
          coverImage = existingTrack.coverImage;
          audioUrl = existingTrack.audioUrl;
          price = existingTrack.price;
          releaseDate = existingTrack.releaseDate;
          description = existingTrack.description;
          plays = existingTrack.plays + 1;
          likes = existingTrack.likes;
          createdTimestamp = existingTrack.createdTimestamp;
          audioAssetId = existingTrack.audioAssetId;
          imageAssetId = existingTrack.imageAssetId;
        };
        tracksMap.put(trackId, updatedTrack);
        
        // Credit artist with royalty
        ignore UserManagement.creditBalance(usersMap, existingTrack.artist, ApplicationConstants.STREAM_ROYALTY);
        
        // Record transaction
        ignore TransactionManagement.recordRoyaltyTransaction(transactionsMap, existingTrack.artist, trackId, ApplicationConstants.STREAM_ROYALTY, nextTxId);
        
        #ok(nextTxId + 1)
      };
    }
  };
}