import { expect, use } from 'chai';
import { Contract } from 'ethers';
import { deployContract, MockProvider, solidity } from 'ethereum-waffle';
import AuthenticityCompany from '../build/AuthenticityCompany.json';
import AuthenticityProduct from '../build/AuthenticityProduct.json';

use(solidity);

const companyName = 'Chanel';
const companyIdentifier = '54205276600012';

describe('Authenticity Company', function () {
  this.timeout(1000000000);

  const provider = new MockProvider();
  const [wallet, wallet1] = provider.getWallets();
  let authenticityCompany: Contract;
  let authenticityProduct: Contract;

  beforeEach(async () => {
    authenticityCompany = await deployContract(wallet, AuthenticityCompany, [
      companyName,
      companyIdentifier,
      'FR',
    ]);
    authenticityProduct = await deployContract(wallet, AuthenticityProduct, [
      authenticityCompany.address,
      'AS3053 B10658 94305',
      'Petite pochette',
      'Sac à main Chanel Agneau, bois & métal doré Noir',
      'https://urbansapes.fr/media/catalog/product/cache/e045e075335366cdd0f51634113f1b5f/b/a/bag0001-sac_a_main_fashion_imitation_cuir-01.jpg',
      'https://www.chanel.com/fr/mode/p/AS3053B1065894305/petite-pochette-agneau-bois-metal-dore/',
    ]);
  });

  it('Owner', async () => {
    expect(await authenticityCompany.owner()).to.equal(wallet.address);
  });

  it('Company name', async () => {
    expect(await authenticityCompany.name()).to.equal(companyName);
  });

  it('Company identifier', async () => {
    expect(await authenticityCompany.identifier()).to.equal(companyIdentifier);
  });

  it('Product company', async () => {
    expect(await authenticityProduct.company()).to.equal(
      authenticityCompany.address
    );
  });

  it('Product change description', async () => {
    await authenticityProduct.changeDescription('desc');
    expect(await authenticityProduct.description()).to.equal('desc');
  });

  it('Product change image', async () => {
    await authenticityProduct.changeImage('https://fincotek.com/logo');
    expect(await authenticityProduct.image()).to.equal(
      'https://fincotek.com/logo'
    );
  });

  it('Product change link', async () => {
    await authenticityProduct.changeLink('https://fincotek.com');
    expect(await authenticityProduct.link()).to.equal('https://fincotek.com');
  });

  it('Product address(0)', async () => {
    expect(await authenticityProduct.ownerOf(1)).to.equal(
      '0x0000000000000000000000000000000000000000'
    );
  });

  it('Product transfer', async () => {
    const identifier = '0x1837YU5gs44';
    await authenticityProduct.create([identifier]);
    expect(await authenticityProduct.ownerOfIdentifier(identifier)).to.equal(
      wallet.address
    );
    const tokenId = await authenticityProduct.tokenOf(identifier);
    await authenticityProduct.transfer(wallet1.address, tokenId);
    expect(await authenticityProduct.ownerOf(tokenId)).to.equal(
      wallet1.address
    );
  });

  it('Product destroy', async () => {
    const identifier = '0x1837YU5gs44';
    await authenticityProduct.create([identifier]);
    expect(await authenticityProduct.ownerOfIdentifier(identifier)).to.equal(
      wallet.address
    );
    const tokenId = await authenticityProduct.tokenOf(identifier);
    await authenticityProduct.destroy(tokenId);
    expect(await authenticityProduct.ownerOf(tokenId)).to.equal(
      '0x0000000000000000000000000000000000000000'
    );
  });

  it('Product create', async () => {
    const identifiers = [];
    for (let i = 0; i < 100; i++) {
      identifiers.push(`productId${i}`);
    }
    await authenticityProduct.create(identifiers);
    for (let i = 0; i < 100; i++) {
      expect(await authenticityProduct.ownerOf(i + 1)).to.equal(wallet.address);
      expect(await authenticityProduct.identifierOf(i + 1)).to.equal(
        identifiers[i]
      );
      expect(
        await authenticityProduct.ownerOfIdentifier(identifiers[i])
      ).to.equal(wallet.address);
    }
  });
});
