import Array "mo:base/Array";
import Result "mo:base/Result";
import Nat "mo:base/Nat";

persistent actor {
  

  public type AssetId = Nat;
  public type Blob = [Nat8];

  // Staging now stores a list of (chunkNo, Blob) per AssetId so we can assemble the full asset on commit
  stable var staging : [(AssetId, [(Nat, Blob)])] = [];
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

  // Store or replace a single chunk for the given id
  public shared func put_chunk(id : AssetId, chunkNo : Nat, data : Blob) : async Result.Result<Bool, Text> {
    let existing : ?[(Nat, Blob)] = get<AssetId, [(Nat, Blob)]>(staging, id, func (a, b) { a == b });
    let updatedChunks : [(Nat, Blob)] = switch (existing) {
      case null {
        [(chunkNo, data)]
      };
      case (?chunks) {
        var found = false;
        let replaced = Array.map<(Nat, Blob), (Nat, Blob)>(chunks, func (c) {
          if (c.0 == chunkNo) { found := true; (chunkNo, data) } else { c }
        });
        if (found) { replaced } else { Array.append(replaced, [(chunkNo, data)]) }
      };
    };
    staging := upsert<AssetId, [(Nat, Blob)]>(staging, id, updatedChunks, func (a, b) { a == b });
    #ok(true)
  };

  public shared func commit_batch(id : AssetId, totalChunks : Nat, _contentType : Text, _size : Nat) : async Result.Result<Bool, Text> {
    switch (get<AssetId, [(Nat, Blob)]>(staging, id, func (a, b) { a == b })) {
      case null { #err("No staged data") };
      case (?chunks) {
        // Assemble in order 0..totalChunks-1
        var assembled : Blob = [];
        var i : Nat = 0;
        label build loop {
          if (i >= totalChunks) { break build };
          // find chunk i
          let found = Array.find<(Nat, Blob)>(chunks, func (c) { c.0 == i });
          switch (found) {
            case null { return #err("Missing chunk " # Nat.toText(i)) };
            case (?c) {
              assembled := Array.append<Nat8>(assembled, c.1);
            };
          };
          i += 1;
        };
        store := upsert<AssetId, Blob>(store, id, assembled, func (a, b) { a == b });
        // Clear staging for this id
        staging := Array.filter<(AssetId, [(Nat, Blob)])>(staging, func (kv) { kv.0 != id });
        #ok(true)
      }
    }
  };

  public shared query func get_data(id : AssetId) : async ?Blob {
    get<AssetId, Blob>(store, id, func (a, b) { a == b })
  };

  // Returns the total length of the stored blob for the given asset id
  public shared query func get_len(id : AssetId) : async ?Nat {
    switch (get<AssetId, Blob>(store, id, func (a, b) { a == b })) {
      case null { null };
      case (?b) { ?(Array.size<Nat8>(b)) };
    }
  };

  // Returns a slice of the stored blob starting at 'offset' of length at most 'size'
  // This allows clients to fetch large assets in chunks to avoid IC reply size limits (~3MB)
  public shared query func get_chunk(id : AssetId, offset : Nat, size : Nat) : async ?Blob {
    switch (get<AssetId, Blob>(store, id, func (a, b) { a == b })) {
      case null { null };
      case (?b) {
        let total = Array.size<Nat8>(b);
        if (offset >= total) { ?[] } else {
          let end = if (offset + size > total) { total } else { offset + size };
          let len = end - offset;
          ?(Array.subArray<Nat8>(b, offset, len))
        }
      };
    }
  };

  public shared func delete(id : AssetId) : async Result.Result<Bool, Text> {
    let before = store.size();
    store := Array.filter<(AssetId, Blob)>(store, func (kv) { kv.0 != id });
    if (store.size() < before) { #ok(true) } else { #err("Not found") }
  };
}
