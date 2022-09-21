pragma solidity ^0.8.8;
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract referralCode is Ownable {
    uint256 private randomFactor;
    uint256 public refCode;
    uint256 public timeUsed;
    address public referralSystemAddress;

    event referralSystemAddressUpdated(
        address indexed newReferralSystemAddress
    );

    modifier onlyReferralSystem() {
        require(
            msg.sender == referralSystemAddress,
            "You cannot use this function"
        );
        _;
    }

    constructor() {
        timeUsed = 0;
    }

    function randomness() private returns (uint256) {
        uint256 random = uint256(
            keccak256(abi.encodePacked(block.timestamp + block.difficulty))
        ) % 10000;
        console.log("random: ", random);
        return random;
    }

    function moreRandom() public onlyReferralSystem returns (uint256) {
        randomFactor++;
        uint256 random = randomness();
        uint256 moreRandom = uint256(
            keccak256(abi.encodePacked(block.timestamp + random + randomFactor))
        ) % 1000000;
    }

    function createReferral() public onlyReferralSystem returns (uint256) {
        uint256 random = moreRandom();
        refCode = random;
        return refCode;
    }

    function setReferralSystemAddress(address newReferralSystemAddress)
        public
        onlyOwner
    {
        referralSystemAddress = newReferralSystemAddress;
        emit referralSystemAddressUpdated(referralSystemAddress);
    }
}

contract referralSystem is Ownable, referralCode {
    mapping(address => referralCode[]) public userReferrals; //i referral di un singolo utente
    mapping(referralCode => address) public referralToUser; //rapporto 1 a 1 tra referral e proprietario

    event referralCodeCreated(address indexed owner, uint256 referralCode);

    constructor() {}

    function generateReferralNumber() public {
        referralCode ref = new referralCode();
        uint256 referral = ref.createReferral();
        userReferrals[msg.sender].push(ref);
        referralToUser[ref] = msg.sender;
        emit referralCodeCreated(msg.sender, referral);
    }
}
