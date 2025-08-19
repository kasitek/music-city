import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";

import T "./types";
import U "./users";
import Tr "./tracks";
import N "./nfts";
import Tx "./txs";
import C "./constants";

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

  // Helpers
  func now() : Nat64 { Nat64.fromIntWrap(Time.now()) };

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
    switch (U.registerUser(users, caller, displayName, userType, bio, location, genres, profileImage, birthDate)) {
      case (#ok((users', u))) { users := users'; #ok(u) };
      case (#err(e)) { #err(e) };
    }
  };

  public shared query ({ caller }) func getMyUser() : async ?T.User { U.getUser(users, caller) };
  public shared query func getUser(p : Principal) : async ?T.User { U.getUser(users, p) };

  public shared ({ caller }) func updateProfile(
    displayName : ?Text,
    bio : ?Text,
    location : ?Text,
    genres : ?[Text],
    profileImage : ?Text
  ) : async Result.Result<T.User, Text> {
    switch (U.updateProfile(users, caller, displayName, bio, location, genres, profileImage)) {
      case (#ok((users', updated))) { users := users'; #ok(updated) };
      case (#err(e)) { #err(e) };
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
    let isArtist = switch (U.getUser(users, caller)) { case (?(u)) { switch (u.userType) { case (#artist) true; case (#fan) false } } case null false };
    switch (Tr.create(tracks, caller, isArtist, title, duration, genre, coverImage, audioUrl, price, releaseDate, description, nextTrackId)) {
      case (#ok((tracks', track, nextId))) { tracks := tracks'; nextTrackId := nextId; #ok(track) };
      case (#err(e)) { #err(e) };
    }
  };

  public shared query func listTracks() : async [T.Track] { Tr.list(tracks) };
  public shared query func getTrack(id : Nat) : async ?T.Track { Tr.get(tracks, id) };

  public shared ({ caller }) func streamTrack(trackId : Nat) : async Result.Result<Bool, Text> {
    switch (U.getUser(users, caller)) {
      case null { #err("Not registered") };
      case (?_) {
        switch (Tr.incrementPlay(tracks, trackId)) {
          case (#err(e)) { #err(e) };
          case (#ok((tracks', updatedTrack))) {
            tracks := tracks';
            // credit artist royalty and record tx
            users := U.credit(users, updatedTrack.artist, C.STREAM_ROYALTY);
            let (txs', _tx, nextId) = Tx.recordRoyaltyTx(txs, updatedTrack.artist, updatedTrack.id, C.STREAM_ROYALTY, now(), nextTxId);
            txs := txs'; nextTxId := nextId;
            #ok(true)
          }
        }
      }
    }
  };

  public shared ({ caller }) func tip(artist : Principal, amount : Nat) : async Result.Result<Bool, Text> {
    if (amount == 0) { return #err("Amount must be > 0") };
    switch (U.getUser(users, caller)) {
      case null { #err("Not registered") };
      case (?_) {
        let (users', ok) = U.debit(users, caller, amount);
        if (!ok) { return #err("Insufficient balance") };
        users := U.credit(users', artist, amount);
        let (txs', _tx, nextId) = Tx.recordTipTx(txs, caller, artist, amount, now(), nextTxId);
        txs := txs'; nextTxId := nextId;
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
    switch (U.getUser(users, caller)) {
      case null { #err("Not registered") };
      case (?u) {
        let isArtist = switch (u.userType) { case (#artist) true; case (#fan) false };
        switch (N.mint(nfts, caller, isArtist, title, image, price, rarity, description, now(), nextNftId)) {
          case (#ok((nfts', nft, nextId))) { nfts := nfts'; nextNftId := nextId; #ok(nft) };
          case (#err(e)) { #err(e) };
        }
      }
    }
  };

  public shared ({ caller }) func purchaseNFT(nftId : Nat) : async Result.Result<Bool, Text> {
    switch (N.purchase(nfts, caller, nftId)) {
      case (#err(e)) { #err(e) };
      case (#ok((nfts', nftUpdated, price))) {
        // attempt to debit buyer
        let (users', ok) = U.debit(users, caller, price);
        if (!ok) { return #err("Insufficient balance") };
        users := users';
        // credit artist
        users := U.credit(users, nftUpdated.artist, N.artistShare(price));
        // persist NFT list
        nfts := nfts';
        // record tx
        let (txs', _tx, nextId) = Tx.recordNftPurchaseTx(txs, caller, nftUpdated.artist, nftUpdated.id, price, now(), nextTxId);
        txs := txs'; nextTxId := nextId;
        #ok(true)
      }
    }
  };

  public shared query func listNFTs() : async [T.NFT] { N.list(nfts) };
  public shared query func getNFT(id : Nat) : async ?T.NFT { N.get(nfts, id) };

  public shared query ({ caller }) func myTransactions() : async [T.Transaction] {
    Tx.myTransactions(txs, caller)
  };
}
