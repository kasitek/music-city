import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type ApplicationUserType = { 'fan' : null } |
  { 'artist' : null };
export type Result = { 'ok' : User } |
  { 'err' : string };
export type Result_1 = { 'ok' : boolean } |
  { 'err' : string };
export type Result_2 = { 'ok' : Track } |
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
  'createdTimestamp' : bigint,
  'artist' : Principal,
  'plays' : bigint,
  'price' : bigint,
  'releaseDate' : string,
}
export interface Transaction {
  'id' : bigint,
  'to' : Principal,
  'metadata' : [] | [string],
  'from' : Principal,
  'timestamp' : bigint,
  'txType' : TransactionType,
  'amount' : bigint,
}
export type TransactionType = { 'tip' : null } |
  { 'royalty' : null };
export interface User {
  'bio' : string,
  'userType' : ApplicationUserType,
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
  'getTrack' : ActorMethod<[bigint], [] | [Track]>,
  'getUser' : ActorMethod<[Principal], [] | [User]>,
  'listArtists' : ActorMethod<[], Array<User>>,
  'listTracks' : ActorMethod<[], Array<Track>>,
  'myTransactions' : ActorMethod<[], Array<Transaction>>,
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
