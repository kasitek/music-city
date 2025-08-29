import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Nat64 "mo:base/Nat64";

import T "./types";
import C "./constants";

module {
  public func mint(
    nfts : [T.NFT],
    caller : Principal,
    isArtist : Bool,
    title : Text,
    image : Text,
    price : Nat,
    rarity : T.Rarity,
    description : Text,
    timestamp : Nat64,
    nextNftId : Nat
  ) : Result.Result<([T.NFT], T.NFT, Nat), Text> {
    if (not isArtist) { return #err("Only artists can mint NFTs") };
    let nft : T.NFT = {
      id = nextNftId; title; artist = caller; image; price; rarity; description; owner = null; createdTimestamp = timestamp
    };
    (#ok((Array.append(nfts, [nft]), nft, nextNftId + 1)))
  };

  public func list(nfts : [T.NFT]) : [T.NFT] { nfts };

  public func get(nfts : [T.NFT], id : Nat) : ?T.NFT {
    Array.find<T.NFT>(nfts, func (x) { x.id == id })
  };

  public func purchase(
    nfts : [T.NFT],
    caller : Principal,
    nftId : Nat
  ) : Result.Result<([T.NFT], T.NFT, Nat), Text> {
    let idxOpt = Array.indexOf<T.NFT>({ id = nftId; title = ""; artist = Principal.fromText("aaaaa-aa"); image = ""; price = 0; rarity = #common; description = ""; owner = null; createdTimestamp = 0 }, nfts, func (a, b) { a.id == b.id });
    switch (idxOpt) {
      case null { #err("NFT not found") };
      case (?idx) {
        let item = nfts[idx];
        if (item.owner != null) { return #err("NFT already sold") };
        let updated = { item with owner = ?caller };
        let nfts1 = Array.tabulate<T.NFT>(nfts.size(), func (i) { if (i == idx) { updated } else { nfts[i] } });
        #ok((nfts1, updated, item.price))
      }
    }
  };

  public func artistShare(price : Nat) : Nat {
    price * (10_000 - C.FEE_BPS) / 10_000
  };
}
