import { ethers } from 'ethers';
import { createWeb3Modal } from '@web3modal/wagmi';
import { sepolia } from 'viem/chains';

const CONTRACT_ADDRESS = 'your_deployed_contract_address';
const CONTRACT_ABI = [
  "function addScore(uint256 _wpm, uint256 _accuracy, string memory _category) public",
  "function getHighScores() public view returns (tuple(address player, uint256 wpm, uint256 accuracy, uint256 timestamp, string category)[] memory)",
  "function getPlayerScores(address _player) public view returns (tuple(address player, uint256 wpm, uint256 accuracy, uint256 timestamp, string category)[] memory)",
  "event NewScore(address player, uint256 wpm, uint256 accuracy, string category)"
];

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

    this.web3Modal = createWeb3Modal({
      wagmiConfig: {
        chains: [sepolia], // Use Sepolia testnet
        projectId: 'YOUR_WALLETCONNECT_PROJECT_ID' // Get this from cloud.walletconnect.com
      }
    });

    this.initialized = true;
  }

  async connect() {
    await this.initialize();
    await this.web3Modal.open();
    
    if (window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        this.signer
      );
    }
  }

  async saveScore(wpm, accuracy, category) {
    if (!this.contract) await this.connect();
    
    try {
      const tx = await this.contract.addScore(wpm, accuracy, category);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error saving score:', error);
      return false;
    }
  }

  async getHighScores() {
    if (!this.contract) await this.connect();
    
    try {
      const scores = await this.contract.getHighScores();
      return scores.map(this.formatScore);
    } catch (error) {
      console.error('Error getting high scores:', error);
      return [];
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