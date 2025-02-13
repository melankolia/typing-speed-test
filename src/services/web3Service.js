import { ethers } from 'ethers';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { sepolia } from 'viem/chains';
import { TYPING_STATS_CONTRACT } from '@/config/contracts';

// Use environment variable for projectId
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex

const metadata = {
  name: 'Typing Speed Test',
  description: 'A Web3 Typing Speed Test App',
  url: 'https://your-website.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.web3Modal = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    const wagmiConfig = defaultWagmiConfig({
      chains: [sepolia],
      projectId,
      metadata
    });

    this.web3Modal = createWeb3Modal({
      wagmiConfig,
      projectId,
      chains: [sepolia]
    });

    if (window.ethereum) {
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
    }

    this.initialized = true;
  }

  async handleChainChanged(chainId) {
    if (chainId !== SEPOLIA_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
      } catch (error) {
        if (error.code === 4902) {
          await this.addSepoliaNetwork();
        }
      }
    }
    await this.resetConnection();
  }

  async handleAccountsChanged() {
    await this.resetConnection();
  }

  async addSepoliaNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: SEPOLIA_CHAIN_ID,
          chainName: 'Sepolia Test Network',
          nativeCurrency: {
            name: 'Sepolia ETH',
            symbol: 'SEP',
            decimals: 18
          },
          rpcUrls: [`https://sepolia.infura.io/v3/${projectId}`],
          blockExplorerUrls: ['https://sepolia.etherscan.io']
        }]
      });
    } catch (error) {
      console.error('Error adding Sepolia network:', error);
    }
  }

  async resetConnection() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }

  async ensureSepoliaNetwork() {
    if (!window.ethereum) return false;
    
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== SEPOLIA_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
        return true;
      } catch (error) {
        if (error.code === 4902) {
          await this.addSepoliaNetwork();
          return true;
        }
        console.error('Error switching to Sepolia:', error);
        return false;
      }
    }
    return true;
  }

  async connect() {
    await this.initialize();
    await this.web3Modal.open();
    
    if (window.ethereum) {
      await this.ensureSepoliaNetwork();
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.contract = new ethers.Contract(
        TYPING_STATS_CONTRACT.address,
        TYPING_STATS_CONTRACT.abi,
        this.signer
      );
    }
  }

  async getHighScores() {
    try {
      if (!this.contract) await this.connect();
      await this.ensureSepoliaNetwork();
      
      const scores = await this.contract.getHighScores();
      return scores.map(this.formatScore);
    } catch (error) {
      console.error('Error getting high scores:', error);
      return [];
    }
  }

  async saveScore(wpm, accuracy, category) {
    try {
      if (!this.contract) await this.connect();
      await this.ensureSepoliaNetwork();
      
      const tx = await this.contract.addScore(wpm, accuracy, category);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error saving score:', error);
      return false;
    }
  }

  formatScore(score) {
    return {
      player: score.player,
      wpm: Number(score.wpm),
      accuracy: Number(score.accuracy),
      timestamp: new Date(Number(score.timestamp) * 1000),
      category: score.category
    };
  }
}

export const web3Service = new Web3Service(); 