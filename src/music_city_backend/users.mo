import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";

import T "./types";

module {
  func now() : Nat64 { Nat64.fromIntWrap(Time.now()) };

  public func getUser(users : [(Principal, T.User)], p : Principal) : ?T.User {
    switch (Array.find<(Principal, T.User)>(users, func (kv) { kv.0 == p })) {
      case null { null };
      case (?kv) { ?kv.1 };
    }
  };

  func upsert(users : [(Principal, T.User)], p : Principal, u : T.User) : [(Principal, T.User)] {
    var found = false;
    let replaced = Array.map<(Principal, T.User), (Principal, T.User)>(users, func (kv) {
      if (kv.0 == p) { found := true; (p, u) } else { kv }
    });
    if (found) { replaced } else { Array.append(replaced, [(p, u)]) }
  };

  public func registerUser(users : [(Principal, T.User)], caller : Principal,
    displayName : Text,
    userType : T.UserType,
    bio : Text,
    location : Text,
    genres : [Text],
    profileImage : Text,
    birthDate : ?Text
  ) : Result.Result<([(Principal, T.User)], T.User), Text> {
    switch (getUser(users, caller)) {
      case (?_) { #err("User already registered") };
      case null {
        let u : T.User = {
          owner = caller;
          displayName; userType; bio; location; genres; profileImage;
          isVerified = false; followers = 0; following = 0; balance = 100_000;
          joinedTimestamp = now(); birthDate
        };
        let users' = Array.append(users, [(caller, u)]);
        #ok((users', u))
      }
    }
  };

  public func updateProfile(users : [(Principal, T.User)], caller : Principal,
    displayName : ?Text,
    bio : ?Text,
    location : ?Text,
    genres : ?[Text],
    profileImage : ?Text
  ) : Result.Result<([(Principal, T.User)], T.User), Text> {
    switch (getUser(users, caller)) {
      case null { #err("Not registered") };
      case (?u) {
        let updated : T.User = {
          owner = u.owner;
          displayName = switch (displayName) { case (?v) v; case null u.displayName };
          userType = u.userType;
          bio = switch (bio) { case (?v) v; case null u.bio };
          location = switch (location) { case (?v) v; case null u.location };
          genres = switch (genres) { case (?v) v; case null u.genres };
          profileImage = switch (profileImage) { case (?v) v; case null u.profileImage };
          isVerified = u.isVerified;
          followers = u.followers;
          following = u.following;
          balance = u.balance;
          joinedTimestamp = u.joinedTimestamp;
          birthDate = u.birthDate;
        };
        let users' = upsert(users, caller, updated);
        #ok((users', updated))
      }
    }
  };

  public func credit(users : [(Principal, T.User)], p : Principal, amount : Nat) : [(Principal, T.User)] {
    switch (getUser(users, p)) {
      case null { users };
      case (?u) {
        upsert(users, p, { u with balance = u.balance + amount })
      }
    }
  };

  public func debit(users : [(Principal, T.User)], p : Principal, amount : Nat) : ([(Principal, T.User)], Bool) {
    switch (getUser(users, p)) {
      case null { (users, false) };
      case (?u) {
        if (u.balance >= amount) {
          (upsert(users, p, { u with balance = u.balance - amount }), true)
        } else { (users, false) }
      }
    }
  };
}
