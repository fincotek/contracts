import { expect, use } from 'chai';
import { Contract, utils } from 'ethers';
import { MockProvider, solidity } from 'ethereum-waffle';
import { deployLaunchpad, deployLaunchpadContract } from './Launchpad';
import Launchpad from '../build/Launchpad.json';
import LaunchpadContract from '../build/LaunchpadContract.json';

use(solidity);

describe('Launchpad', () => {
  const [wallet1, wallet2] = new MockProvider().getWallets();

  let erc20: Contract;
  let launchpad: Contract;
  let launchpadContractAddress: string;
  let launchpadContract: Contract;

  const tokenSupply = utils.parseEther('15689');

  beforeEach(async () => {
    launchpad = await deployLaunchpad(wallet1, wallet2);
    const dataLaunchpadContract = await deployLaunchpadContract(
      wallet2,
      launchpad,
      {
        tokenSupply,
      }
    );
    erc20 = dataLaunchpadContract.erc20;
    launchpadContractAddress = dataLaunchpadContract.launchpadContractAddress;
    launchpadContract = new Contract(
      launchpadContractAddress,
      LaunchpadContract.abi,
      wallet2
    );
  });

  it('Creator', async () => {
    expect(await launchpadContract.creator()).to.equal(wallet1.address);
  });

  it('Owner', async () => {
    expect(await launchpadContract.owner()).to.equal(wallet2.address);
  });

  it('Balance of', async () => {
    expect(await erc20.balanceOf(launchpadContractAddress)).to.equal(
      tokenSupply
    );
  });
});
