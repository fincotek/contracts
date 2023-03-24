import { expect, use } from 'chai';
import { MockProvider, solidity } from 'ethereum-waffle';
import { Contract, utils, Wallet } from 'ethers';
import { deploy, launchpadSend } from './Launchpad';
import LaunchpadContract from '../build/LaunchpadContract.json';

use(solidity);

describe('Launchpad send', function () {
  const provider = new MockProvider();
  const wallets = provider.getWallets();
  const [wallet] = wallets.splice(0, 1);
  let erc20: Contract;
  let contract: Contract;
  let contractAddress: string;

  this.timeout(1000000000);

  beforeEach(async () => {
    const data = await deploy(wallet, {
      tokenSupply: utils.parseEther('1000'),
      softCap: utils.parseEther('1'),
      hardCap: utils.parseEther('1000'),
      minBuy: utils.parseEther('0.1'),
      maxBuy: utils.parseEther('100'),
    });
    erc20 = data.erc20;
    contractAddress = data.launchpadContractAddress;
    contract = new Contract(
      contractAddress,
      LaunchpadContract.abi,
      wallet
    );
  });

  it('Soft cap limit', async () => {
    const wallets = [];
    for (let i = 0; i < 10; i++) {
      const walletCreated = Wallet.createRandom().connect(provider);
      await wallet.sendTransaction({
        to: walletCreated.address,
        value: utils.parseEther('1'),
      });
      wallets.push(walletCreated);
    }

    for (const wallet of wallets) {
      const launchpadContract: Contract = new Contract(
        contractAddress,
        LaunchpadContract.abi,
        wallet
      );
      await launchpadContract.buy({
        value: utils.parseEther('0.1'),
      });
    }

    await contract.finalize();
    expect(await contract.status()).to.equal('Success');
    await launchpadSend(contract);

    for (const wallet of wallets) {
      expect(await erc20.balanceOf(wallet.address)).to.equal(utils.parseEther('0.1'));
    }
  });

  it('Hard cap limit', async () => {
    const wallets = [];
    for (let i = 0; i < 10; i++) {
      const walletCreated = Wallet.createRandom().connect(provider);
      await wallet.sendTransaction({
        to: walletCreated.address,
        value: utils.parseEther('101'),
      });
      wallets.push(walletCreated);
    }

    for (const wallet of wallets) {
      const launchpadContract: Contract = new Contract(
        contractAddress,
        LaunchpadContract.abi,
        wallet
      );
      await launchpadContract.buy({
        value: utils.parseEther('100'),
      });
    }

    await contract.finalize();
    expect(await contract.status()).to.equal('Success');
    await launchpadSend(contract);

    for (const wallet of wallets) {
      expect(await erc20.balanceOf(wallet.address)).to.equal(utils.parseEther('100'));
    }
  });

  it('2047 transactions', async () => {
    const wallets = [];
    for (let i = 0; i < 2047; i++) {
      const walletCreated = Wallet.createRandom().connect(provider);
      await wallet.sendTransaction({
        to: walletCreated.address,
        value: utils.parseEther('1'),
      });
      wallets.push(walletCreated);
    }

    for (const wallet of wallets) {
      const launchpadContract: Contract = new Contract(
        contractAddress,
        LaunchpadContract.abi,
        wallet
      );
      await launchpadContract.buy({
        value: utils.parseEther('0.2'),
      });
    }

    await contract.finalize();
    expect(await contract.status()).to.equal('Success');
    await launchpadSend(contract);

    for (const wallet of wallets) {
      expect(await erc20.balanceOf(wallet.address)).to.equal(utils.parseEther('0.2'));
    }

    await contract.withdraw();
  });
});