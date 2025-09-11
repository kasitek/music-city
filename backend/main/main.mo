import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Nat32 "mo:base/Nat32";
import Iter "mo:base/Iter";

import ApplicationTypes "./types";
import UserManagement "./user_management";
import TrackManagement "./track_management";
import TransactionManagement "./transaction_management";
import ApplicationConstants "./constants";

persistent actor {
  
  // Using HashMaps for testing - will migrate to stable maps later
  stable var userEntries : [(Principal, ApplicationTypes.User)] = [];
  private transient var usersMap = HashMap.fromIter<Principal, ApplicationTypes.User>(userEntries.vals(), userEntries.size(), Principal.equal, Principal.hash);

  stable var trackEntries : [(Nat, ApplicationTypes.Track)] = [];
  private transient var tracksMap = HashMap.fromIter<Nat, ApplicationTypes.Track>(trackEntries.vals(), trackEntries.size(), Nat.equal, func(n: Nat): Nat32 { Nat32.fromNat(n) });

  stable var transactionEntries : [(Nat, ApplicationTypes.Transaction)] = [];
  private transient var transactionsMap = HashMap.fromIter<Nat, ApplicationTypes.Transaction>(transactionEntries.vals(), transactionEntries.size(), Nat.equal, func(n: Nat): Nat32 { Nat32.fromNat(n) });

  // Counters
  stable var nextTrackId : Nat = 1;
  stable var nextTransactionId : Nat = 1;
  
  // Pre-upgrade hook to save map entries
  system func preupgrade() {
    userEntries := Iter.toArray(usersMap.entries());
    trackEntries := Iter.toArray(tracksMap.entries());
    transactionEntries := Iter.toArray(transactionsMap.entries());
  };

  // Post-upgrade hook to restore maps
  system func postupgrade() {
    userEntries := [];
    trackEntries := [];
    transactionEntries := [];
  };

  // Helpers
  func now() : Nat64 { Nat64.fromIntWrap(Time.now()) };

  // Public API

  public shared ({ caller }) func registerUser(
    displayName : Text,
    userType : ApplicationTypes.UserType,
    bio : Text,
    location : Text,
    genres : [Text],
    profileImage : Text,
    birthDate : ?Text
  ) : async Result.Result<ApplicationTypes.User, Text> {
    UserManagement.registerUser(usersMap, caller, displayName, userType, bio, location, genres, profileImage, birthDate)
  };

  public shared query ({ caller }) func getMyUser() : async ?ApplicationTypes.User { 
    usersMap.get(caller) 
  };
  
  public shared query func getUser(principal : Principal) : async ?ApplicationTypes.User { 
    usersMap.get(principal) 
  };

  public shared query func listArtists() : async [ApplicationTypes.User] {
    UserManagement.listArtists(usersMap)
  };

  public shared ({ caller }) func updateProfile(
    displayName : ?Text,
    bio : ?Text,
    location : ?Text,
    genres : ?[Text],
    profileImage : ?Text
  ) : async Result.Result<ApplicationTypes.User, Text> {
    UserManagement.updateProfile(usersMap, caller, displayName, bio, location, genres, profileImage)
  };

  public shared ({ caller }) func becomeArtist() : async Result.Result<ApplicationTypes.User, Text> {
    UserManagement.becomeArtist(usersMap, caller)
  };

  public shared ({ caller }) func createTrack(
    title : Text,
    duration : Text,
    genre : Text,
    coverImage : Text,
    audioUrl : Text,
    price : Nat,
    releaseDate : Text,
    description : Text
  ) : async Result.Result<ApplicationTypes.Track, Text> {
    let result = TrackManagement.createTrack(tracksMap, usersMap, caller, title, duration, genre, coverImage, audioUrl, price, releaseDate, description, nextTrackId);
    switch (result) {
      case (#ok(track)) { 
        nextTrackId += 1; 
        #ok(track) 
      };
      case (#err(error)) { #err(error) };
    }
  };

  public shared query func listTracks() : async [ApplicationTypes.Track] { 
    TrackManagement.listTracks(tracksMap) 
  };
  
  public shared query func getTrack(trackId : Nat) : async ?ApplicationTypes.Track { 
    tracksMap.get(trackId) 
  };

  public shared ({ caller }) func setTrackAssets(
    trackId : Nat,
    audioAssetId : ?Nat,
    imageAssetId : ?Nat
  ) : async Result.Result<ApplicationTypes.Track, Text> {
    TrackManagement.setTrackAssets(tracksMap, caller, trackId, audioAssetId, imageAssetId)
  };

  public shared ({ caller }) func streamTrack(trackId : Nat) : async Result.Result<Bool, Text> {
    switch (usersMap.get(caller)) {
      case null { #err("User not registered") };
      case (?_) {
        switch (TrackManagement.streamTrack(tracksMap, usersMap, transactionsMap, trackId, caller, nextTransactionId)) {
          case (#ok(newTxId)) { 
            nextTransactionId := newTxId;
            #ok(true) 
          };
          case (#err(error)) { #err(error) };
        }
      }
    }
  };

  public shared ({ caller }) func tip(artist : Principal, amount : Nat) : async Result.Result<Bool, Text> {
    if (amount == 0) { return #err("Amount must be greater than 0") };
    switch (usersMap.get(caller)) {
      case null { #err("User not registered") };
      case (?_) {
        UserManagement.tipArtist(usersMap, transactionsMap, caller, artist, amount, nextTransactionId)
      }
    }
  };

  // NFT functions removed - will use intercanister calls to NFT standard

  public shared query ({ caller }) func myTransactions() : async [ApplicationTypes.Transaction] {
    TransactionManagement.getUserTransactions(transactionsMap, caller)
  };

  public shared ({ caller }) func follow(artist : Principal) : async Result.Result<Bool, Text> {
    switch (usersMap.get(caller)) {
      case null { #err("User not registered") };
      case (?_) {
        UserManagement.followArtist(usersMap, caller, artist)
      }
    }
  };

  public shared ({ caller }) func unfollow(artist : Principal) : async Result.Result<Bool, Text> {
    switch (usersMap.get(caller)) {
      case null { #err("User not registered") };
      case (?_) {
        UserManagement.unfollowArtist(usersMap, caller, artist)
      }
    }
  };
}
