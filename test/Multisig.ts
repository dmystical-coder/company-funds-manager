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
    companyFunds = await CompanyFundsManager.deploy(boardMemberAddresses);
    await companyFunds.deployed();

    return {owner, recipient, boardMembers, companyFunds};
}

it("should deploy", async function () {
    await loadFixture(deployMultiSigFixture);
    expect(await companyFunds.owner()).to.equal(owner.address);
    expect(await companyFunds.boardMembers(0)).to.equal(boardMembers[0].address);
    expect(await companyFunds.boardMembers(19)).to.equal(boardMembers[19].address);
    });


  it("should allow deposits", async function () {
    await companyFunds.deposit({ value: ethers.utils.parseEther("10") });
    expect(await ethers.provider.getBalance(companyFunds.address)).to.equal(ethers.utils.parseEther("10"));
  });

  it("should allow a board member to propose an expense", async function () {
    await companyFunds.connect(boardMembers[0]).proposeExpense(recipient.address, ethers.utils.parseEther("5"));
    const expense = await companyFunds.getExpense(0);
    expect(expense.recipient).to.equal(recipient.address);
    expect(expense.amount).to.equal(ethers.utils.parseEther("5"));
  });

  it("should require 20 approvals before executing", async function () {
    for (let i = 0; i < 19; i++) {
      await companyFunds.connect(boardMembers[i]).approveExpense(0);
    }

    let expense = await companyFunds.getExpense(0);
    expect(expense.approvalCount).to.equal(19);
    expect(expense.executed).to.be.false;

    // 20th board member approves
    await companyFunds.connect(boardMembers[19]).approveExpense(0);

    expense = await companyFunds.getExpense(0);
    expect(expense.executed).to.be.true;
    expect(await ethers.provider.getBalance(companyFunds.address)).to.equal(ethers.utils.parseEther("5"));
  });
});
