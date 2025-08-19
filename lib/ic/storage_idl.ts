// IDL for storage canisters
export const indexIdlFactory = ({ IDL }: any) => {
  const MediaType = IDL.Variant({ audio: IDL.Null, image: IDL.Null, other: IDL.Null })
  const AssetId = IDL.Nat
  const BucketId = IDL.Principal
  const Asset = IDL.Record({
    id: AssetId,
    owner: IDL.Principal,
    bucket: BucketId,
    mediaType: MediaType,
    ext: IDL.Text,
    size: IDL.Nat,
    contentType: IDL.Text,
  })
  const ResultCreate = IDL.Variant({ ok: IDL.Tuple(AssetId, BucketId), err: IDL.Text })

  return IDL.Service({
    setBucket: IDL.Func([IDL.Principal], [], []),
    createAsset: IDL.Func([MediaType, IDL.Text, IDL.Nat, IDL.Text], [ResultCreate], []),
    locateAsset: IDL.Func([AssetId], [IDL.Opt(Asset)], ['query']),
    listByOwner: IDL.Func([IDL.Opt(IDL.Principal)], [IDL.Vec(Asset)], ['query']),
    deleteAsset: IDL.Func([AssetId], [IDL.Variant({ ok: IDL.Bool, err: IDL.Text })], []),
  })
}

export type _INDEX_SERVICE = ReturnType<typeof indexIdlFactory>

export const bucketIdlFactory = ({ IDL }: any) => {
  const AssetId = IDL.Nat
  const Blob = IDL.Vec(IDL.Nat8)
  const ResultBool = IDL.Variant({ ok: IDL.Bool, err: IDL.Text })
  return IDL.Service({
    put_chunk: IDL.Func([AssetId, IDL.Nat, Blob], [ResultBool], []),
    commit_batch: IDL.Func([AssetId, IDL.Nat, IDL.Text, IDL.Nat], [ResultBool], []),
    get_data: IDL.Func([AssetId], [IDL.Opt(Blob)], ['query']),
    delete: IDL.Func([AssetId], [ResultBool], []),
  })
}

export type _BUCKET_SERVICE = ReturnType<typeof bucketIdlFactory>
