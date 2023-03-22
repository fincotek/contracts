import { expect, use } from 'chai';
import { Contract, utils } from 'ethers';
import { MockProvider, solidity } from 'ethereum-waffle';
import { init } from './Launchpad';

use(solidity);

describe('Launchpad token', () => {
  const [wallet] = new MockProvider().getWallets();
  const _tokenSupply = 16800;
  const _hardCap = 88.2;
  const decimals = 6;
  const tokenSupply = utils.parseUnits(_tokenSupply.toString(), decimals);
  const hardCap = utils.parseEther(_hardCap.toString());

  let erc20: Contract;
  let launchpad: Contract;
  let launchpadContractAddress: string;
  let launchpadContract: Contract;

  beforeEach(async () => {
    const data = await init(wallet, {
      tokenSupply,
      hardCap,
    });
    erc20 = data.erc20;
    launchpad = data.launchpad;
    launchpadContract = data.launchpadContract;
    launchpadContractAddress = data.launchpadContractAddress;
  });

  it('Token of', async () => {
    const value = 0.2;
    await launchpadContract.buy({
      value: utils.parseEther(value.toString()),
    });
    const amount =
      Math.round((_tokenSupply / _hardCap) * value * 10 ** decimals) /
      10 ** decimals;
    expect(
      utils
        .formatUnits(await launchpadContract.tokenOf(wallet.address), decimals)
        .toString()
    ).to.equal(amount.toString());
  });
});
