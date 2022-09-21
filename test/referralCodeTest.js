const { ethers } = require("hardhat")
const { expect, assert } = require("chai")
const { idText } = require("typescript")

describe("ReferralCode system", function () {
    let referralCode
    let referralCodeAddress
    let referralSystem
    let referralSystemAddress
    let owner = ethers.provider.getSigner(0)
    let ownerAddress = owner.getAddress()

    it("Deploying referral code", async function () {
        const refcode = await ethers.getContractFactory("referralCode", owner)
        referralCode = await refcode.deploy()
        let ref = await referralCode.refCode()

        console.log(
            "Referral code deployed: ",
            referralCode.address,
            "code: ",
            ref
        )
        referralCodeAddress = referralCode.address
        console.log("Referral code contract deployed")
    })
    /*  it("Testing randomness 10 times", async function () {
        for (let i = 0; i < 10; i++) {
            let randomness = await referralCode.moreRandom()
            console.log("Random number created: ", Number(randomness))
        }
        console.log("Test on randomness finished")
    }) */
    it("Deploying referralSystem contract", async function () {
        const refSys = await ethers.getContractFactory("referralSystem", owner)
        referralSystem = await refSys.deploy()
        referralSystemAddress = referralSystem.address
        console.log("referral system contract deployed")
    })
    it("Assosiating the referral system address to referral code contract", async function () {
        console.log("referral system in variable: ", referralSystemAddress)
        let settingAddress = await referralCode.setReferralSystemAddress(
            referralSystemAddress
        )
        settingAddress.wait()
        let refSysInRefCod = await referralCode.referralSystemAddress()
        expect(referralSystemAddress).to.equal(refSysInRefCod)
    })
})
