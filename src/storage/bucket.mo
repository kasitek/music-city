import Array "mo:base/Array";
import Result "mo:base/Result";

actor {
  // Minimal bucket storing entire blobs per asset for now (MVP).
  // We can extend to chunked assembly and HTTP range later.

  public type AssetId = Nat;
  public type Blob = [Nat8];

  stable var staging : [(AssetId, Blob)] = [];
  stable var store : [(AssetId, Blob)] = [];

  func upsert<K, V>(pairs : [(K, V)], k : K, v : V, eq : (K, K) -> Bool) : [(K, V)] {
    var found = false;
    let replaced = Array.map<(K, V), (K, V)>(pairs, func (kv) {
      if (eq(kv.0, k)) { found := true; (k, v) } else { kv }
    });
    if (found) { replaced } else { Array.append(replaced, [(k, v)]) }
  };

  func get<K, V>(pairs : [(K, V)], k : K, eq : (K, K) -> Bool) : ?V {
    switch (Array.find<(K, V)>(pairs, func (kv) { eq(kv.0, k) })) {
      case null { null };
      case (?kv) { ?kv.1 };
    }
  };

  public shared func put_chunk(id : AssetId, _chunkNo : Nat, data : Blob) : async Result.Result<Bool, Text> {
    staging := upsert<AssetId, Blob>(staging, id, data, func (a, b) { a == b });
    #ok(true)
  };

  public shared func commit_batch(id : AssetId, _totalChunks : Nat, _contentType : Text, _size : Nat) : async Result.Result<Bool, Text> {
    switch (get<AssetId, Blob>(staging, id, func (a, b) { a == b })) {
      case null { #err("No staged data") };
      case (?b) {
        store := upsert<AssetId, Blob>(store, id, b, func (a, b) { a == b });
        // Clear staging for this id
        staging := Array.filter<(AssetId, Blob)>(staging, func (kv) { kv.0 != id });
        #ok(true)
      }
    }
  };

  public shared query func get_data(id : AssetId) : async ?Blob {
    get<AssetId, Blob>(store, id, func (a, b) { a == b })
  };

  public shared func delete(id : AssetId) : async Result.Result<Bool, Text> {
    let before = store.size();
    store := Array.filter<(AssetId, Blob)>(store, func (kv) { kv.0 != id });
    if (store.size() < before) { #ok(true) } else { #err("Not found") }
  };
}
