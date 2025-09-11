import Principal "mo:base/Principal";

module {
  public type ApplicationUserType = {
    #artist;
    #fan;
  };

  public type ApplicationUser = {
    owner : Principal;
    displayName : Text;
    userType : ApplicationUserType;
    bio : Text;
    location : Text;
    genres : [Text];
    profileImage : Text;
    isVerified : Bool;
    followers : Nat;
    following : Nat;
    balance : Nat; // native token units
    joinedTimestamp : Nat64;
    birthDate : ?Text;
  };

  public type MusicTrack = {
    id : Nat;
    title : Text;
    artist : Principal; // owner principal
    duration : Text;
    genre : Text;
    coverImage : Text;
    audioUrl : Text;
    // Optional asset references managed by storage canisters
    audioAssetId : ?Nat;
    imageAssetId : ?Nat;
    plays : Nat;
    likes : Nat;
    price : Nat; // per-stream/pay price in token units
    releaseDate : Text;
    description : Text;
    createdTimestamp : Nat64;
  };

  public type TransactionType = { #tip; #royalty };

  public type ApplicationTransaction = {
    id : Nat;
    txType : TransactionType;
    from : Principal;
    to : Principal;
    amount : Nat;
    timestamp : Nat64;
    metadata : ?Text;
  };

  // Legacy type aliases for backward compatibility
  public type UserType = ApplicationUserType;
  public type User = ApplicationUser;
  public type Track = MusicTrack;
  public type Transaction = ApplicationTransaction;
}
