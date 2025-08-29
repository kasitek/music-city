import Principal "mo:base/Principal";

module {
  public type UserType = {
    #artist;
    #fan;
  };

  public type User = {
    owner : Principal;
    displayName : Text;
    userType : UserType;
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

  public type Track = {
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
  };

  public type Rarity = {
    #common; #rare; #epic; #legendary
  };

  public type NFT = {
    id : Nat;
    title : Text;
    artist : Principal; // creator/beneficiary
    image : Text;
    price : Nat;
    rarity : Rarity;
    description : Text;
    owner : ?Principal; // None means unsold
    createdTimestamp : Nat64;
  };

  public type TxType = { #stream; #tip; #nft_purchase; #royalty };

  public type Transaction = {
    id : Nat;
    kind : TxType;
    amount : Nat;
    fromUser : ?Principal;
    toUser : Principal;
    trackId : ?Nat;
    nftId : ?Nat;
    timestamp : Nat64;
    status : { #completed; #pending; #failed };
  };
}
