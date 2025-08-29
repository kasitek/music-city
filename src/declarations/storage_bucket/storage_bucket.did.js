export const idlFactory = ({ IDL }) => {
  const AssetId = IDL.Nat;
  const Result = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  const Blob = IDL.Vec(IDL.Nat8);
  return IDL.Service({
    'commit_batch' : IDL.Func(
        [AssetId, IDL.Nat, IDL.Text, IDL.Nat],
        [Result],
        [],
      ),
    'delete' : IDL.Func([AssetId], [Result], []),
    'get_data' : IDL.Func([AssetId], [IDL.Opt(Blob)], ['query']),
    'put_chunk' : IDL.Func([AssetId, IDL.Nat, Blob], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
