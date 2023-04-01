import { expect, use } from 'chai';
import { BigNumber, Contract, ContractTransaction, utils, Wallet } from 'ethers';
import { deployContract, MockProvider, solidity } from 'ethereum-waffle';
import ERC20 from '../build/ERC20.json';
import FincotekICO from '../build/FincotekICO.json';

use(solidity);

describe('Fincotek ICO', async () => {
  const provider = new MockProvider();
  const [wallet] = provider.getWallets();
  let erc20: Contract;
  let fincotekICO: Contract;
  let walletCreated: Wallet;

  beforeEach(async () => {
    erc20 = await deployContract(wallet, ERC20);
    fincotekICO = await deployContract(wallet, FincotekICO, [erc20.address]);
    await erc20.approve(fincotekICO.address, await fincotekICO.tokenSupply());
    await fincotekICO.sendToken();
    walletCreated = Wallet.createRandom().connect(provider);
    await wallet.sendTransaction({
      to: walletCreated.address,
      value: utils.parseEther('100'),
    });
  });

  it('Owner', async () => {
    expect(await fincotekICO.owner()).to.equal(wallet.address);
  });

  it('Contract balance token supply', async () => {
    expect(await erc20.balanceOf(fincotekICO.address)).to.equal(await fincotekICO.tokenSupply());
  });

  it('Buy', async () => {
    await walletCreated.sendTransaction({
      to: fincotekICO.address,
      value: utils.parseEther('0.1')
    })
    await walletCreated.sendTransaction({
      to: fincotekICO.address,
      value: utils.parseEther('0.2')
    })
    expect(await fincotekICO.tokenOf(walletCreated.address)).to.equal(utils.parseEther('750000'));
    expect(await erc20.balanceOf(walletCreated.address)).to.equal(utils.parseEther('750000'));
  });


  it('Min buy', async () => {
    await walletCreated.sendTransaction({
      to: fincotekICO.address,
      value: utils.parseEther('0.01')
    })
    expect(await fincotekICO.tokenOf(walletCreated.address)).to.equal(utils.parseEther('25000'));
  });

  it('Max buy', async () => {
    await walletCreated.sendTransaction({
      to: fincotekICO.address,
      value: utils.parseEther('1')
    })
    expect(await fincotekICO.tokenOf(walletCreated.address)).to.equal(utils.parseEther('2500000'));
  });

  it('Min buy error', async () => {
    let error: Error;
    try {
      await walletCreated.sendTransaction({
        to: fincotekICO.address,
        value: utils.parseEther('0.009')
      })
    } catch (e) {
      error = e;
    }

    expect(error instanceof Error).to.equal(true);
  });

  it('Max buy error', async () => {
    let error: Error;
    try {
      await walletCreated.sendTransaction({
        to: fincotekICO.address,
        value: utils.parseEther('1.0001')
      })
    } catch (e) {
      error = e;
    }
    expect(error instanceof Error).to.equal(true);
  });

  it('Hard cap error', async () => {
    let error: Error;
    try {
      await walletCreated.sendTransaction({
        to: fincotekICO.address,
        value: utils.parseEther('20')
      })
    } catch (e) {
      error = e;
    }

    expect(error instanceof Error).to.equal(true);
  });

  it('Hard cap error', async () => {
    let error: Error;
    for (let i = 0; i < 21; i++) {
      const walletCreated = Wallet.createRandom().connect(provider);
      await wallet.sendTransaction({
        to: walletCreated.address,
        value: utils.parseEther('10'),
      });
      try {
        await walletCreated.sendTransaction({
          to: fincotekICO.address,
          value: utils.parseEther('1')
        })
      } catch (e) {
        error = e;
      }
    }
    expect(error instanceof Error).to.equal(true);
  });

  it('withdraw', async () => {
    for (let i = 0; i < 10; i++) {
      const walletCreated = Wallet.createRandom().connect(provider);
      await wallet.sendTransaction({
        to: walletCreated.address,
        value: utils.parseEther('10'),
      });
      await walletCreated.sendTransaction({
        to: fincotekICO.address,
        value: utils.parseEther('1')
      })
    }
    const oldBalance = await provider.getBalance(wallet.address);
    expect(await provider.getBalance(fincotekICO.address)).to.equal(utils.parseEther('10'));
    const tx = await fincotekICO.withdraw().then((res: ContractTransaction) => res.wait());
    const gas = tx.cumulativeGasUsed.mul(tx.effectiveGasPrice);
    expect(await provider.getBalance(fincotekICO.address)).to.equal(utils.parseEther('0'));
    expect(await provider.getBalance(wallet.address)).to.equal(oldBalance.add(utils.parseEther('10').sub(gas)));
  });
});