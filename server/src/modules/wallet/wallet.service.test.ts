import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgres://music-city:music-city@127.0.0.1:5432/music-city";

const walletAddress = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

const { walletService } = await import("./wallet.service.js");

const originalFetch = global.fetch;

test("getWalletAccount returns an unfunded account state when Horizon reports 404", async () => {
  global.fetch = (async () =>
    new Response(null, {
      status: 404,
    })) as typeof fetch;

  try {
    const result = await walletService.getWalletAccount(walletAddress);

    assert.equal(result.exists, false);
    assert.equal(result.walletAddress, walletAddress);
    assert.deepEqual(result.balances, []);
  } finally {
    global.fetch = originalFetch;
  }
});

test("getWalletAccount parses and sorts native and issued asset balances", async () => {
  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        sequence: "12345",
        subentry_count: 2,
        balances: [
          {
            balance: "24.2000000",
            asset_type: "credit_alphanum4",
            asset_code: "USDC",
            asset_issuer: "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
            buying_liabilities: "0.0000000",
            selling_liabilities: "2.1000000",
            limit: "1000000.0000000",
          },
          {
            balance: "88.5000000",
            asset_type: "native",
            buying_liabilities: "0.0000000",
            selling_liabilities: "1.5000000",
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )) as typeof fetch;

  try {
    const result = await walletService.getWalletAccount(walletAddress);

    assert.equal(result.exists, true);
    assert.equal(result.sequence, "12345");
    assert.equal(result.balances[0]?.assetCode, "XLM");
    assert.equal(result.balances[0]?.availableAmount, "87");
    assert.equal(result.balances[1]?.assetCode, "USDC");
    assert.equal(result.balances[1]?.availableAmount, "22.1");
  } finally {
    global.fetch = originalFetch;
  }
});
