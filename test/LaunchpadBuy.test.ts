import { expect, use } from 'chai';
import { Contract, utils } from 'ethers';
import { MockProvider, solidity } from 'ethereum-waffle';
import { init } from './Launchpad';

use(solidity);

describe('Launchpad buy', () => {
  const [wallet] = new MockProvider().getWallets();
  const _tokenSupply = 16800;
  const _hardCap = 88.2;
  const decimals = 6;
  const tokenSupply = utils.parseUnits(_tokenSupply.toString(), decimals);
  const softCap = utils.parseEther('25');
  const hardCap = utils.parseEther(_hardCap.toString());
  const minBuy = utils.parseEther('0.01');
  const maxBuy = utils.parseEther('1');

  let erc20: Contract;
  let launchpad: Contract;
  let launchpadContractAddress: string;
  let launchpadContract: Contract;

  const balanceOf = async (address: string) => {
    return await launchpadContract.balanceOf(address);
  };

  beforeEach(async () => {
    const data = await init(wallet, {
      tokenSupply,
      softCap,
      hardCap,
      minBuy,
      maxBuy,
    });
    erc20 = data.erc20;
    launchpad = data.launchpad;
    launchpadContract = data.launchpadContract;
    launchpadContractAddress = data.launchpadContractAddress;
  });

  it('Min buy', async () => {
    await launchpadContract.buy({
      value: minBuy,
    });
    expect(await balanceOf(wallet.address)).to.equal(minBuy);
  });

  it('Max buy', async () => {
    await launchpadContract.buy({
      value: maxBuy,
    });
    expect(await balanceOf(wallet.address)).to.equal(maxBuy);
  });

  it('Invalid min buy', (done) => {
    const value = utils.parseEther('0.009999999');
    launchpadContract
      .buy({
        value,
      })
      .then(() => done(new Error()))
      .catch(() => done());
  });

  it('Invalid max buy', (done) => {
    const value = utils.parseEther('1.000000001');
    launchpadContract
      .buy({
        value,
      })
      .then(() => done(new Error()))
      .catch(() => done());
  });

  it('Multiple buy', async () => {
    for (let i = 0; i < 10; i++) {
      await launchpadContract.buy({
        value: utils.parseEther('0.1'),
      });
    }
    expect(await balanceOf(wallet.address)).to.equal(maxBuy);
  });

  it('Invalid multiple buy', async () => {
    let error: Error;
    for (let i = 0; i < 10; i++) {
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
