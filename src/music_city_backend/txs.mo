import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Nat64 "mo:base/Nat64";

import T "./types";

module {
  public func recordRoyaltyTx(
    txs : [T.Transaction],
    toUser : Principal,
    trackId : Nat,
    amount : Nat,
    timestamp : Nat64,
    nextTxId : Nat
  ) : ([T.Transaction], T.Transaction, Nat) {
    let tx : T.Transaction = {
      id = nextTxId;
      kind = #royalty;
      amount = amount;
      fromUser = null;
      toUser = toUser;
      trackId = ?trackId;
      nftId = null;
      timestamp = timestamp;
      status = #completed;
    };
    (Array.append(txs, [tx]), tx, nextTxId + 1)
  };

  public func recordTipTx(
    txs : [T.Transaction],
    fromUser : Principal,
    toUser : Principal,
    amount : Nat,
    timestamp : Nat64,
    nextTxId : Nat
  ) : ([T.Transaction], T.Transaction, Nat) {
    let tx : T.Transaction = {
      id = nextTxId; kind = #tip; amount; fromUser = ?fromUser; toUser; trackId = null; nftId = null; timestamp; status = #completed
    };
    (Array.append(txs, [tx]), tx, nextTxId + 1)
  };

  public func recordNftPurchaseTx(
    txs : [T.Transaction],
    fromUser : Principal,
    toUser : Principal,
    nftId : Nat,
    amount : Nat,
    timestamp : Nat64,
    nextTxId : Nat
  ) : ([T.Transaction], T.Transaction, Nat) {
    let tx : T.Transaction = {
      id = nextTxId; kind = #nft_purchase; amount; fromUser = ?fromUser; toUser; trackId = null; nftId = ?nftId; timestamp; status = #completed
    };
    (Array.append(txs, [tx]), tx, nextTxId + 1)
  };

  public func myTransactions(txs : [T.Transaction], caller : Principal) : [T.Transaction] {
    Array.filter<T.Transaction>(txs, func (t) {
      let fromMatches = switch (t.fromUser) { case (?p) { p == caller }; case null { false } };
      fromMatches or (t.toUser == caller)
    })
  };
}
