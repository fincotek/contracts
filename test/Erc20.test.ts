import { expect, use } from 'chai';
import { Contract, utils } from 'ethers';
import { deployContract, MockProvider, solidity } from 'ethereum-waffle';
import ERC20 from '../build/ERC20.json';

use(solidity);

describe('ERC20', () => {
  const [wallet, wallet2] = new MockProvider().getWallets();
  const name = 'Test';
  const symbol = 'TEST';
  const decimals = utils.parseUnits('18', 'wei');
  const totalSupply = utils.parseEther('100000');
  let erc20: Contract;
  beforeEach(async () => {
    erc20 = await deployContract(wallet, ERC20, [
      wallet.address,
      name,
      symbol,
      decimals,
      totalSupply,
    ]);
  });

  it('name', async () => {
    expect(await erc20.name()).to.equal(name);
  });

  it('symbol', async () => {
    expect(await erc20.symbol()).to.equal(symbol);
  });

  it('decimals', async () => {
    expect(await erc20.decimals()).to.equal(decimals);
  });

  it('totalSupply', async () => {
    expect(await erc20.totalSupply()).to.equal(
      totalSupply.mul((10 ** decimals).toString())
    );
  });

  it('owner balance', async () => {
    expect(await erc20.balanceOf(wallet.address)).to.equal(
      totalSupply.mul((10 ** decimals).toString())
    );
  });

  it('transfer', async () => {
    const value = utils.parseEther('100');
    await erc20.transfer(wallet2.address, value);
    expect(await erc20.balanceOf(wallet2.address)).to.equal(value);
  });
});
