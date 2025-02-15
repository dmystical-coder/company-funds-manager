// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Multisig is Ownable{
    // Errors
    /** throw error if board numbers is not equal to 20 */
    error InvalidBoardMembersCount();

    /**  throw error if proposal value > available balance  */
    error InvalidTxnValue();

    /** throw error if the caller is not a board member */
    error NotBoardMember(address caller);

    /** throw error if proposal is already executed */
    error AlreadyExecuted(uint256 txnId);

    /** throw error if proposal is already approved */
    error AlreadyApproved(uint256 txnId, address boardMember);

    /** throw error if proposal is not approved yet */
    error NotApprovedYet(uint256 txnId, address boardMember);

    /** throw error if proposal does not have enough approvals */
    error NotEnoughApprovals(uint256 txnId);

    // Events
    event Deposit(address indexed sender, uint256 amount);
    event ExpenseProposed(uint256 expenseId, address indexed recipient, uint256 amount);
    event Approved(uint256 expenseId, address indexed member);
    event ProposalExecuted(uint256 expenseId, address indexed recipient, uint256 amount);

struct Expense {
        uint256 id;
        address payable recipient;
        uint256 amount;
        bool executed;
        mapping(address => bool) approvals;
        uint256 approvalCount;
    }

    uint256 public proposalCount;
    mapping(uint256 => Expense) proposals;
    mapping(address => bool) public isBoardMember;
    uint256 public totalFunds;
    uint256 public constant REQUIRED_APPROVALS = 20;

    modifier onlyBoardMember() {
        if (!isBoardMember[msg.sender]) {
            revert NotBoardMember(msg.sender);
        }
        _;
    }
/** requires proposal to not be executed */
    modifier notExecuted(uint256 _proposalId){
        if(proposals[_proposalId].executed){
            revert AlreadyExecuted(_proposalId);
        }
        _;
    }

/** requires proposal to not be approved yet by the caller */
    modifier notApproved(uint256 _proposalId){
        if(proposals[_proposalId].approvals[msg.sender]){
            revert AlreadyApproved(_proposalId, msg.sender);
        }
        _;
    }

/** requires proposal to be approved by the caller */
    modifier isApproved(uint256 _proposalId){
        if(!proposals[_proposalId].approvals[msg.sender]){
            revert NotApprovedYet(_proposalId, msg.sender);
        }
        _;
    }

    constructor(address[] memory _boardMembers) Ownable(msg.sender){
        if (_boardMembers.length != REQUIRED_APPROVALS) {
            revert InvalidBoardMembersCount();
        } else if(_boardMembers.length > REQUIRED_APPROVALS){
            revert InvalidBoardMembersCount();
        } else {
            for (uint256 i = 0; i < _boardMembers.length; i++) {
                isBoardMember[_boardMembers[i]] = true;
            }
        }
    }

     function deposit() external payable {
        if(msg.value <= 0){
            revert("Deposit must be greater than zero");
        }
 
        totalFunds += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function proposeExpense(address payable _recipient, uint256 _amount) external onlyBoardMember{
        if(_amount > totalFunds){
            revert InvalidTxnValue();
        }
        
        Expense storage newExpense = proposals[proposalCount];
        newExpense.id = proposalCount;
        newExpense.recipient = _recipient;
        newExpense.amount = _amount;
        newExpense.executed = false;

        emit ExpenseProposed(proposalCount, _recipient, _amount);
        proposalCount++;
    }

    function approveExpense(uint256 _expenseId) external onlyBoardMember notApproved(proposalCount) notExecuted(_expenseId) {
        Expense storage expense = proposals[_expenseId];
        expense.approvals[msg.sender] = true;
        expense.approvalCount++;

        emit Approved(_expenseId, msg.sender);

        if (expense.approvalCount == REQUIRED_APPROVALS) {
            executeExpense(_expenseId);
        }
    }

    function executeExpense(uint256 _expenseId) internal notExecuted(_expenseId) {
        Expense storage expense = proposals[_expenseId];
       if(expense.approvalCount < REQUIRED_APPROVALS){
            revert NotEnoughApprovals(_expenseId);
        }

        expense.executed = true;
        totalFunds -= expense.amount;
        expense.recipient.transfer(expense.amount);

        emit ProposalExecuted(_expenseId, expense.recipient, expense.amount);
    }

    function getExpense(uint256 _expenseId) external view returns (
        address recipient,
        uint256 amount,
        bool executed,
        uint256 approvalCount
    ) {
        Expense storage expense = proposals[_expenseId];
        return (expense.recipient, expense.amount, expense.executed, expense.approvalCount);
    }
}