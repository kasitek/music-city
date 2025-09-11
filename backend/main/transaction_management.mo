import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Nat32 "mo:base/Nat32";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

import ApplicationTypes "./types";

module {
  type TransactionMap = HashMap.HashMap<Nat, ApplicationTypes.Transaction>;

  func now() : Nat64 { Nat64.fromIntWrap(Time.now()) };

  public func recordTipTransaction(
    transactionsMap : TransactionMap,
    from : Principal,
    to : Principal,
    amount : Nat,
    txId : Nat
  ) : Nat {
    let transaction : ApplicationTypes.Transaction = {
      id = txId;
      txType = #tip;
      from = from;
      to = to;
      amount = amount;
      timestamp = now();
      metadata = null;
    };
    transactionsMap.put(txId, transaction);
    txId + 1
  };

  public func recordRoyaltyTransaction(
    transactionsMap : TransactionMap,
    artist : Principal,
    trackId : Nat,
    amount : Nat,
    txId : Nat
  ) : Nat {
    let transaction : ApplicationTypes.Transaction = {
      id = txId;
      txType = #royalty;
      from = artist; // System-generated, but we'll use artist as from for now
      to = artist;
      amount = amount;
      timestamp = now();
      metadata = ?("trackId:" # debug_show(trackId));
    };
    transactionsMap.put(txId, transaction);
    txId + 1
  };

  public func getUserTransactions(
    transactionsMap : TransactionMap,
    userPrincipal : Principal
  ) : [ApplicationTypes.Transaction] {
    let allTransactions = transactionsMap.entries() |> Iter.toArray(_);
    let userTransactions = Array.filter<(Nat, ApplicationTypes.Transaction)>(allTransactions, func (entry) {
      let tx = entry.1;
      tx.from == userPrincipal or tx.to == userPrincipal
    });
    Array.map<(Nat, ApplicationTypes.Transaction), ApplicationTypes.Transaction>(userTransactions, func (entry) { entry.1 })
  };
}