import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AssetId = bigint;
export type Blob = Uint8Array | number[];
export type Result = { 'ok' : boolean } |
  { 'err' : string };
export interface _SERVICE {
  'commit_batch' : ActorMethod<[AssetId, bigint, string, bigint], Result>,
  'delete' : ActorMethod<[AssetId], Result>,
  'get_chunk' : ActorMethod<[AssetId, bigint, bigint], [] | [Blob]>,
  'get_data' : ActorMethod<[AssetId], [] | [Blob]>,
  'get_len' : ActorMethod<[AssetId], [] | [bigint]>,
  'put_chunk' : ActorMethod<[AssetId, bigint, Blob], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
