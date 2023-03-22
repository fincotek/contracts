import { BigNumber, Contract, utils, Wallet } from 'ethers';
import { deployContract } from 'ethereum-waffle';
import ERC20 from '../build/ERC20.json';
import Launchpad from '../build/Launchpad.json';
import LaunchpadContract from '../build/LaunchpadContract.json';
import { formatEther } from '@ethersproject/units/src.ts';

const defaultParams = {
  tokenSupply: utils.parseEther('10000'),
  softCap: utils.parseEther('25'),
  hardCap: utils.parseEther('100'),
  minBuy: utils.parseEther('0.1'),
  maxBuy: utils.parseEther('1'),
  startDate: BigNumber.from(Math.round(Date.now() / 1000).toString()),
  endDate: BigNumber.from(Math.round(Date.now() / 1000 + 3600).toString()),
  burn: false,
};

interface Params {
  tokenSupply?: BigNumber;
  softCap?: BigNumber;
  hardCap?: BigNumber;
  minBuy?: BigNumber;
  maxBuy?: BigNumber;
  startDate?: BigNumber;
  endDate?: BigNumber;
  burn?: boolean;
}

const fee = utils.parseEther('0.01');

export async function init(wallet: Wallet, params: Params) {
  const { erc20, launchpad, launchpadContractAddress } = await deploy(
    wallet,
    params
  );
  const launchpadContract = new Contract(
    launchpadContractAddress,
    LaunchpadContract.abi,
    wallet
  );

  return {
    erc20,
    launchpad,
    launchpadContract,
    launchpadContractAddress,
  };
}

export async function deploy(wallet: Wallet, params: Params) {
  const launchpad = await deployContract(wallet, Launchpad, [fee]);
  const { erc20, launchpadContractAddress } = await deployLaunchpadContract(
    wallet,
    launchpad,
    params
  );
  return {
    erc20,
    launchpad,
    launchpadContractAddress,
  };
}

export async function deployLaunchpad(wallet: Wallet, wallet2: Wallet) {
  const { address } = await deployContract(wallet, Launchpad, [fee]);
  return new Contract(address, Launchpad.abi, wallet2);
}

export async function deployLaunchpadContract(
  wallet: Wallet,
  launchpad: Contract,
  params: Params
) {
  const erc20: Contract = await deployContract(wallet, ERC20, [
    wallet.address,
    'Test',
    'TEST',
    utils.parseUnits('18', 'wei'),
    utils.parseEther('10000000'),
  ]);
  const {
    tokenSupply,
    softCap,
    hardCap,
    minBuy,
    maxBuy,
    startDate,
    endDate,
    burn,
  } = {
    ...defaultParams,
    ...params,
  };
  await erc20.approve(launchpad.address, tokenSupply);
  await launchpad.deploy(
    erc20.address,
    tokenSupply,
    softCap,
    hardCap,
    minBuy,
    maxBuy,
    startDate,
    endDate,
    burn,
    {
      value: fee,
    }
  );
  const launchpadContractAddress = await launchpad.contractOf(erc20.address);
  return {
    erc20,
    launchpadContractAddress,
  };
}
