// Auto-written IDL for music_city_backend canister
export const idlFactory = ({ IDL }: any) => {
  const UserType = IDL.Variant({ artist: IDL.Null, fan: IDL.Null })
  const User = IDL.Record({
    owner: IDL.Principal,
    displayName: IDL.Text,
    userType: UserType,
    bio: IDL.Text,
    location: IDL.Text,
    genres: IDL.Vec(IDL.Text),
    profileImage: IDL.Text,
    isVerified: IDL.Bool,
    followers: IDL.Nat,
    following: IDL.Nat,
    balance: IDL.Nat,
    joinedTimestamp: IDL.Nat64,
    birthDate: IDL.Opt(IDL.Text),
  })
  const Track = IDL.Record({
    id: IDL.Nat,
    title: IDL.Text,
    artist: IDL.Principal,
    duration: IDL.Text,
    genre: IDL.Text,
    coverImage: IDL.Text,
    audioUrl: IDL.Text,
    audioAssetId: IDL.Opt(IDL.Nat),
    imageAssetId: IDL.Opt(IDL.Nat),
    plays: IDL.Nat,
    likes: IDL.Nat,
    price: IDL.Nat,
    releaseDate: IDL.Text,
    description: IDL.Text,
  })
  const Rarity = IDL.Variant({ common: IDL.Null, rare: IDL.Null, epic: IDL.Null, legendary: IDL.Null })
  const NFT = IDL.Record({
    id: IDL.Nat,
    title: IDL.Text,
    artist: IDL.Principal,
    image: IDL.Text,
    price: IDL.Nat,
    rarity: Rarity,
    description: IDL.Text,
    owner: IDL.Opt(IDL.Principal),
    createdTimestamp: IDL.Nat64,
  })
  const TxType = IDL.Variant({ stream: IDL.Null, tip: IDL.Null, nft_purchase: IDL.Null, royalty: IDL.Null })
  const TxStatus = IDL.Variant({ completed: IDL.Null, pending: IDL.Null, failed: IDL.Null })
  const Transaction = IDL.Record({
    id: IDL.Nat,
    kind: TxType,
    amount: IDL.Nat,
    fromUser: IDL.Opt(IDL.Principal),
    toUser: IDL.Principal,
    trackId: IDL.Opt(IDL.Nat),
    nftId: IDL.Opt(IDL.Nat),
    timestamp: IDL.Nat64,
    status: TxStatus,
  })

  const ResultUser = IDL.Variant({ ok: User, err: IDL.Text })
  const ResultBool = IDL.Variant({ ok: IDL.Bool, err: IDL.Text })
  const ResultTrack = IDL.Variant({ ok: Track, err: IDL.Text })
  const ResultNFT = IDL.Variant({ ok: NFT, err: IDL.Text })

  return IDL.Service({
    registerUser: IDL.Func([IDL.Text, UserType, IDL.Text, IDL.Text, IDL.Vec(IDL.Text), IDL.Text, IDL.Opt(IDL.Text)], [ResultUser], []),
    getMyUser: IDL.Func([], [IDL.Opt(User)], ['query']),
    getUser: IDL.Func([IDL.Principal], [IDL.Opt(User)], ['query']),
    updateProfile: IDL.Func([IDL.Opt(IDL.Text), IDL.Opt(IDL.Text), IDL.Opt(IDL.Text), IDL.Opt(IDL.Vec(IDL.Text)), IDL.Opt(IDL.Text)], [ResultUser], []),

    createTrack: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Text, IDL.Text], [ResultTrack], []),
    listTracks: IDL.Func([], [IDL.Vec(Track)], ['query']),
    getTrack: IDL.Func([IDL.Nat], [IDL.Opt(Track)], ['query']),
    setTrackAssets: IDL.Func([IDL.Nat, IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)], [ResultTrack], []),
    streamTrack: IDL.Func([IDL.Nat], [ResultBool], []),

    tip: IDL.Func([IDL.Principal, IDL.Nat], [ResultBool], []),

    mintNFT: IDL.Func([IDL.Text, IDL.Text, IDL.Nat, Rarity, IDL.Text], [ResultNFT], []),
    purchaseNFT: IDL.Func([IDL.Nat], [ResultBool], []),
    listNFTs: IDL.Func([], [IDL.Vec(NFT)], ['query']),
    getNFT: IDL.Func([IDL.Nat], [IDL.Opt(NFT)], ['query']),

    myTransactions: IDL.Func([], [IDL.Vec(Transaction)], ['query']),
  })
}

export type _SERVICE = ReturnType<typeof idlFactory>
