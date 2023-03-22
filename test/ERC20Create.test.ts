import { expect, use } from 'chai';
import { Contract, utils } from 'ethers';
import { deployContract, MockProvider, solidity } from 'ethereum-waffle';
import ERC20Create from '../build/ERC20Create.json';
import ERC20 from '../build/ERC20.json';

use(solidity);

describe('ERC20', () => {
  const [wallet, wallet2] = new MockProvider().getWallets();
  const fee = utils.parseEther('0.1');
  const name = 'ERC20 Test';
  const symbol = 'ERC20T';
  const decimals = utils.parseUnits('12', 'wei');
  const totalSupply = utils.parseEther('21000000000');
  let walletBalance;
  let erc20Create: Contract;
  let erc20: Contract;
  beforeEach(async () => {
    const contract: Contract = await deployContract(wallet, ERC20Create, [fee]);
    walletBalance = await wallet.getBalance();
    erc20Create = new Contract(contract.address, ERC20Create.abi, wallet2);
    await erc20Create.deploy(name, symbol, decimals, totalSupply, {
      value: fee,
    });
    const address = await erc20Create.contractOf(wallet2.address);
    erc20 = new Contract(address, ERC20.abi, wallet);
  });

  it('Creator', async () => {
    expect(await erc20Create.owner()).to.equal(wallet.address);
  });

  it('Creator balance', async () => {
    expect(await wallet.getBalance()).to.equal(walletBalance.add(fee));
  });

  it('ERC20 owner', async () => {
    expect(await erc20.owner()).to.equal(wallet2.address);
  });
});
