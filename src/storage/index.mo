import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Result "mo:base/Result";

persistent actor {
  public type AssetId = Nat;
  public type BucketId = Principal; // for now, a single bucket; can expand later

  public type MediaType = {
    #audio;
    #image;
    #other;
  };

  public type Asset = {
    id : AssetId;
    owner : Principal;
    bucket : BucketId;
    mediaType : MediaType;
    ext : Text;
    size : Nat;
    contentType : Text;
  };

  stable var nextId : Nat = 1;
  stable var assets : [Asset] = [];
  // For local dev, register a single bucket at deploy time by reading environment or via setter.
  // We start with a null principal and allow setting it later via setBucket.
  stable var defaultBucket : ?BucketId = null;

  public shared ({ caller }) func setBucket(p : Principal) : async () {
    // Simple admin-less setter for local; in prod gate this.
    defaultBucket := ?p;
  };

  public shared ({ caller }) func createAsset(mediaType : MediaType, ext : Text, size : Nat, contentType : Text) : async Result.Result<(AssetId, BucketId), Text> {
    switch (defaultBucket) {
      case null { return #err("No bucket configured") };
      case (?b) {
        let id = nextId;
        nextId += 1;
        let a : Asset = { id; owner = caller; bucket = b; mediaType; ext; size; contentType };
        assets := Array.append(assets, [a]);
        #ok((id, b))
      }
    }
  };

  public shared query func locateAsset(id : AssetId) : async ?Asset {
    Array.find<Asset>(assets, func (a) { a.id == id })
  };

  public shared query ({ caller }) func listByOwner(p : ?Principal) : async [Asset] {
    let who = switch (p) { case (?x) x; case null caller };
    Array.filter<Asset>(assets, func (a) { a.owner == who })
  };

  public shared ({ caller }) func deleteAsset(id : AssetId) : async Result.Result<Bool, Text> {
    switch (Array.find<Asset>(assets, func (a) { a.id == id })) {
      case null { #err("Not found") };
      case (?a) {
        if (a.owner != caller) { return #err("Not owner") };
        let filtered = Array.filter<Asset>(assets, func (x) { x.id != id });
        assets := filtered;
        #ok(true)
      }
    }
  };
}
