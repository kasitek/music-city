export const idlFactory = ({ IDL }) => {
  const ApplicationUserType = IDL.Variant({
    'fan' : IDL.Null,
    'artist' : IDL.Null,
  });
  const User = IDL.Record({
    'bio' : IDL.Text,
    'userType' : ApplicationUserType,
    'balance' : IDL.Nat,
    'birthDate' : IDL.Opt(IDL.Text),
    'displayName' : IDL.Text,
    'joinedTimestamp' : IDL.Nat64,
    'owner' : IDL.Principal,
    'profileImage' : IDL.Text,
    'isVerified' : IDL.Bool,
    'genres' : IDL.Vec(IDL.Text),
    'followers' : IDL.Nat,
    'following' : IDL.Nat,
    'location' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : User, 'err' : IDL.Text });
  const Track = IDL.Record({
    'id' : IDL.Nat,
    'title' : IDL.Text,
    'duration' : IDL.Text,
    'imageAssetId' : IDL.Opt(IDL.Nat),
    'audioAssetId' : IDL.Opt(IDL.Nat),
    'description' : IDL.Text,
    'audioUrl' : IDL.Text,
    'likes' : IDL.Nat,
    'coverImage' : IDL.Text,
    'genre' : IDL.Text,
    'createdTimestamp' : IDL.Nat64,
    'artist' : IDL.Principal,
    'plays' : IDL.Nat,
    'price' : IDL.Nat,
    'releaseDate' : IDL.Text,
  });
  const Result_2 = IDL.Variant({ 'ok' : Track, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  const TransactionType = IDL.Variant({
    'tip' : IDL.Null,
    'royalty' : IDL.Null,
  });
  const Transaction = IDL.Record({
    'id' : IDL.Nat,
    'to' : IDL.Principal,
    'metadata' : IDL.Opt(IDL.Text),
    'from' : IDL.Principal,
    'timestamp' : IDL.Nat64,
    'txType' : TransactionType,
    'amount' : IDL.Nat,
  });
  const UserType = IDL.Variant({ 'fan' : IDL.Null, 'artist' : IDL.Null });
  return IDL.Service({
    'becomeArtist' : IDL.Func([], [Result], []),
    'createTrack' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Nat,
          IDL.Text,
          IDL.Text,
        ],
        [Result_2],
        [],
      ),
    'follow' : IDL.Func([IDL.Principal], [Result_1], []),
    'getMyUser' : IDL.Func([], [IDL.Opt(User)], ['query']),
    'getTrack' : IDL.Func([IDL.Nat], [IDL.Opt(Track)], ['query']),
    'getUser' : IDL.Func([IDL.Principal], [IDL.Opt(User)], ['query']),
    'listArtists' : IDL.Func([], [IDL.Vec(User)], ['query']),
    'listTracks' : IDL.Func([], [IDL.Vec(Track)], ['query']),
    'myTransactions' : IDL.Func([], [IDL.Vec(Transaction)], ['query']),
    'registerUser' : IDL.Func(
        [
          IDL.Text,
          UserType,
          IDL.Text,
          IDL.Text,
          IDL.Vec(IDL.Text),
          IDL.Text,
          IDL.Opt(IDL.Text),
        ],
        [Result],
        [],
      ),
    'setTrackAssets' : IDL.Func(
        [IDL.Nat, IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [Result_2],
        [],
      ),
    'streamTrack' : IDL.Func([IDL.Nat], [Result_1], []),
    'tip' : IDL.Func([IDL.Principal, IDL.Nat], [Result_1], []),
    'unfollow' : IDL.Func([IDL.Principal], [Result_1], []),
    'updateProfile' : IDL.Func(
        [
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Vec(IDL.Text)),
          IDL.Opt(IDL.Text),
        ],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
