const { expect, assert } = require("chai");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");
function getSecondsOfDays(day) {
  return day * 24 * 60 * 60;
}

describe("Quest-Contract", function () {
  async function runEveryTime() {
    const [owner, otherAccount, user1, user2, user3, user4] =
      await ethers.getSigners();

    // TOKEN SETUP
    const testUSDCContract = await ethers.getContractFactory("TestUSDC");
    const testUSDC1 = await testUSDCContract.deploy();

    console.log("USDC deployed.");

    const testUSDCAddress1 = await testUSDC1.getAddress();

    const amountToTransfer = ethers.parseUnits("1000", 18);

    await testUSDC1.transfer(otherAccount, amountToTransfer);
    await testUSDC1.transfer(user1, amountToTransfer);
    await testUSDC1.transfer(user2, amountToTransfer);
    await testUSDC1.transfer(user3, amountToTransfer);
    await testUSDC1.transfer(user4, amountToTransfer);

    console.log("Tokens transfered from main account to otherAccount.");

    const SocioTrade = await ethers.getContractFactory("SocioTrade");
    const socioTrade = await SocioTrade.connect(owner).deploy(testUSDCAddress1);
    const socioTradAddress = await socioTrade.getAddress();
    console.log("TEST-USDC transfered to Quest contract.");

    return {
      owner,
      otherAccount,
      testUSDC1,
      testUSDCAddress1,
      socioTrade,
      user1,
      socioTradAddress,
      user2,
      user3,
      user4,
    };
  }

  describe("Deployment", async () => {
    it("Should check deploy the contract", async () => {
      const { owner, otherAccount, socioTrade, testUSDC1 } = await loadFixture(
        runEveryTime
      );
      expect(await socioTrade.getAddress()).to.not.null;
    });

    it("Should create monetize post", async () => {
      const { owner, otherAccount, socioTrade, testUSDC1 } = await loadFixture(
        runEveryTime
      );
      // const amount = ethers.utils.formatEther("100");
      await socioTrade.connect(otherAccount).createPost(true, { value: 100 });
      let data = await socioTrade.posts(1);
      expect(+data[2].toString()).to.equal(1);
    });

    it("Should create non-monetize post", async () => {
      const { owner, otherAccount, socioTrade, testUSDC1 } = await loadFixture(
        runEveryTime
      );
      await expect(
        socioTrade.connect(otherAccount).createPost(false, { value: 100 })
      ).revertedWith("Post is not Monetized !!!");
    });

    it("Should Trade on Monetize Post", async () => {
      const {
        owner,
        otherAccount,
        socioTrade,
        testUSDC1,
        user1,
        socioTradAddress,
      } = await loadFixture(runEveryTime);

      const amountSpender = ethers.parseUnits("400", 18);
      await testUSDC1.connect(user1).approve(socioTradAddress, amountSpender);

      await socioTrade.connect(otherAccount).createPost(true, { value: 100 });
      await socioTrade
        .connect(user1)
        .depositFunds(ethers.parseUnits("400", 18), 1);
      expect(await testUSDC1.balanceOf(socioTradAddress)).to.equal(
        ethers.parseUnits("400", 18)
      );
    });
    it("Should Multiple User can Deposits", async () => {
      const {
        owner,
        otherAccount,
        socioTrade,
        testUSDC1,
        user1,
        user2,
        user3,
        user4,
        socioTradAddress,
      } = await loadFixture(runEveryTime);

      const amountSpender = ethers.parseUnits("400", 18);
      await testUSDC1.connect(user1).approve(socioTradAddress, amountSpender);
      await testUSDC1.connect(user2).approve(socioTradAddress, amountSpender);
      await testUSDC1.connect(user3).approve(socioTradAddress, amountSpender);
      await testUSDC1.connect(user4).approve(socioTradAddress, amountSpender);

      await socioTrade.connect(otherAccount).createPost(true, { value: 100 });
      await socioTrade
        .connect(user1)
        .depositFunds(ethers.parseUnits("400", 18), 1);
      await socioTrade
        .connect(user2)
        .depositFunds(ethers.parseUnits("400", 18), 1);
      await socioTrade
        .connect(user3)
        .depositFunds(ethers.parseUnits("400", 18), 1);
      await socioTrade
        .connect(user4)
        .depositFunds(ethers.parseUnits("400", 18), 1);

      expect(await testUSDC1.balanceOf(socioTradAddress)).to.equal(
        ethers.parseUnits("1600", 18)
      );
    });

    it("user should sell there shares", async () => {
        const {
            owner,
            otherAccount,
            socioTrade,
            testUSDC1,
            user1,
            socioTradAddress,
        } = await loadFixture(runEveryTime);
    
        const amountSpender = ethers.parseUnits("1000", 18);
        await testUSDC1.connect(user1).approve(socioTradAddress, amountSpender);
     
    
        await socioTrade.connect(otherAccount).createPost(true, { value: 100 });

        await socioTrade
            .connect(user1)
            .depositFunds(ethers.parseUnits("400", 18), 1);
    
        await socioTrade.connect(user1).sellFunds(1,1, ethers.parseUnits("200", 18));

        expect(await testUSDC1.balanceOf(user1.address)).to.equal(
            ethers.parseUnits("804", 18)
        );

    });
  });
});
