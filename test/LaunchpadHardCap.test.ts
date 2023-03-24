import { expect, use } from 'chai';
import { Contract, utils } from 'ethers';
import { MockProvider, solidity } from 'ethereum-waffle';
import { deploy } from './Launchpad';
import LaunchpadContract from '../build/LaunchpadContract.json';

use(solidity);

describe('Launchpad hard cap', () => {
  const wallets = new MockProvider().getWallets();
  const [wallet] = wallets;
  let launchpadContractAddress: string;

  const hardCap = utils.parseEther('1');

  beforeEach(async () => {
    const data = await deploy(wallet, {
      hardCap,
    });
    launchpadContractAddress = data.launchpadContractAddress;
  });

  it('should max hard cap', async function () {
    let error: Error;
    for (const wallet of wallets) {
      const launchpadContract: Contract = new Contract(
        launchpadContractAddress,
        LaunchpadContract.abi,
        wallet
      );
      try {
        await launchpadContract.buy({
          value: utils.parseEther('0.2'),
        });
      } catch (e) {
        error = e;
        break;
      }
    }
    expect(error instanceof Error).to.equal(true);
  });
});
