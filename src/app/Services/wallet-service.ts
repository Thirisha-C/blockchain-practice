import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  readonly allowedChainId = '0x38';
  readonly allowedNetworkName = 'BNB Smart Chain';
  readonly allowedNetworkParams = {
    chainId: this.allowedChainId,
    chainName: this.allowedNetworkName,
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
  };
  walletAddress = '';

  get ethereum(): any {
    return (window as any).ethereum;
  }

  async connectWallet(): Promise<string | undefined> {
    if (!this.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const accounts = await this.ethereum.request({
        method: 'eth_requestAccounts',
      });

      await this.ensureAllowedNetwork();
      this.walletAddress = accounts?.[0] ?? '';
      return this.walletAddress;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async getChainId(): Promise<string> {
    if (!this.ethereum) return '';
    return await this.ethereum.request({
      method: 'eth_chainId',
    });
  }

  async isAllowedNetwork(): Promise<boolean> {
    const chainId = await this.getChainId();
    return chainId.toLowerCase() === this.allowedChainId.toLowerCase();
  }

  isAllowedChain(chainId: string): boolean {
    return chainId.toLowerCase() === this.allowedChainId.toLowerCase();
  }

  onChainChanged(callback: (chainId: string) => void): () => void {
    if (!this.ethereum?.on) return () => {};

    this.ethereum.on('chainChanged', callback);
    return () => this.ethereum?.removeListener?.('chainChanged', callback);
  }

  async ensureAllowedNetwork(): Promise<void> {
    if (await this.isAllowedNetwork()) return;

    await this.switchToAllowedNetwork();
  }

  async switchToAllowedNetwork(): Promise<void> {
    if (!this.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      await this.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.allowedChainId }],
      });
    } catch (error: any) {
      if (error?.code !== 4902) throw error;

      await this.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [this.allowedNetworkParams],
      });
    }
  }
}
