import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";

import ApplicationTypes "./types";
import ApplicationConstants "./constants";
import TransactionManagement "./transaction_management";

module {
  type UserMap = HashMap.HashMap<Principal, ApplicationTypes.User>;
  type TransactionMap = HashMap.HashMap<Nat, ApplicationTypes.Transaction>;

  func now() : Nat64 { Nat64.fromIntWrap(Time.now()) };

  public func registerUser(
    usersMap : UserMap,
    caller : Principal,
    displayName : Text,
    userType : ApplicationTypes.UserType,
    bio : Text,
    location : Text,
    genres : [Text],
    profileImage : Text,
    birthDate : ?Text
  ) : Result.Result<ApplicationTypes.User, Text> {
    switch (usersMap.get(caller)) {
      case (?_) { #err("User already registered") };
      case null {
        let newUser : ApplicationTypes.User = {
          owner = caller;
          displayName = displayName;
          userType = userType;
          bio = bio;
          location = location;
          genres = genres;
          profileImage = profileImage;
          isVerified = false;
          followers = 0;
          following = 0;
          balance = ApplicationConstants.INITIAL_BALANCE;
          joinedTimestamp = now();
          birthDate = birthDate;
        };
        usersMap.put(caller, newUser);
        #ok(newUser)
      };
    }
  };

  public func updateProfile(
    usersMap : UserMap,
    caller : Principal,
    displayName : ?Text,
    bio : ?Text,
    location : ?Text,
    genres : ?[Text],
    profileImage : ?Text
  ) : Result.Result<ApplicationTypes.User, Text> {
    switch (usersMap.get(caller)) {
      case null { #err("User not found") };
      case (?existingUser) {
        let updatedUser : ApplicationTypes.User = {
          owner = existingUser.owner;
          displayName = switch (displayName) { case (?name) name; case null existingUser.displayName };
          userType = existingUser.userType;
          bio = switch (bio) { case (?newBio) newBio; case null existingUser.bio };
          location = switch (location) { case (?newLocation) newLocation; case null existingUser.location };
          genres = switch (genres) { case (?newGenres) newGenres; case null existingUser.genres };
          profileImage = switch (profileImage) { case (?newImage) newImage; case null existingUser.profileImage };
          isVerified = existingUser.isVerified;
          followers = existingUser.followers;
          following = existingUser.following;
          balance = existingUser.balance;
          joinedTimestamp = existingUser.joinedTimestamp;
          birthDate = existingUser.birthDate;
        };
        usersMap.put(caller, updatedUser);
        #ok(updatedUser)
      };
    }
  };

  public func becomeArtist(
    usersMap : UserMap,
    caller : Principal
  ) : Result.Result<ApplicationTypes.User, Text> {
    switch (usersMap.get(caller)) {
      case null { #err("User not found") };
      case (?existingUser) {
        switch (existingUser.userType) {
          case (#artist) { #err("Already an artist") };
          case (#fan) {
            let updatedUser : ApplicationTypes.User = {
              owner = existingUser.owner;
              displayName = existingUser.displayName;
              userType = #artist;
              bio = existingUser.bio;
              location = existingUser.location;
              genres = existingUser.genres;
              profileImage = existingUser.profileImage;
              isVerified = existingUser.isVerified;
              followers = existingUser.followers;
              following = existingUser.following;
              balance = existingUser.balance;
              joinedTimestamp = existingUser.joinedTimestamp;
              birthDate = existingUser.birthDate;
            };
            usersMap.put(caller, updatedUser);
            #ok(updatedUser)
          };
        }
      };
    }
  };

  public func listArtists(usersMap : UserMap) : [ApplicationTypes.User] {
    let userEntries = usersMap.entries() |> Iter.toArray(_);
    let artistEntries = Array.filter<(Principal, ApplicationTypes.User)>(userEntries, func (entry) {
      switch (entry.1.userType) { case (#artist) true; case (#fan) false }
    });
    Array.map<(Principal, ApplicationTypes.User), ApplicationTypes.User>(artistEntries, func (entry) { entry.1 })
  };

  public func creditBalance(
    usersMap : UserMap,
    userPrincipal : Principal,
    amount : Nat
  ) : Bool {
    switch (usersMap.get(userPrincipal)) {
      case null { false };
      case (?existingUser) {
        let updatedUser : ApplicationTypes.User = {
          owner = existingUser.owner;
          displayName = existingUser.displayName;
          userType = existingUser.userType;
          bio = existingUser.bio;
          location = existingUser.location;
          genres = existingUser.genres;
          profileImage = existingUser.profileImage;
          isVerified = existingUser.isVerified;
          followers = existingUser.followers;
          following = existingUser.following;
          balance = existingUser.balance + amount;
          joinedTimestamp = existingUser.joinedTimestamp;
          birthDate = existingUser.birthDate;
        };
        usersMap.put(userPrincipal, updatedUser);
        true
      };
    }
  };

  public func debitBalance(
    usersMap : UserMap,
    userPrincipal : Principal,
    amount : Nat
  ) : Bool {
    switch (usersMap.get(userPrincipal)) {
      case null { false };
      case (?existingUser) {
        if (existingUser.balance < amount) { false }
        else {
          let updatedUser : ApplicationTypes.User = {
            owner = existingUser.owner;
            displayName = existingUser.displayName;
            userType = existingUser.userType;
            bio = existingUser.bio;
            location = existingUser.location;
            genres = existingUser.genres;
            profileImage = existingUser.profileImage;
            isVerified = existingUser.isVerified;
            followers = existingUser.followers;
            following = existingUser.following;
            balance = existingUser.balance - amount;
            joinedTimestamp = existingUser.joinedTimestamp;
            birthDate = existingUser.birthDate;
          };
          usersMap.put(userPrincipal, updatedUser);
          true
        }
      };
    }
  };

  public func tipArtist(
    usersMap : UserMap,
    transactionsMap : TransactionMap,
    caller : Principal,
    artist : Principal,
    amount : Nat,
    nextTxId : Nat
  ) : Result.Result<Bool, Text> {
    if (not debitBalance(usersMap, caller, amount)) {
      return #err("Insufficient balance")
    };
    if (not creditBalance(usersMap, artist, amount)) {
      // Rollback the debit
      ignore creditBalance(usersMap, caller, amount);
      return #err("Artist not found")
    };
    ignore TransactionManagement.recordTipTransaction(transactionsMap, caller, artist, amount, nextTxId);
    #ok(true)
  };

  public func followArtist(
    usersMap : UserMap,
    caller : Principal,
    artist : Principal
  ) : Result.Result<Bool, Text> {
    // Implementation for following - would need additional data structures
    // to track follows efficiently
    #ok(true)
  };

  public func unfollowArtist(
    usersMap : UserMap,
    caller : Principal,
    artist : Principal
  ) : Result.Result<Bool, Text> {
    // Implementation for unfollowing - would need additional data structures
    // to track follows efficiently
    #ok(true)
  };
}