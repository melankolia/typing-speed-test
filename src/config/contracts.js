export const TYPING_STATS_CONTRACT = {
  address: import.meta.env.VITE_CONTRACT_ADDRESS,
  abi: [
    "function addScore(uint256 _wpm, uint256 _accuracy, string memory _category) public",
    "function getHighScores() public view returns (tuple(address player, uint256 wpm, uint256 accuracy, uint256 timestamp, string category)[] memory)",
    "function getPlayerScores(address _player) public view returns (tuple(address player, uint256 wpm, uint256 accuracy, uint256 timestamp, string category)[] memory)",
    "event NewScore(address player, uint256 wpm, uint256 accuracy, string category)"
  ]
}; 