// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract AgentGigEscrow {
    IERC20 public usdc;
    address public owner;
    
    struct Task {
        address poster;
        address agent;
        uint256 amount;
        bytes32 taskId;
        bool completed;
        bool disputed;
        bool refunded;
    }
    
    mapping(bytes32 => Task) public tasks;
    mapping(bytes32 => bool) public verified;
    
    event TaskCreated(bytes32 indexed taskId, address poster, uint256 amount);
    event TaskClaimed(bytes32 indexed taskId, address agent);
    event TaskCompleted(bytes32 indexed taskId);
    event PaymentReleased(bytes32 indexed taskId, address agent, uint256 amount);
    event PaymentRefunded(bytes32 indexed taskId, address poster, uint256 amount);
    event DisputeRaised(bytes32 indexed taskId, address by);
    event DisputeResolved(bytes32 indexed taskId, bool agentWins);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _usdc) {
        usdc = IERC20(_usdc);
        owner = msg.sender;
    }
    
    // Create task and escrow payment
    function createTask(bytes32 taskId, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(tasks[taskId].poster == address(0), "Task exists");
        
        // Transfer USDC from poster to escrow
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        tasks[taskId] = Task({
            poster: msg.sender,
            agent: address(0),
            amount: amount,
            taskId: taskId,
            completed: false,
            disputed: false,
            refunded: false
        });
        
        emit TaskCreated(taskId, msg.sender, amount);
    }
    
    // Agent claims task
    function claimTask(bytes32 taskId) external {
        Task storage task = tasks[taskId];
        require(task.poster != address(0), "Task not found");
        require(task.agent == address(0), "Already claimed");
        require(!task.completed, "Task completed");
        require(!task.refunded, "Task refunded");
        
        task.agent = msg.sender;
        
        emit TaskClaimed(taskId, msg.sender);
    }
    
    // Mark task as completed (by verification service)
    function markCompleted(bytes32 taskId) external onlyOwner {
        Task storage task = tasks[taskId];
        require(task.poster != address(0), "Task not found");
        require(task.agent != address(0), "Not claimed");
        require(!task.completed, "Already completed");
        require(!task.refunded, "Task refunded");
        
        task.completed = true;
        verified[taskId] = true;
        
        emit TaskCompleted(taskId);
    }
    
    // Release payment to agent
    function releasePayment(bytes32 taskId) external {
        Task storage task = tasks[taskId];
        require(verified[taskId], "Not verified");
        require(task.completed, "Not completed");
        require(!task.disputed, "In dispute");
        require(!task.refunded, "Already refunded");
        
        task.completed = true;
        
        // Transfer to agent
        require(usdc.transfer(task.agent, task.amount), "Transfer failed");
        
        emit PaymentReleased(taskId, task.agent, task.amount);
    }
    
    // Refund poster (if task expired or not claimed)
    function refund(bytes32 taskId) external {
        Task storage task = tasks[taskId];
        require(msg.sender == task.poster || msg.sender == owner, "Not authorized");
        require(task.poster != address(0), "Task not found");
        require(task.agent == address(0), "Already claimed");
        require(!task.completed, "Task completed");
        require(!task.refunded, "Already refunded");
        
        task.refunded = true;
        
        // Transfer back to poster
        require(usdc.transfer(task.poster, task.amount), "Transfer failed");
        
        emit PaymentRefunded(taskId, task.poster, task.amount);
    }
    
    // Raise dispute
    function raiseDispute(bytes32 taskId) external {
        Task storage task = tasks[taskId];
        require(msg.sender == task.poster || msg.sender == task.agent, "Not authorized");
        require(task.poster != address(0), "Task not found");
        require(!task.disputed, "Already disputed");
        require(!task.completed, "Task completed");
        
        task.disputed = true;
        
        emit DisputeRaised(taskId, msg.sender);
    }
    
    // Resolve dispute (owner decides)
    function resolveDispute(bytes32 taskId, bool agentWins) external onlyOwner {
        Task storage task = tasks[taskId];
        require(task.disputed, "No dispute");
        require(!task.completed, "Task completed");
        require(!task.refunded, "Task refunded");
        
        task.disputed = false;
        task.completed = true;
        
        if (agentWins) {
            require(usdc.transfer(task.agent, task.amount), "Transfer failed");
            emit PaymentReleased(taskId, task.agent, task.amount);
        } else {
            require(usdc.transfer(task.poster, task.amount), "Transfer failed");
            emit PaymentRefunded(taskId, task.poster, task.amount);
        }
        
        emit DisputeResolved(taskId, agentWins);
    }
    
    // Get task info
    function getTask(bytes32 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }
    
    // Update USDC address (if needed)
    function updateUSDC(address _usdc) external onlyOwner {
        usdc = IERC20(_usdc);
    }
    
    // Emergency withdraw (only owner)
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(usdc.transfer(owner, amount), "Transfer failed");
    }
}
