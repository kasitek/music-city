import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface NFT {
  'id' : bigint,
  'title' : string,
  'owner' : [] | [Principal],
  'description' : string,
  'createdTimestamp' : bigint,
  'artist' : Principal,
  'rarity' : Rarity,
  'image' : string,
  'price' : bigint,
}
export type Rarity = { 'epic' : null } |
  { 'legendary' : null } |
  { 'rare' : null } |
  { 'common' : null };
export type Result = { 'ok' : User } |
  { 'err' : string };
export type Result_1 = { 'ok' : boolean } |
  { 'err' : string };
export type Result_2 = { 'ok' : Track } |
  { 'err' : string };
export type Result_3 = { 'ok' : NFT } |
  { 'err' : string };
export interface Track {
  'id' : bigint,
  'title' : string,
  'duration' : string,
  'imageAssetId' : [] | [bigint],
  'audioAssetId' : [] | [bigint],
  'description' : string,
  'audioUrl' : string,
  'likes' : bigint,
  'coverImage' : string,
  'genre' : string,
  'artist' : Principal,
  'plays' : bigint,
  'price' : bigint,
  'releaseDate' : string,
}
export interface Transaction {
  'id' : bigint,
  'status' : { 'pending' : null } |
    { 'completed' : null } |
    { 'failed' : null },
  'kind' : TxType,
  'toUser' : Principal,
  'trackId' : [] | [bigint],
  'nftId' : [] | [bigint],
  'timestamp' : bigint,
  'fromUser' : [] | [Principal],
  'amount' : bigint,
}
export type TxType = { 'tip' : null } |
  { 'stream' : null } |
  { 'royalty' : null } |
  { 'nft_purchase' : null };
export interface User {
  'bio' : string,
  'userType' : UserType,
  'balance' : bigint,
  'birthDate' : [] | [string],
  'displayName' : string,
  'joinedTimestamp' : bigint,
  'owner' : Principal,
  'profileImage' : string,
  'isVerified' : boolean,
  'genres' : Array<string>,
  'followers' : bigint,
  'following' : bigint,
  'location' : string,
}
export type UserType = { 'fan' : null } |
  { 'artist' : null };
export interface _SERVICE {
  'becomeArtist' : ActorMethod<[], Result>,
  'createTrack' : ActorMethod<
    [string, string, string, string, string, bigint, string, string],
    Result_2
  >,
  'follow' : ActorMethod<[Principal], Result_1>,
  'getMyUser' : ActorMethod<[], [] | [User]>,
  'getNFT' : ActorMethod<[bigint], [] | [NFT]>,
  'getTrack' : ActorMethod<[bigint], [] | [Track]>,
  'getUser' : ActorMethod<[Principal], [] | [User]>,
  'listArtists' : ActorMethod<[], Array<User>>,
  'listNFTs' : ActorMethod<[], Array<NFT>>,
  'listTracks' : ActorMethod<[], Array<Track>>,
  'mintNFT' : ActorMethod<[string, string, bigint, Rarity, string], Result_3>,
  'myTransactions' : ActorMethod<[], Array<Transaction>>,
  'purchaseNFT' : ActorMethod<[bigint], Result_1>,
  'registerUser' : ActorMethod<
    [string, UserType, string, string, Array<string>, string, [] | [string]],
    Result
  >,
  'setTrackAssets' : ActorMethod<
    [bigint, [] | [bigint], [] | [bigint]],
    Result_2
  >,
  'streamTrack' : ActorMethod<[bigint], Result_1>,
  'tip' : ActorMethod<[Principal, bigint], Result_1>,
  'unfollow' : ActorMethod<[Principal], Result_1>,
  'updateProfile' : ActorMethod<
    [
      [] | [string],
      [] | [string],
      [] | [string],
      [] | [Array<string>],
      [] | [string],
    ],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
