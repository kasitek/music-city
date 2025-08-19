import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";

import T "./types";

actor {
  // Stable storage
  stable var users : [(Principal, T.User)] = [];
  stable var tracks : [T.Track] = [];
  stable var nfts : [T.NFT] = [];
  stable var txs : [T.Transaction] = [];

  // Counters
  stable var nextTrackId : Nat = 1;
  stable var nextNftId : Nat = 1;
  stable var nextTxId : Nat = 1;

  // Platform fee (basis points)
  let FEE_BPS : Nat = 1000; // 10%

  // Helpers
  func now() : Nat64 { Nat64.fromIntWrap(Time.now()) };

  func getUserOpt(p : Principal) : ?T.User {
    Iter.toArray(Iter.filter<(Principal, T.User)>(users.vals(), func (kv) { kv.0 == p })).vals().0?.1
  };

  func putUser(p : Principal, u : T.User) {
    // upsert
    var found = false;
    users := Array.tabulate<(Principal, T.User)>(users.size(), func (i) { users[i] });
    users := Array.foldLeft<(Principal, T.User), [(Principal, T.User)]>(users, [], func (acc, kv) {
      if (kv.0 == p) { found := true; Array.append<(Principal, T.User)>(acc, [(p, u)]) } else { Array.append(acc, [kv]) }
    });
    if (!found) { users := Array.append(users, [(p, u)]) };
  };

  func credit(p : Principal, amount : Nat) {
    switch (getUserOpt(p)) {
      case (?u) { putUser(p, { u with balance = u.balance + amount }) };
      case null {};
    }
  };

  func debit(p : Principal, amount : Nat) : Bool {
    switch (getUserOpt(p)) {
      case (?u) {
        if (u.balance >= amount) { putUser(p, { u with balance = u.balance - amount }); true } else { false }
      };
      case null { false };
    }
  };

  func recordTx(t : T.Transaction) { txs := Array.append(txs, [t]) };

  // Public API

  public shared ({ caller }) func registerUser(
    displayName : Text,
    userType : T.UserType,
    bio : Text,
    location : Text,
    genres : [Text],
    profileImage : Text,
    birthDate : ?Text
  ) : async Result.Result<T.User, Text> {
    switch (getUserOpt(caller)) {
      case (?_) { #err("User already registered") };
      case null {
        let u : T.User = {
          owner = caller;
          displayName;
          userType;
          bio;
          location;
          genres;
          profileImage;
          isVerified = false;
          followers = 0;
          following = 0;
          balance = 100_000; // initial faucet
          joinedTimestamp = now();
          birthDate;
        };
        users := Array.append(users, [(caller, u)]);
        #ok(u)
      }
    }
  };

  public shared query ({ caller }) func getMyUser() : async ?T.User { getUserOpt(caller) };
  public shared query func getUser(p : Principal) : async ?T.User { getUserOpt(p) };

  public shared ({ caller }) func updateProfile(
    displayName : ?Text,
    bio : ?Text,
    location : ?Text,
    genres : ?[Text],
    profileImage : ?Text
  ) : async Result.Result<T.User, Text> {
    switch (getUserOpt(caller)) {
      case null { #err("Not registered") };
      case (?u) {
        let updated : T.User = {
          owner = u.owner;
          displayName = switch (displayName) { case (?v) v; case null u.displayName };
          userType = u.userType;
          bio = switch (bio) { case (?v) v; case null u.bio };
          location = switch (location) { case (?v) v; case null u.location };
          genres = switch (genres) { case (?v) v; case null u.genres };
          profileImage = switch (profileImage) { case (?v) v; case null u.profileImage };
          isVerified = u.isVerified;
          followers = u.followers;
          following = u.following;
          balance = u.balance;
          joinedTimestamp = u.joinedTimestamp;
          birthDate = u.birthDate;
        };
        putUser(caller, updated);
        #ok(updated)
      }
    }
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
  ) : async Result.Result<T.Track, Text> {
    switch (getUserOpt(caller)) {
      case null { #err("Not registered") };
      case (?u) {
        switch (u.userType) {
          case (#artist) {
            let track : T.Track = {
              id = nextTrackId; title; artist = caller; duration; genre; coverImage; audioUrl;
              plays = 0; likes = 0; price; releaseDate; description
            };
            tracks := Array.append(tracks, [track]);
            nextTrackId += 1;
            #ok(track)
          };
          case (#fan) { #err("Only artists can create tracks") };
        }
      }
    }
  };

  public shared query func listTracks() : async [T.Track] { tracks };
  public shared query func getTrack(id : Nat) : async ?T.Track { Array.find<T.Track>(tracks, func (t) { t.id == id }) };

  public shared ({ caller }) func streamTrack(trackId : Nat) : async Result.Result<Bool, Text> {
    switch (getUserOpt(caller)) {
      case null { #err("Not registered") };
      case (?_) {
        let idxOpt = Array.indexOf<T.Track>({ id = trackId; title = ""; artist = caller; duration = ""; genre = ""; coverImage = ""; audioUrl = ""; plays = 0; likes = 0; price = 0; releaseDate = ""; description = "" }, tracks, func (a, b) { a.id == b.id });
        switch (idxOpt) {
          case null { #err("Track not found") };
          case (?idx) {
            let t = tracks[idx];
            // increment plays
            let updated = { t with plays = t.plays + 1 };
            tracks[idx] := updated;
            // royalty amount (fixed small)
            let royalty : Nat = 1; // 1 unit per stream
            credit(t.artist, royalty);
            let tx : T.Transaction = {
              id = nextTxId; kind = #royalty; amount = royalty; fromUser = null; toUser = t.artist;
              trackId = ?t.id; nftId = null; timestamp = now(); status = #completed
            };
            recordTx(tx); nextTxId += 1;
            #ok(true)
          }
        }
      }
    }
  };

  public shared ({ caller }) func tip(artist : Principal, amount : Nat) : async Result.Result<Bool, Text> {
    if (amount == 0) { return #err("Amount must be > 0") };
    switch (getUserOpt(caller)) {
      case null { #err("Not registered") };
      case (?_) {
        if (!debit(caller, amount)) { return #err("Insufficient balance") };
        credit(artist, amount);
        let tx : T.Transaction = {
          id = nextTxId; kind = #tip; amount; fromUser = ?caller; toUser = artist; trackId = null; nftId = null; timestamp = now(); status = #completed
        };
        recordTx(tx); nextTxId += 1;
        #ok(true)
      }
    }
  };

  public shared ({ caller }) func mintNFT(
    title : Text,
    image : Text,
    price : Nat,
    rarity : T.Rarity,
    description : Text
  ) : async Result.Result<T.NFT, Text> {
    switch (getUserOpt(caller)) {
      case null { #err("Not registered") };
      case (?u) {
        switch (u.userType) {
          case (#artist) {
            let nft : T.NFT = {
              id = nextNftId; title; artist = caller; image; price; rarity; description; owner = null; createdTimestamp = now()
            };
            nfts := Array.append(nfts, [nft]);
            nextNftId += 1;
            #ok(nft)
          };
          case (#fan) { #err("Only artists can mint NFTs") };
        }
      }
    }
  };

  public shared ({ caller }) func purchaseNFT(nftId : Nat) : async Result.Result<Bool, Text> {
    let idxOpt = Array.indexOf<T.NFT>({ id = nftId; title = ""; artist = caller; image = ""; price = 0; rarity = #common; description = ""; owner = null; createdTimestamp = 0 }, nfts, func (a, b) { a.id == b.id });
    switch (idxOpt) {
      case null { #err("NFT not found") };
      case (?idx) {
        let item = nfts[idx];
        if (item.owner != null) { return #err("NFT already sold") };
        switch (getUserOpt(caller)) {
          case null { #err("Not registered") };
          case (?_) {
            if (!debit(caller, item.price)) { return #err("Insufficient balance") };
            // 90% to artist, 10% fee stays in canister treasury (not tracked per-user here)
            let artistShare = item.price * (10_000 - FEE_BPS) / 10_000;
            credit(item.artist, artistShare);
            // set owner
            nfts[idx] := { item with owner = ?caller };
            let tx : T.Transaction = {
              id = nextTxId; kind = #nft_purchase; amount = item.price; fromUser = ?caller; toUser = item.artist; trackId = null; nftId = ?item.id; timestamp = now(); status = #completed
            };
            recordTx(tx); nextTxId += 1;
            #ok(true)
          }
        }
      }
    }
  };

  public shared query func listNFTs() : async [T.NFT] { nfts };
  public shared query func getNFT(id : Nat) : async ?T.NFT { Array.find<T.NFT>(nfts, func (x) { x.id == id }) };

  public shared query ({ caller }) func myTransactions() : async [T.Transaction] {
    Array.filter<T.Transaction>(txs, func (t) {
      switch (t.fromUser) { case (?p) { p == caller } case null { false } } or t.toUser == caller
    })
  };
}
