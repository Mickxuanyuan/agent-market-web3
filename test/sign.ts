const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { mainnet } = require('viem/chains');

async function main() {
  const privateKey = process.env.TEST_PRIVATE_KEY;
  const message = process.env.SIGN_MESSAGE;

  if (!privateKey || !message) {
    throw new Error('Missing TEST_PRIVATE_KEY or SIGN_MESSAGE');
  }

  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  });

  const signature = await client.signMessage({ message });
  console.log(signature);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
