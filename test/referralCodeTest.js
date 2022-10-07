const { ethers } = require("hardhat")
const { expect, assert } = require("chai")
const { idText } = require("typescript")
const pancake_router_abi = require("../abi/pancake.json")
const pancake_factory_abi = require("../abi/pancake_factory.json")
const pancake_pair_abi = require("../abi/pancake_pair.json")
const { testUtils } = require("./test_utils")
describe("ReferralSystem test", function () {
    let referralSystem
    let referralSystemAddress
    let owner = ethers.provider.getSigner(0)
    let ownerAddress = owner.getAddress()
    let frtWallet = ethers.provider.getSigner(1)
    let frstWlt_address = frtWallet.getAddress()
    let scndWallet = ethers.provider.getSigner(2)
    let scndWlt_address = scndWallet.getAddress()
    let thrdWallet = ethers.provider.getSigner(3)
    let thrdWlt_address = thrdWallet.getAddress()
    let frthWallet = ethers.provider.getSigner(4)
    let frthWlt_address = frthWallet.getAddress()
    let addressList = []
    let referralList = []
    let nftPrice
    let deadWallet = "0x000000000000000000000000000000000000dead"
    let pancake_router_address = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
    let token
    let tokenAddress
    let pancake_router
    let staking
    let stakingAddress
    let WETH
    let decimals = 9

    it("Deploying referral system: ", async function () {
        const refSys = await ethers.getContractFactory("referralSystem", owner)
        referralSystem = await refSys.deploy()
        referralSystemAddress = referralSystem.address
        console.log("Referral system deployed: ", referralSystem.address)
        console.log("__________________________________________________")
    })
    describe("Initialization of the system: ", async function () {
        it("Setting fee wallet address", async function () {
            await referralSystem.setWalletAddress(
                frstWlt_address,
                scndWlt_address,
                thrdWlt_address,
                frthWlt_address
            )
            let firstW = await referralSystem.wallet1()
            let secondW = await referralSystem.wallet2()
            let thridW = await referralSystem.wallet3()
            let fourthW = await referralSystem.wallet4()
            console.log(
                "Wallet saved in contract:\nWallet 1: ",
                firstW,
                "\nWallet 2: ",
                secondW,
                "\nWallet 3: ",
                thridW,
                "\nWallet 4: ",
                fourthW
            )
            expect(firstW).to.equal((await frstWlt_address).toString())
            expect(secondW).to.equal((await scndWlt_address).toString())
            expect(thridW).to.equal((await thrdWlt_address).toString())
            expect(fourthW).to.equal((await frthWlt_address).toString())
        })
        it("Setting URIs and prices", async function () {
            let uriList = ["raro", "superraro", "ultrararo"]
            let price = "1500000000000000000" //1500000000000000000
            await referralSystem.setUrisAndPrices(uriList, price)
            let firstUri = await referralSystem.rarityToUri(1)
            let secondUri = await referralSystem.rarityToUri(2)
            let thirdUri = await referralSystem.rarityToUri(3)
            console.log(
                "Retrieved URIs: ",
                firstUri,
                ", ",
                secondUri,
                ", ",
                thirdUri
            )
            expect(firstUri).to.equal(uriList[0])
            expect(secondUri).to.equal(uriList[1])
            expect(thirdUri).to.equal(uriList[2])

            nftPrice = await referralSystem.nftPrice()
            console.log("Retrieved price: ", nftPrice)
            expect(nftPrice.toString()).to.equal(price)
        })
        it("Setting fees", async function () {
            let firstFee = 15
            let secondFee = 15
            let thirdFee = 15
            let fourthFee = 30
            await referralSystem.setFees(
                firstFee,
                secondFee,
                thirdFee,
                fourthFee
            )
            let fFee = await referralSystem.firstWalletPercentage()
            let sFee = await referralSystem.secondWalletPercentage()
            let tFee = await referralSystem.thirdWalletPercentage()
            let fhFee = await referralSystem.fourthWalletPercentage()
            console.log(
                "Retrieved fee: ",
                fFee,
                ", ",
                sFee,
                ", ",
                tFee,
                ", ",
                fhFee
            )
            expect(firstFee).to.equal(fFee)
            expect(secondFee).to.equal(sFee)
            expect(thirdFee).to.equal(tFee)
            expect(fourthFee).to.equal(fhFee)
        })
        it("Setting referee percentage", async function () {
            let refereePercentage = 15
            await referralSystem.setRefereePercentage(refereePercentage)
            let rPerc = await referralSystem.refereePercentage()
            console.log("Retrieved referee percentage: ", rPerc)
            expect(rPerc).to.equal(refereePercentage)
            console.log("Referall System initialized sucessfully!")
            console.log("____________________________________________________")
        })

        describe("testing the referral logic", function () {
            /*   it("testing moreRandom()", async function () {
                for (let i = 0; i < 10; i++) {
                    let moreRandom =
                        await referralSystem.callStatic.moreRandom()
                    console.log("moreRandom() result: ", moreRandom)
                    await network.provider.send("evm_increaseTime", [5])
                    await network.provider.send("evm_mine")
                }
            }) */
            it("testing admin mint function ", async function () {
                for (let i = 0; i < 20; i++) {
                    //popolo lista address
                    tempUser = ethers.provider.getSigner(i + 5)
                    addressList[i] = await tempUser.getAddress()
                    //console.log("Temp address: ", addressList[i])
                }
                await referralSystem.adminMint(1, addressList) //mint
                for (let i = 0; i < addressList.length; i++) {
                    // popolo lista referral
                    referralList[i] = await referralSystem.userToReferrals(
                        addressList[i]
                    )
                }
                for (let i = 0; i < addressList.length; i++) {
                    let balanceOf = await referralSystem.balanceOf(
                        addressList[i]
                    )
                    let referral = await referralSystem.userToReferrals(
                        addressList[i]
                    )
                    console.log(
                        "The address ",
                        addressList[i],
                        " owns this number of NFTs ",
                        balanceOf,
                        " and has this referral number: ",
                        referral
                    )
                }
                for (let i = 0; i < addressList.length; i++) {
                    let tempReferral = await referralSystem.userToReferrals(
                        addressList[i]
                    )
                    let tempAddress = await referralSystem.referralToUser(
                        tempReferral
                    )
                    expect(tempAddress).to.equal(addressList[i])
                    expect(tempReferral).to.equal(referralList[i])
                }
                console.log("NFTs minted and sent successfully")
                console.log("____________________________________________")
            })

            it("testing burn after ten uses", async function () {
                let randomUser = Math.floor(Math.random() * addressList.length)
                let referralToUse = await referralSystem.userToReferrals(
                    addressList[randomUser]
                )
                let referralOwner = await referralSystem.referralToUser(
                    referralToUse
                )
                console.log(
                    "referral selected: ",
                    referralToUse,
                    "\nreferral owner: ",
                    referralOwner
                )
                let ownerBnbBalance = await ethers.provider.getBalance(
                    referralOwner
                )
                console.log("referralOwner bnb balance: ", ownerBnbBalance)
                let nftPrice2 = await referralSystem.nftPrice()
                console.log("nft price: ", nftPrice2)
                for (let i = 0; i < 10; i++) {
                    let buyer = ethers.provider.getSigner(i + 25)
                    let buyerAddress = buyer.getAddress()
                    let buyNft = await referralSystem
                        .connect(buyer)
                        .mintNft(referralToUse, {
                            value: "1500000000000000000",
                        })
                    let ownerBalanceAfterBuy = await ethers.provider.getBalance(
                        referralOwner
                    )
                    console.log(
                        "owner balance after ",
                        i + 1,
                        " buys: ",
                        ownerBalanceAfterBuy
                    )
                    let frstWalletBal = await ethers.provider.getBalance(
                        frstWlt_address
                    )
                    console.log("first wallet balance: ", frstWalletBal)
                    expect(Number(ownerBalanceAfterBuy)).to.be.greaterThan(
                        Number(ownerBnbBalance)
                    )
                }
                let nftBalanceOwner = await referralSystem.balanceOf(
                    referralOwner
                )
                let nftBalanceDead = await referralSystem.balanceOf(deadWallet)
                console.log(
                    "referral owner nft balance after 10 buys: ",
                    nftBalanceOwner,
                    "\ndead wallet balance after 10 buys: ",
                    nftBalanceDead
                )
                expect(Number(nftBalanceDead)).to.be.greaterThan(
                    Number(nftBalanceOwner)
                )
            })
        })
    })
    describe("deploying reward token", function () {
        it("Token init", async function () {
            const Token = await ethers.getContractFactory("rewardtoken", owner)
            token = await Token.deploy()
            console.log("Token deplyed at: ", token.address)
            let ownerBal = await token.balanceOf(ownerAddress)
            let totalSupply = await token.totalSupply()
            console.log(
                "ownerBalance: ",
                ownerBal,
                "\ntotalSupply",
                totalSupply
            )
            expect(ownerBal).to.equal(totalSupply)
        })
        it("adding liquidity to pancake", async function () {
            let tokenAmount = await token.balanceOf(ownerAddress)
            console.log(
                "Owner balance: ",
                ethers.utils.commify(
                    ethers.utils
                        .formatUnits(tokenAmount.toString(), decimals)
                        .toString()
                )
            )
            let amountTokenDesired = "54000000000000000"
            let amountTokenMin = "54000000000000000"
            let amountETHMin = "10000000000000000000"
            let to = ownerAddress
            tokenAddress = token.address
            let deadLine = Date.now() + 60
            const Pancake_router = new ethers.Contract(
                pancake_router_address,
                pancake_router_abi,
                owner
            )
            pancake_router = Pancake_router.attach(pancake_router_address)
            let approve = await token.approve(
                pancake_router_address,
                "1000000000000000000000000"
            )
            await approve.wait()
            const addLiquidity = await pancake_router.addLiquidityETH(
                tokenAddress,
                amountTokenDesired,
                amountTokenMin,
                amountETHMin,
                to,
                deadLine,
                { value: amountETHMin }
            )
            WETH = pancake_router.WETH()
        })
        it("Trying to buy and to sell", async function () {
            let path = [WETH, token.address] //path buy
            decimals = 9
            let tokenToBuy = "100000000000"
            const amounts_out = await pancake_router.getAmountsIn(
                tokenToBuy,
                path
            )
            let bnbToBuy = amounts_out[0].toString()
            let user = ethers.provider.getSigner(15)
            let to = user.getAddress()
            let deadLine = Date.now() + 60
            let userBalbefore = await token.balanceOf(to)
            console.log("user balance before buy: ", userBalbefore)
            let tx = await pancake_router
                .connect(user)
                .swapExactETHForTokensSupportingFeeOnTransferTokens(
                    1,
                    path,
                    to,
                    deadLine,
                    { value: bnbToBuy }
                )
            await tx.wait()
            let userBalanceAfter = await token.balanceOf(to)
            console.log("user balance after: ", userBalanceAfter)
            expect(Number(userBalbefore)).to.be.below(Number(userBalanceAfter))
            console.log("Token bought succesfully!")
            let approve = await token
                .connect(user)
                .approve(
                    pancake_router_address,
                    "1000000000000000000000000000000000000"
                )
            await approve.wait()
            let path2 = [token.address, WETH]
            let tokenToSell = await token.balanceOf(to)
            console.log("token to sell ", tokenToSell)
            /* console.log(
                "TO: ",
                to,
                "\nUSER:",
                user,
                "\nUSER.ADDRESS: ",
                await user.getAddress()
            ) */
            expect(Number(tokenToSell)).to.equal(Number(userBalanceAfter))
            const tx2 = await pancake_router
                .connect(user)
                .swapExactTokensForETHSupportingFeeOnTransferTokens(
                    tokenToSell,
                    1,
                    path2,
                    to,
                    deadLine
                )
            await tx2.wait()
            let balAfterSell = await token.balanceOf(to)
            console.log("balance after sell", balAfterSell)
            expect(balAfterSell).to.equal(0)
        })
    })
    describe("deployin staking system", function () {
        it("staking init", async function () {
            let rewardPerBlockz = 100
            let minimumLockTimez = 3600 //86400,
            const Staking = await ethers.getContractFactory(
                "stakingReferral",
                owner
            )
            staking = await Staking.deploy()
            stakingAddress = staking.address
            console.log("Staking deployed to address ", stakingAddress)
            await staking.initializePool(
                rewardPerBlockz,
                minimumLockTimez,
                referralSystemAddress,
                tokenAddress
            )
            let rewardPerBlock = await staking.rewardPerBlock()
            let minimumLockTime = await staking.minimumLockTime()
            let referralNFTaddress = await staking.referralNFTaddress()
            let rewardTokenAddress = await staking.rewardTokenAddress()
            console.log(
                "Retrieved reward per block: ",
                rewardPerBlock,
                "\nRetrieved minimum lock time: ",
                minimumLockTime,
                "\nRetrieved referralNFT address: ",
                referralNFTaddress,
                "\nRetrieved reward token address: ",
                rewardTokenAddress
            )
            expect(referralNFTaddress).to.equal(referralSystemAddress)
            expect(rewardTokenAddress).to.equal(tokenAddress)
        })
        it("funding staking", async function () {
            let ownerBalance = await token.balanceOf(ownerAddress)
            console.log("Owner leftover balance: ", ownerBalance)
            console.log("funding staking platform")
            token
                .connect(owner)
                .approve(
                    stakingAddress,
                    "1000000000000000000000000000000000000"
                )

            await staking.connect(owner).fundPool((ownerBalance / 2).toString())
            let stakingBalance = await token.balanceOf(staking.address)
            console.log("Staking balance: ", stakingBalance)
            console.log("staking funded succesfully")
        })
        it("testing staking", async function () {
            let userLockTime = 3600
            let randomUser = Math.floor(Math.random() * addressList.length)
            tempUser = ethers.provider.getSigner(24 /* randomUser + 5 */)
            tempAddress = await tempUser.getAddress()
            /* let tokenId = await referralSystem.ownerOf(tempAddress)
            let deposit = staking.connect(tempUser).deposit() */
            let ids = await referralSystem.addressToIds(tempAddress, 0)
            console.log("ID of ", tempAddress, " : ", ids)
            let approve = await referralSystem
                .connect(tempUser)
                .approve(staking.address, ids)
            let deposit = await staking
                .connect(tempUser)
                .deposit(ids, userLockTime)
            let nftBal = await referralSystem.balanceOf(tempAddress)
            console.log("User nft balance after deposit: ", nftBal)
            expect(nftBal).to.equal(0)
            console.log(
                "--------------------------------------------------------"
            )
            console.log("testing the reward calculation")
            let blockId = await ethers.provider.getBlockNumber()
            console.log("blocknumer: ", blockId)
            await network.provider.send("evm_increaseTime", [86400])
            await network.provider.send("evm_mine")
            for (let index = 0; index < 3600; index++) {
                //await network.provider.send("evm_increaseTime", [500]);
                await network.provider.send("evm_increaseTime", [3])
                await ethers.provider.send("evm_mine")
            }
            console.log("1 hour has passed")
            let pendingReward = await staking
                .connect(tempUser)
                .calculateReward()
            console.log("Pending reward: ", pendingReward)
            blockId = await ethers.provider.getBlockNumber()
            console.log("blocknumer: ", blockId)
            console.log(
                "--------------------------------------------------------"
            )
            console.log("testing claim")
            let userBalanceBefore = await token.balanceOf(tempAddress)
            console.log(
                "block id: ",
                await ethers.provider.getBlockNumber(),
                "address: ",
                tempAddress,
                " token balance: ",
                userBalanceBefore
            )
            /* token
                .connect(tempUser)
                .approve(
                    stakingAddress,
                    "1000000000000000000000000000000000000"
                ) */
            let claim = await staking.connect(tempUser).claimReward()
            let userBalanceAfter = await token.balanceOf(tempAddress)
            console.log(
                "block id: ",
                await ethers.provider.getBlockNumber(),
                "address: ",
                tempAddress,
                " token balance: ",
                userBalanceAfter
            )
            console.log("-----------------------------------------------------")
            console.log("testing withdraw")
            let withdraw = await staking.connect(tempUser).withdraw()
            let nftBalance = await referralSystem.balanceOf(tempAddress)
            let tokenBalance = await token.balanceOf(tempAddress)
            console.log(
                "NFT withdrawn sucessfully.\nnftBalance: %s,\ntokenBalance: %s",
                nftBalance,
                tokenBalance
            )
        })
    })
})
