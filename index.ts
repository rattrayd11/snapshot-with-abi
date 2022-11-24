// Importing libraries
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { createWriteStream, readFileSync } from 'fs';
import { Alchemy, Network } from 'alchemy-sdk';
import { BigNumberish, constants } from 'ethers';

const alchemySettings = {
  apiKey: 'i9knYnvIwodM7grwF5bZr5QcCmYPoGCk', // Replace with your Alchemy API Key.
  network: Network.OPT_MAINNET, // Replace with your network.
};

const alchemy = new Alchemy(alchemySettings);

// Instantiate thirdweb SDK
const sdk = new ThirdwebSDK('optimism');

const erc: 'erc721' | 'erc1155' = 'erc721'; // Choose erc721 or erc1155
const contractAddress = '0x3e7e82fB003cAa50930F288c165f8E895f02117B'; // Replace with your contract address
const tokenId = '0'; // Replace with the token ID to check the balance of (in case of ERC1155, otherwise ignore)

const getBalances = async (erc: "erc721" | "erc1155") => {
  const contract = await sdk.getContractFromAbi(
    contractAddress, 
    JSON.parse(readFileSync("myABI.json", "utf8"))
  );
  let addresses: string[] = [];
  if (erc === 'erc1155') {
    addresses = (
      await alchemy.nft.getOwnersForNft(contractAddress, tokenId)
    ).owners.filter((addr) => addr !== constants.AddressZero);
  } else if (erc === 'erc721') {
    addresses = (
      await alchemy.nft.getOwnersForContract(contractAddress)
    ).owners.filter((addr) => addr !== constants.AddressZero);
  }

  const balances: { address: string; quantity: string }[] = [];
  const writeStream = createWriteStream('output.json');
  writeStream.write('[' + '\n');
  try {
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      let balanceOf: BigNumberish = 0;
      if (erc === 'erc1155') {
        balanceOf = await contract.erc1155.balanceOf(address, tokenId);
      } else if (erc === 'erc721') {
        balanceOf = await contract.erc721.balanceOf(address);
      }
      const objectToPush = { address, quantity: balanceOf.toString() };

      if (objectToPush.quantity !== '0') {
        balances.push(objectToPush);
      }

      writeStream.write(
        JSON.stringify(objectToPush) +
          (i === addresses.length - 1 ? '\n' : ',\n'),
      );
    }
  } catch (error) {
    console.log(error);
  }

  writeStream.write(']' + '\n');
  writeStream.end();
  console.log("Output written to 'output.json'");

  return balances;
};

getBalances(erc);
