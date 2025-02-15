const { expect } = require("chai");
const { ethers } = require("hardhat");
import {
    loadFixture
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("CompanyFundsManager", function () {
  let companyFunds, owner, boardMembers, recipient;

  async function deployMultiSigFixture() {

    [owner, recipient, ...boardMembers] = await ethers.getSigners();

    const CompanyFundsManager = await ethers.getContractFactory("Multisig");
    const boardMemberAddresses = boardMembers.slice(0, 20).map(b => b.address);
    const multisig = await CompanyFundsManager.deploy(boardMemberAddresses);
 

    return {multisig, owner, recipient, boardMemberAddresses, companyFunds};
}

describe("Deployment", () =>{
    it("should deploy", async function () {
        const { boardMemberAddresses } = await loadFixture(deployMultiSigFixture);
        expect(await boardMemberAddresses.length).to.equal(20);
        });

    it("should set the board members", async function () {
        const { multisig, boardMemberAddresses } = await loadFixture(deployMultiSigFixture);
        const isBoardMember = await multisig.isBoardMember(boardMemberAddresses[0]);
        expect(isBoardMember).to.equal(true);
    });
})


  describe("Deposit", () => {
    it("should allow deposits", async function () {
        const { multisig, owner } = await loadFixture(deployMultiSigFixture);
        await multisig.deposit({ value: 1000 });
        const balance = await ethers.provider.getBalance(multisig.target);
        console.log(balance);
        expect(await balance).to.equal(1000);
      });
  })

  it("should allow a board member to propose an expense", async function () {

  });

  it("should require 20 approvals before executing", async function () {

  });
});
