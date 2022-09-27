pragma solidity ^0.8.8;
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract referralSystem is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter public _tokenIds;

    struct referralInfo {
        mapping(uint256 => referralCode) indexToCode;
        mapping(uint256 => uint256) refToIndex;
        uint256 totalIndex;
    }
    struct referralCode {
        uint256 refCode;
        uint256 timeUsed;
        uint256 tokenId;
        //uint256 indexRef;
    }

    uint256 private randomFactor;
    mapping(address => uint256) public userToReferrals; //i referral di un singolo utente
    mapping(uint256 => address) public referralToUser; //rapporto 1 a 1 tra referral e proprietario
    mapping(address => mapping(uint256 => referralCode))
        public addressToReferralCodes;
    mapping(address => referralInfo) public addressToReferralInfos;
    //mapping(uint256 => uint256) public rarityToPrice;
    mapping(uint256 => uint256) public tokenIdToRarity;
    mapping(uint256 => string) public rarityToUri;
    mapping(uint256 => bool) public expired;
    uint256[] private rarities = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    uint256 public refereePercentage = 25;
    address public wallet1;
    address public wallet2;
    address public wallet3;
    address public wallet4;
    address public deadWallet = 0x000000000000000000000000000000000000dEaD;
    uint256 public firstWalletPercentage = 20;
    uint256 public secondWalletPercentage = 20;
    uint256 public thirdWalletPercentage = 20;
    uint256 public fourthWalletPercentage = 15;
    uint256 public nftPrice = 1000000000000000000;
    string public uriBase = "https://ipfs.io/ipfs/";
    uint256 public maxUsageRef = 10;
    string public expiredUri = "expired";
    bool public burnNfts = true;

    event referralCodeCreated(address indexed owner, uint256 referralCode);
    event feesWalletsUpdated(
        address newFirstWalletAddress,
        address newSecondWalletAddress,
        address newThirdWalletAddress,
        address newFourthWalletAddress
    );
    event nftMinted(address owner, uint256 tokenID, uint256 rarity);
    event referralExiperd(uint256 referralNumber, address owner);
    event burnNFTUpdated(bool isBurnNFTActive);
    event feeUpdated(
        uint256 newFirstWalletFee,
        uint256 newSecondWalletFee,
        uint256 nreThirdWalletFee,
        uint256 newFourthWalletFee
    );
    event refereePercentageUpdated(uint256 newRefereePercentage);
    event maxUsageRefereeUpdated(uint256 newMaxUsage);
    event adminGiveaway(
        address indexed receiver,
        uint256 tokenID,
        uint256 referralCode
    );

    constructor() ERC721("", "") {}

    function generateReferralNumber(uint256 tokId) public returns (uint256) {
        uint256 referral = moreRandom() % 1000000; //creation of referral number
        userToReferrals[msg.sender] = referral; //adding the referral to the address mapping
        console.log(
            "CONTRACT - userToReferrals[msg.sender]: ",
            userToReferrals[msg.sender]
        );
        referralToUser[referral] = msg.sender; //adding the address to the referral mapping
        uint256 tempIndex = addressToReferralInfos[msg.sender].totalIndex; //search for how many nft are minted by a single holder
        //if (tempIndex == 0) {
        addressToReferralCodes[msg.sender][tempIndex].refCode = referral; //set generated referral
        addressToReferralCodes[msg.sender][tempIndex].tokenId = tokId; //set the ID of the generated NFT
        addressToReferralInfos[msg.sender].refToIndex[referral] = tempIndex;
        addressToReferralInfos[msg.sender]
            .indexToCode[tempIndex]
            .refCode = referral;
        addressToReferralInfos[msg.sender].totalIndex++;
        /*         } else {
            addressToReferralInfos[msg.sender]
                .indexToCode[tempIndex]
                .refCode = referral;

            addressToReferralInfos[msg.sender].totalIndex++;
            addressToReferralInfos[msg.sender].refToIndex[referral] = tempIndex;
        } */
        emit referralCodeCreated(msg.sender, referral);
        return referral;
    }

    function adminMintReferral(address referralOwner, uint256 tknID)
        private
        returns (uint256)
    {
        uint256 referral = moreRandom() % 1000000;
        console.log(
            "IN CONTRACT -> adminMintReferral(): referral owner: ",
            referralOwner
        );
        console.log("token id: ", tknID);
        console.log("referral generated: ", referral); //tutti referral uguali wtf
        userToReferrals[referralOwner] = referral;
        referralToUser[referral] = referralOwner;
        uint256 tempIndex = addressToReferralInfos[referralOwner].totalIndex;

        addressToReferralCodes[referralOwner][tempIndex].refCode = referral;
        addressToReferralCodes[referralOwner][tempIndex].tokenId = tknID;

        addressToReferralInfos[referralOwner].refToIndex[referral] = tempIndex;
        addressToReferralInfos[referralOwner]
            .indexToCode[tempIndex]
            .refCode = referral;
        addressToReferralInfos[referralOwner].totalIndex++;
        emit referralCodeCreated(referralOwner, referral);
        return referral;
    }

    function adminMint(
        uint256 rarity,
        string memory uri,
        address[] memory receiver
    ) external onlyOwner {
        if (bytes(rarityToUri[rarity]).length > 0) {
            rarityToUri[rarity] = uri;
            for (uint256 y = 0; y < receiver.length; y++) {
                _tokenIds.increment();
                uint256 newItemId = _tokenIds.current();
                _mint(receiver[y], newItemId);
                _setTokenURI(newItemId, uri);
                uint256 referralCodez = adminMintReferral(
                    receiver[y],
                    newItemId
                );
                emit adminGiveaway(receiver[y], newItemId, referralCodez);
            }
        } else {
            for (uint256 i = 0; i < receiver.length; i++) {
                _tokenIds.increment();
                uint256 newItemId = _tokenIds.current();
                _mint(receiver[i], newItemId);
                _setTokenURI(newItemId, rarityToUri[rarity]);
                uint256 referralCodez = adminMintReferral(
                    receiver[i],
                    newItemId
                );
                emit adminGiveaway(receiver[i], newItemId, referralCodez);
            }
        }
    }

    function mintNft(uint256 referral) public payable returns (uint256) {
        address tempReferralOwner = referralToUser[referral]; //who is the owner of the provided referral
        uint256 tempIdx = addressToReferralInfos[tempReferralOwner].refToIndex[
            referral
        ];
        uint256 timeUsed = addressToReferralCodes[tempReferralOwner][tempIdx]
            .timeUsed;
        require(timeUsed < maxUsageRef, "referral exipered");
        if (timeUsed == maxUsageRef - 1) {
            uint256 tempId = addressToReferralCodes[tempReferralOwner][tempIdx]
                .tokenId;
            emit referralExiperd(referral, tempReferralOwner);
            expired[tempId] = true;
            if (burnNfts) {
                _setApprovalForAll(tempReferralOwner, msg.sender, true);
                transferFrom(tempReferralOwner, deadWallet, tempId);
                _setApprovalForAll(tempReferralOwner, msg.sender, false);
            }
        }
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        uint256 tempRar = selectRarity();
        console.log(msg.value, nftPrice);
        require(
            msg.value == nftPrice, /* rarityToPrice[tempRar] */
            "not enough money"
        );
        tokenIdToRarity[newItemId] = tempRar;
        addressToReferralCodes[tempReferralOwner][tempIdx].timeUsed++;

        generateReferralNumber(newItemId);
        _mint(msg.sender, newItemId);

        payable(tempReferralOwner).call{
            value: (msg.value * refereePercentage) / 100
        }("");
        payable(wallet1).call{value: (msg.value * firstWalletPercentage) / 100}(
            ""
        );
        payable(wallet2).call{
            value: (msg.value * secondWalletPercentage) / 100
        }("");
        payable(wallet3).call{value: (msg.value * thirdWalletPercentage) / 100}(
            ""
        );
        payable(wallet4).call{
            value: (msg.value * fourthWalletPercentage) / 100
        }("");
        emit nftMinted(msg.sender, newItemId, tempRar);
        return newItemId;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        if (expired[tokenId]) {
            return string(abi.encodePacked(uriBase, expiredUri));
        } else {
            return
                string(
                    abi.encodePacked(
                        uriBase,
                        rarityToUri[tokenIdToRarity[tokenId]]
                    )
                );
        }
    }

    //utility

    uint256 randIncrement;

    function randint() private returns (uint256) {
        uint256 asd = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.difficulty))
        ) % 420420;
        if (randIncrement > asd) {
            randIncrement += 69;
        } else {
            randIncrement += 420;
        }
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp / randIncrement,
                        (block.timestamp * asd) / (randIncrement * asd)
                    )
                )
            );
    }

    function moreRandom() public returns (uint256) {
        if (randIncrement > randint()) {
            randIncrement -= 420;
        } else {
            randIncrement += 69;
        }
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        randint() / (randIncrement * 6),
                        randint() / (randIncrement * 9)
                    )
                )
            );
    }

    function selectRarity() private returns (uint256) {
        uint256 random = moreRandom() % 10000;
        uint256 rarity;
        uint256 tempRarity = uint256(
            keccak256(abi.encodePacked(block.timestamp + random + randomFactor))
        ) % 10;
        if (tempRarity + 1 < 7) {
            rarity = 1; //comune
        } else if (tempRarity + 1 < 10 && tempRarity + 1 > 6) {
            rarity = 2; //raro
        } else {
            rarity = 3; //super raro
        }
        return rarity;
    }

    //set
    function setUrisAndPrices(
        string[] memory uriList,
        /* uint256[] memory rarityPrices */
        uint256 price
    ) external onlyOwner {
        for (uint256 i = 0; i < uriList.length; i++) {
            rarityToUri[i + 1] = uriList[i];
            //rarityToPrice[i + 1] = rarityPrices[i];
        }
        nftPrice = price;
    }

    function setWalletAddress(
        address newFirstWalletAddress,
        address newSecondWalletAddress,
        address newThirdWalletAddress,
        address newFourthWalletAddress
    ) external onlyOwner {
        wallet1 = newFirstWalletAddress;
        wallet2 = newSecondWalletAddress;
        wallet3 = newThirdWalletAddress;
        wallet4 = newFourthWalletAddress;
        emit feesWalletsUpdated(
            newFirstWalletAddress,
            newSecondWalletAddress,
            newThirdWalletAddress,
            newFourthWalletAddress
        );
    }

    function setBurnNft(bool isBurnNFTActive) external onlyOwner {
        burnNfts = isBurnNFTActive;
        emit burnNFTUpdated(isBurnNFTActive);
    }

    function setFees(
        uint256 newFirstWalletFee,
        uint256 newSecondWalletFee,
        uint256 newThirdWalletFee,
        uint256 newFourthWalletFee
    ) external onlyOwner {
        firstWalletPercentage = newFirstWalletFee;
        secondWalletPercentage = newSecondWalletFee;
        thirdWalletPercentage = newThirdWalletFee;
        fourthWalletPercentage = newFourthWalletFee;
        emit feeUpdated(
            newFirstWalletFee,
            newSecondWalletFee,
            newThirdWalletFee,
            newFourthWalletFee
        );
    }

    function setRefereePercentage(uint256 newRefereePercentage)
        external
        onlyOwner
    {
        refereePercentage = newRefereePercentage;
        emit refereePercentageUpdated(newRefereePercentage);
    }

    function setMaxUsageRef(uint256 newMaxUsage) external onlyOwner {
        maxUsageRef = newMaxUsage;
        emit maxUsageRefereeUpdated(newMaxUsage);
    }

    //get
    function getAddressToReferralInfos(address owner, uint256 index)
        public
        view
        returns (
            uint256 totalIndex,
            uint256 refCode,
            uint256 timeUse
        )
    {
        return (
            addressToReferralInfos[owner].totalIndex,
            addressToReferralInfos[owner].indexToCode[index].refCode,
            addressToReferralInfos[owner].indexToCode[index].timeUsed
        );
    }
}
