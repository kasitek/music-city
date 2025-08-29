import { Principal } from "@dfinity/principal";
import { sha224 } from "@noble/hashes/sha2";
import {
  arrayOfNumberToUint8Array,
  asciiStringToByteArray,
  bigEndianCrc32,
  uint8ArrayToHexString,
} from "@dfinity/utils";



export const aidFromPrincipal = (principal: Principal) => {
  const accountIdentifier = AccountIdentifier.fromPrincipal({
    principal: principal,
    subAccount: undefined,
  });
  return accountIdentifier.toHex();
};



export class AccountIdentifier {
  private constructor(private readonly bytes: Uint8Array) {}

  public static fromPrincipal({
    principal,
    subAccount = new Uint8Array(32).fill(0),
  }: {
    principal: Principal;
    subAccount?: Uint8Array;
  }): AccountIdentifier {
    const padding = asciiStringToByteArray("\x0Aaccount-id");

    const shaObj = sha224.create();
    shaObj.update(
      arrayOfNumberToUint8Array([
        ...padding,
        ...principal.toUint8Array(),
        ...subAccount,
      ])
    );
    const hash = shaObj.digest();

    const checksum = bigEndianCrc32(hash);
    const bytes = new Uint8Array([...checksum, ...hash]);
    return new AccountIdentifier(bytes);
  }

  public toHex(): string {
    return uint8ArrayToHexString(this.bytes);
  }
}

