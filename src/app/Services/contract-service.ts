import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import nameAbi from '../Contracts/name_abi.json';
import { WalletService } from './wallet-service';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  readonly contractAddress = '0x8cf1B9e472A2E4F23d61033887A99d97dc940099';

  constructor(private walletService: WalletService) {}

  private async getContract(withSigner = false) {
    const ethereum = this.walletService.ethereum;

    if (!ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.BrowserProvider(ethereum);
    const runner = withSigner ? await provider.getSigner() : provider;
    return new ethers.Contract(this.contractAddress, nameAbi as any, runner);
  }

  async getName(): Promise<string> {
    const contract = await this.getContract();
    return await (contract as any)['getName']();
  }

  async setName(name: string) {
    const contract = await this.getContract(true);
    const tx = await (contract as any)['setName'](name);
    console.log('Transaction Hash:', tx.hash);
    await tx.wait();
    console.log('Transaction Success');
    return tx;
  }
}
