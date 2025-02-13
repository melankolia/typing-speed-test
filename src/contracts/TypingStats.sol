// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TypingStats {
    struct Score {
        address player;
        uint256 wpm;
        uint256 accuracy;
        uint256 timestamp;
        string category;
    }

    Score[] public highScores;
    mapping(address => Score[]) public playerScores;

    event NewScore(address player, uint256 wpm, uint256 accuracy, string category);

    function addScore(uint256 _wpm, uint256 _accuracy, string memory _category) public {
        Score memory newScore = Score({
            player: msg.sender,
            wpm: _wpm,
            accuracy: _accuracy,
            timestamp: block.timestamp,
            category: _category
        });

        highScores.push(newScore);
        playerScores[msg.sender].push(newScore);

        emit NewScore(msg.sender, _wpm, _accuracy, _category);
    }

    function getHighScores() public view returns (Score[] memory) {
        return highScores;
    }

    function getPlayerScores(address _player) public view returns (Score[] memory) {
        return playerScores[_player];
    }
} 