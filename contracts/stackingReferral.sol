//SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract stakingReferral is Ownable {
    struct stakInfo {
        uint256 nftID;
        uint256 lockStartBlockId;
        uint256 lastClaimBlockId;
        uint256 lockTime;
        uint256 lockedAt;
        /* uint256 calculatedReward;
        uint256 lastRewardsCalculatedAt; */
    }
    /* bool public isPoolOnline = false;
    bool public areDepositActive = false; */
    uint256 public rewardPerBlock;
    uint256 public minimumLockTime;
    uint256 public minimumLockBeforeClaim;
    address public referralNFTaddress;
    address public rewardTokenAddress;

    mapping(address => stakInfo) addressToStaking;

    event poolFunded(uint256 amount);
    event userDeposit(address indexed userAddress, uint256 nftID);
    event userWithdrawn(
        address indexed userAddress,
        uint256 nftID,
        uint256 amount
    );
    event userClaim(address indexed userAddress, uint256 claimAmount);
    event rewardPerBlockUpdated(uint256 newRewardPerBlock);
    //event depositActiveUpdated(bool areDepositActive);
    event poolInitialized(
        //bool isPoolOnline,
        uint256 rewardPerBlock,
        uint256 minimumLockTime,
        uint256 minimumLockBeforeClaim,
        address referralNFTaddress,
        address rewardTokenAddress
    );
    event minimumLockTimeUpdated(uint256 newMinimumLockTime);
    event referralNftAddressUpdated(address indexed newReferralNftAddress);
    event rewardTokenAddressUpdated(address indexed newRewardTokenAddress);
    event minimumLockBeforeClaimUpdated(uint256 _newMinimumLockTimeBeforeClaim);

    constructor() {}

    function deposit(uint256 nftId, uint256 _lockTime) external {
        /* require(
            areDepositActive,
            "deposit on staking platform are not active yet"
        ); */
        /* console.log("CONTRACT -> depoisit() NFT ID: ", nftId);
        console.log(
            "CONTRACT => balanceOf: ",
            referralCode(referralNFTaddress).balanceOf(msg.sender)
        ); */
        require(
            msg.sender == referralCode(referralNFTaddress).ownerOf(nftId),
            "You are not the owner of the nft"
        );
        require(
            _lockTime >= minimumLockTime,
            "inserted lock time below the minimum lock time"
        );
        addressToStaking[msg.sender].nftID = nftId;
        addressToStaking[msg.sender].lockTime = _lockTime;
        addressToStaking[msg.sender].lockStartBlockId = block.number;
        addressToStaking[msg.sender].lastClaimBlockId = block.number;
        addressToStaking[msg.sender].lockedAt = block.timestamp;
        referralCode(referralNFTaddress).transferFrom(
            msg.sender,
            address(this),
            nftId
        );
        /* console.log(
            "CONTRACT => balanceOf: ",
            referralCode(referralNFTaddress).balanceOf(msg.sender)
        ); */
        emit userDeposit(msg.sender, nftId);
    }

    function calculateReward() external view returns (uint256) {
        require(
            addressToStaking[msg.sender].nftID > 0,
            "You have not deposited NFTs"
        );
        uint256 currentBlock = block.number;
        uint256 lastClaimBlockId = addressToStaking[msg.sender]
            .lastClaimBlockId;
        uint256 passedBlocks = currentBlock - lastClaimBlockId;
        uint256 reward = passedBlocks * rewardPerBlock;
        /*  addressToStaking[msg.sender].calculatedReward = reward;
        addressToStaking[msg.sender].lastRewardsCalculatedAt = block.timestamp; */
        //console.log("CONTRACT => reward value: ", reward);
        return reward;
    }

    function internalCalculateReward(address owner) private returns (uint256) {
        uint256 currentBlock = block.number;
        uint256 lastClaimBlockId = addressToStaking[owner].lastClaimBlockId;
        uint256 passedBlocks = currentBlock - lastClaimBlockId;
        uint256 reward = passedBlocks * rewardPerBlock;
        /* console.log(
            "CONTRACT: internalCalculateReward => currentBlock",
            currentBlock
        );
        console.log(
            "CONTRACT: internalCalculateReward => lastClaimBlockId",
            lastClaimBlockId
        );
        console.log(
            "CONTRACT: internalCalculateReward => passedBlocks",
            passedBlocks
        );
        console.log("CONTRACT: internalCalculateReward => reward", reward); */
        /* addressToStaking[owner].calculatedReward = reward;
        addressToStaking[owner].lastRewardsCalculatedAt = block.timestamp; */

        addressToStaking[msg.sender].lastClaimBlockId = block.number;
        return reward;
    }

    function claimReward() external {
        require(
            addressToStaking[msg.sender].nftID > 0,
            "You have not deposited NFTs"
        );
        require(
            block.timestamp >
                addressToStaking[msg.sender].lockedAt + minimumLockBeforeClaim,
            "You cannot claim yet"
        );
        uint256 pendingReward = internalCalculateReward(msg.sender);
        IBEP20(rewardTokenAddress).transfer(msg.sender, pendingReward);
        emit userClaim(msg.sender, pendingReward);
    }

    function withdraw() external {
        require(addressToStaking[msg.sender].nftID > 0, "Nothing to withdraw");
        uint256 nftId = addressToStaking[msg.sender].nftID;
        uint256 startLock = addressToStaking[msg.sender].lockedAt;
        uint256 passedTime = block.timestamp - startLock;
        require(passedTime > minimumLockTime - 1, "You cannot withdraw yet");
        uint256 pendingReward = internalCalculateReward(msg.sender);
        delete addressToStaking[msg.sender];
        referralCode(referralNFTaddress).transferFrom(
            address(this),
            msg.sender,
            nftId
        );
        IBEP20(rewardTokenAddress).transfer(msg.sender, pendingReward);
        emit userWithdrawn(msg.sender, nftId, pendingReward);
    }

    function fundPool(uint256 amount) external onlyOwner {
        bool success = IBEP20(rewardTokenAddress).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        require(success);
        emit poolFunded(amount);
    }

    function initializePool(
        //bool _isPoolOnline,
        uint256 _rewardPerBlock,
        uint256 _minimumLockTime,
        uint256 _minimumLockBeforeClaim,
        address _referralNftAddress,
        address _rewardTokenAddress
    ) external onlyOwner {
        //isPoolOnline = _isPoolOnline;
        rewardPerBlock = _rewardPerBlock;
        minimumLockTime = _minimumLockTime;
        minimumLockBeforeClaim = _minimumLockBeforeClaim;
        referralNFTaddress = _referralNftAddress;
        rewardTokenAddress = _rewardTokenAddress;
        emit poolInitialized(
            //_isPoolOnline,
            _rewardPerBlock,
            _minimumLockTime,
            minimumLockBeforeClaim,
            _referralNftAddress,
            _rewardTokenAddress
        );
    }

    /* function setAreDepositActive(bool _areDepositActive) external onlyOwner {
        areDepositActive = _areDepositActive;
        emit depositActiveUpdated(_areDepositActive);
    } */

    function setRewardPerBlock(uint256 newRewardPerBlock) external onlyOwner {
        rewardPerBlock = newRewardPerBlock;
        emit rewardPerBlockUpdated(newRewardPerBlock);
    }

    function setMinimumLockTime(uint256 newMinimumLockTime) external onlyOwner {
        minimumLockTime = newMinimumLockTime;
        emit minimumLockTimeUpdated(newMinimumLockTime);
    }

    function setReferralNFTAddress(address newReferralNftAddress)
        external
        onlyOwner
    {
        referralNFTaddress = newReferralNftAddress;
        emit referralNftAddressUpdated(newReferralNftAddress);
    }

    function setRewardTokenAddress(address newRewardTokenAddress)
        external
        onlyOwner
    {
        rewardTokenAddress = newRewardTokenAddress;
        emit rewardTokenAddressUpdated(newRewardTokenAddress);
    }

    function setMinimumLockBeforeClaim(uint256 _newMinimumLockTimeBeforeClaim)
        external
        onlyOwner
    {
        minimumLockBeforeClaim = _newMinimumLockTimeBeforeClaim;
        emit minimumLockBeforeClaimUpdated(_newMinimumLockTimeBeforeClaim);
    }

    //BETTER SAFE THAN SORRY
    function retrieveForeignToken(
        address _token,
        address _to,
        uint256 _value
    ) external onlyOwner returns (bool _sent) {
        if (_value == 0) {
            _value = IBEP20(_token).balanceOf(address(this));
        }
        _sent = IBEP20(_token).transfer(_to, _value);
    }

    function sweep() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}

interface referralCode {
    function ownerOf(uint256 tokenId) external view returns (address);

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    function balanceOf(address owner) external view returns (uint256 balance);
}

interface IBEP20 {
    function totalSupply() external view returns (uint256);

    function decimals() external view returns (uint8);

    function symbol() external view returns (string memory);

    function name() external view returns (string memory);

    function getOwner() external view returns (address);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function allowance(address _owner, address spender)
        external
        view
        returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}
