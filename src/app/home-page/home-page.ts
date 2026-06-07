import { CommonModule } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../Services/wallet-service';
import { ContractService } from '../Services/contract-service';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage implements OnInit, OnDestroy {
  walletAddress = signal('');
  name = signal('');
  currentName = signal('');
  wrongNetwork = signal(false);
  connecting = signal(false);
  settingName = signal(false);
  gettingName = signal(false);
  statusMessage = signal('');

  showConnectionModal = signal(false);
  errorMessage = signal<string | null>(null);
  private removeChainChangedListener: (() => void) | null = null;
  private removeAccountsChangedListener: (() => void) | null = null;

  constructor(
    private walletService: WalletService,
    private contractService: ContractService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.removeChainChangedListener =
      this.walletService.onChainChanged((chainId) => {

        this.ngZone.run(() =>
          this.updateNetworkStatus(chainId)
        );

      });


    this.removeAccountsChangedListener =
      this.walletService.onAccountsChanged((accounts) => {

        this.ngZone.run(() => {

          const address = accounts?.[0] ?? '';

          this.walletAddress.set(address);

        });

      });
  }
  ngOnDestroy() {
    this.removeChainChangedListener?.();
  }

  openConnectModal() {
    this.showConnectionModal.set(true);
    this.errorMessage.set(null);
  }

  closeConnectModal() {
    this.showConnectionModal.set(false);
    this.connecting.set(false);
    this.errorMessage.set(null);
  }

  async selectWallet(wallet: string) {
    if (wallet !== 'metamask') {
      this.errorMessage.set('Please use MetaMask.');
      return;
    }

    try {
      this.connecting.set(true);

      const address = await this.walletService.connectWallet();
      if (!address) return;

      this.walletAddress.set(address);
      this.wrongNetwork.set(false);
      this.statusMessage.set('Wallet connected.');
      this.showConnectionModal.set(false);
    } catch (error: any) {
      console.error(error);
      this.errorMessage.set(error?.message ?? `Please switch to ${this.walletService.allowedNetworkName}.`);
    } finally {
      this.connecting.set(false);
    }
  }

  disconnectWallet() {
    this.walletAddress.set('');
    this.name.set('');
    this.wrongNetwork.set(false);
    this.statusMessage.set('Wallet disconnected.');
  }

  private updateNetworkStatus(chainId: string) {
    const wrongNetwork = !this.walletService.isAllowedChain(chainId);

    this.wrongNetwork.set(wrongNetwork);
    this.statusMessage.set(
      wrongNetwork
        ? `Please switch to ${this.walletService.allowedNetworkName}.`
        : `${this.walletService.allowedNetworkName} connected.`
    );
  }

  async setName() {
    const currentName = this.name().trim();

    if (!currentName) {
      alert('Enter Name');
      return;
    }

    try {
      this.settingName.set(true);
      await this.walletService.ensureAllowedNetwork();
      await this.contractService.setName(currentName);
      this.statusMessage.set('Name saved in contract.');
    } catch (error) {
      console.error(error);
      this.statusMessage.set('Set name failed.');
    } finally {
      this.settingName.set(false);
    }
  }

  async getName() {
    try {
      this.gettingName.set(true);
      await this.walletService.ensureAllowedNetwork();
this.currentName.set(
  await this.contractService.getName()
);      this.statusMessage.set('Name loaded from contract.');
    } catch (error) {
      console.error(error);
      this.statusMessage.set('Get name failed.');
    } finally {
      this.gettingName.set(false);
    }
  }
}
