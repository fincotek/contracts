import { expect, use } from 'chai';
import { Contract, utils } from 'ethers';
import { MockProvider, solidity } from 'ethereum-waffle';
import { deployLaunchpad, deployLaunchpadContract } from './Launchpad';
import LaunchpadContract from '../build/LaunchpadContract.json';

use(solidity);

describe('Launchpad finalize', () => {
  const wallets = new MockProvider().getWallets();

  it('Success', async () => {
    const [wallet1, wallet2] = wallets.splice(0, 2);
    const nbWallets = wallets.length;
    const min = 4;
    const tokenSupply = utils.parseEther('98453');
    const softCap = utils.parseEther(nbWallets.toString());
    const hardCap = utils.parseEther((nbWallets * 4).toString());
    const minBuy = utils.parseEther('1');
    const maxBuy = utils.parseEther((min + 1).toString());

    const data = await deployLaunchpadContract(
      wallet2,
      await deployLaunchpad(wallet1, wallet2),
      {
        tokenSupply,
        minBuy,
        maxBuy,
        softCap,
        hardCap,
      }
    );

    const { erc20, launchpadContractAddress } = data;

    const values = [];
    for (const wallet of wallets) {
      const launchpadContract: Contract = new Contract(
        launchpadContractAddress,
        LaunchpadContract.abi,
        wallet
      );
      const value = utils.parseEther((Math.random() * min + 1).toString());
      await launchpadContract.buy({
        value,
      });
      expect(await launchpadContract.balanceOf(wallet.address)).to.equal(value);
      values.push(value);
    }

    const launchpadContract = new Contract(
      launchpadContractAddress,
      LaunchpadContract.abi,
      wallet1
    );

    expect(await launchpadContract.creator()).to.equal(wallet1.address);
    expect(await launchpadContract.owner()).to.equal(wallet2.address);

    const total = values.reduce((a, v) => v.add(a));
    const fee = total.div('20');
    const balance1 = (await wallet1.getBalance()).add(fee);
    const balance2 = (await wallet2.getBalance()).add(total.sub(fee));
    const walletToken = await erc20.balanceOf(wallet2.address);
    let gas = await launchpadContract.finalize().then(response => {
      return response.wait();
    }).then(tx => tx.cumulativeGasUsed.mul(tx.effectiveGasPrice));

    expect(await launchpadContract.status()).to.equal('Success');

    gas = gas.add(await launchpadContract.send().then(response => {
      return response.wait();
    }).then(tx => tx.cumulativeGasUsed.mul(tx.effectiveGasPrice)));

    let sum;
    for (const index in wallets) {
      const wallet = wallets[index];
      const token = values[index]
        .mul(tokenSupply.mul((10 ** 18).toString()).div(hardCap))
        .div((10 ** 18).toString());
      if (!sum) {
        sum = token;
      } else {
        sum = sum.add(token);
      }
      expect(await erc20.balanceOf(wallet.address))
        .to.equal(token)
        .to.equal(await launchpadContract.tokenOf(wallet.address));
    }

    gas = gas.add(await launchpadContract.withdraw().then(response => {
      return response.wait();
    }).then(tx => tx.cumulativeGasUsed.mul(tx.effectiveGasPrice)));

    const value = (await erc20.balanceOf(wallet2.address)).sub(walletToken);
    expect(tokenSupply).to.equal(sum.add(value));
    expect(await wallet1.getBalance()).to.equal(balance1.sub(gas));
    expect(await wallet2.getBalance()).to.equal(balance2);

    let error: Error;
    try {
      await launchpadContract.buy({
        value: utils.parseEther('0.1'),
      });
    } catch (e) {
      error = e;
    }
    expect(error instanceof Error).to.equal(true);
  });

  it('Cancel', async () => {
    const [wallet1, wallet2] = wallets.splice(0, 2);
    const nbWallets = wallets.length;
    const min = 4;
    const tokenSupply = utils.parseEther('1000');
    const softCap = utils.parseEther(nbWallets.toString());
    const hardCap = utils.parseEther((nbWallets * 4).toString());
    const minBuy = utils.parseEther('1');
    const maxBuy = utils.parseEther((min + 1).toString());

    const data = await deployLaunchpadContract(
      wallet2,
      await deployLaunchpad(wallet1, wallet2),
      {
        tokenSupply,
        minBuy,
        maxBuy,
        softCap,
        hardCap,
      }
    );

    const { erc20, launchpadContractAddress } = data;

    const balances = [];
    const values = [];
    for (const wallet of wallets) {
      const launchpadContract = new Contract(
        launchpadContractAddress,
        LaunchpadContract.abi,
        wallet
      );
      const value = utils.parseEther((Math.random() * min + 1).toString());
      await launchpadContract.buy({
        value,
      });
      expect(await launchpadContract.balanceOf(wallet.address)).to.equal(value);
      balances.push(await wallet.getBalance());
      values.push(value);
    }

    const launchpadContract = new Contract(
      launchpadContractAddress,
      LaunchpadContract.abi,
      wallet2
    );

    expect(await launchpadContract.creator()).to.equal(wallet1.address);
    expect(await launchpadContract.owner()).to.equal(wallet2.address);

    await launchpadContract.cancel();
    await launchpadContract.send();
    await launchpadContract.withdraw();

    expect(await launchpadContract.status()).to.equal('Cancel');
    expect(await erc20.balanceOf(wallet2.address)).to.equal(
      await erc20.totalSupply()
    );

    for (const index in wallets) {
      const wallet = wallets[index];
      const balance = balances[index];
      const value = values[index];
      expect(await wallet.getBalance()).to.equal(balance.add(value));
    }
  });

  it('Fail', async () => {
    const [wallet1, wallet2] = wallets;
    const tokenSupply = utils.parseEther('1000');
    const softCap = utils.parseEther('10');
    const hardCap = utils.parseEther('20');
    const minBuy = utils.parseEther('1');
    const maxBuy = utils.parseEther('10');

    const data = await deployLaunchpadContract(
      wallet2,
      await deployLaunchpad(wallet1, wallet2),
      {
        tokenSupply,
        minBuy,
        maxBuy,
        softCap,
        hardCap,
      }
    );

    const { erc20, launchpadContractAddress } = data;

    const launchpadContract2 = new Contract(
      launchpadContractAddress,
      LaunchpadContract.abi,
      wallet2
    );

    const value = utils.parseEther('9.99999999999999');
    await launchpadContract2.buy({
      value,
    });
    const balance = await wallet2.getBalance();

    const launchpadContract = new Contract(
      launchpadContractAddress,
      LaunchpadContract.abi,
      wallet1
    );

    expect(await launchpadContract.creator()).to.equal(wallet1.address);
    expect(await launchpadContract.owner()).to.equal(wallet2.address);

    await launchpadContract.finalize();
    await launchpadContract.send();
    await launchpadContract.withdraw();

    expect(await launchpadContract.status()).to.equal('Fail');
    expect(await erc20.balanceOf(wallet2.address)).to.equal(
      await erc20.totalSupply()
    );
    expect(await wallet2.getBalance()).to.equal(balance.add(value));
  });
});
