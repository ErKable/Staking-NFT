const { ethers } = require("hardhat")
const { expect, assert } = require("chai")
const { idText } = require("typescript")
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
                await referralSystem.adminMint(1, "", addressList) //mint
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
                    let buyer = ethers.provider.getSigner(i + 24)
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
            })
        })
    })
})
