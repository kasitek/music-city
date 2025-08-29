export const idlFactory = ({ IDL }) => {
  const MediaType = IDL.Variant({
    'audio' : IDL.Null,
    'other' : IDL.Null,
    'image' : IDL.Null,
  });
  const AssetId = IDL.Nat;
  const BucketId = IDL.Principal;
  const Result_1 = IDL.Variant({
    'ok' : IDL.Tuple(AssetId, BucketId),
    'err' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  const Asset = IDL.Record({
    'id' : AssetId,
    'ext' : IDL.Text,
    'contentType' : IDL.Text,
    'owner' : IDL.Principal,
    'size' : IDL.Nat,
    'mediaType' : MediaType,
    'bucket' : BucketId,
  });
  return IDL.Service({
    'createAsset' : IDL.Func(
        [MediaType, IDL.Text, IDL.Nat, IDL.Text],
        [Result_1],
        [],
      ),
    'deleteAsset' : IDL.Func([AssetId], [Result], []),
    'listByOwner' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [IDL.Vec(Asset)],
        ['query'],
      ),
    'locateAsset' : IDL.Func([AssetId], [IDL.Opt(Asset)], ['query']),
    'setBucket' : IDL.Func([IDL.Principal], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
