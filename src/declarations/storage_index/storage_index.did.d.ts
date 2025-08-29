import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Asset {
  'id' : AssetId,
  'ext' : string,
  'contentType' : string,
  'owner' : Principal,
  'size' : bigint,
  'mediaType' : MediaType,
  'bucket' : BucketId,
}
export type AssetId = bigint;
export type BucketId = Principal;
export type MediaType = { 'audio' : null } |
  { 'other' : null } |
  { 'image' : null };
export type Result = { 'ok' : boolean } |
  { 'err' : string };
export type Result_1 = { 'ok' : [AssetId, BucketId] } |
  { 'err' : string };
export interface _SERVICE {
  'createAsset' : ActorMethod<[MediaType, string, bigint, string], Result_1>,
  'deleteAsset' : ActorMethod<[AssetId], Result>,
  'listByOwner' : ActorMethod<[[] | [Principal]], Array<Asset>>,
  'locateAsset' : ActorMethod<[AssetId], [] | [Asset]>,
  'setBucket' : ActorMethod<[Principal], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
