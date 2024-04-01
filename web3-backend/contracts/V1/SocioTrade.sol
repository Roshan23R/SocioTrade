// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.16;

import {IERC20} from "../Interfaces/IERC20.sol";

contract SocioTrade {
    address public owner;
    uint256 public constant POST_FEES = 1e2 wei;
    IERC20 private erc20;
    mapping(uint256 => Post) public posts;
    mapping(address => Deposit[]) private userDeposits;
    uint256 private postId;
    uint256 private depositId;

    // constant Variables

    uint256 constant likesWeight = 1;
    uint256 constant commentsWeight = 2;
    uint256 constant sharesWeight = 3;
    uint256 constant viewsWeight = 4;
    uint256 constant followersWeight = 5;

    uint256 previousEngagementRate = 0;
    int256 previousProfitLoss = 0;
    uint256 previousShares = 0;

    event LogUpdateEngagement(
        uint256 newEngagementRate,
        uint256 revenue,
        uint256 expenses,
        int256 profitLoss
    );

    constructor(address _erc20) {
        owner = msg.sender;
        erc20 = IERC20(_erc20);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    enum PostStatus {
        CLOSED,
        ONGOING
    }

    struct Deposit {
        uint256 amount;
        uint256 lockingDuration;
        uint256 postId;
        uint256 startDate;
        uint256 endDate;
        address owner;
    }

    struct Post {
        uint256 id;
        uint256 amount;
        uint256 postType;
        uint256 startTime;
        uint256 endTime;
        PostStatus status;
        mapping(uint256 => Deposit) deposits;
    }

    function receive() external payable {}

    function createPost(bool _wantToMonetizeThisPost) external payable {
        require(_wantToMonetizeThisPost, "Post is not Monetized !!!");
        require(
            msg.value >= POST_FEES,
            "Insufficient Funds to pay Creation Fees"
        );

        postId++;

        Post storage _post = posts[postId];
        _post.id = postId;
        _post.amount = 0;
        _post.postType = 1;
        _post.startTime = block.timestamp;
        _post.endTime = block.timestamp + 30 days;
        _post.status = PostStatus.ONGOING;
    }

    function depositFunds(uint256 _amount, uint256 _postId) external {
        require(_amount > 0, "Null amount");
        require(_postId <= postId, "Not valid Post");

        Post storage _post = posts[_postId];
        require(_post.status == PostStatus.ONGOING, "Post is closed to invest");
        require(
            erc20.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );

        _post.amount += _amount;
        uint256 _lockingDuration = _post.endTime - block.timestamp;
        uint256 _endDate = block.timestamp + _lockingDuration;
        depositId++;
        _post.deposits[depositId] = Deposit(
            _amount,
            _lockingDuration,
            _postId,
            block.timestamp,
            _endDate,
            msg.sender
        );

        userDeposits[msg.sender].push(
            Deposit(
                _amount,
                _lockingDuration,
                _postId,
                block.timestamp,
                _endDate,
                msg.sender
            )
        );
    }

    function sellFunds(
        uint256 _postId,
        uint256 _depositID,
        uint256 _amount,
        uint256 _likes,
        uint256 _views,
        uint256 _shares,
        uint256 _followers
    ) external {
        require(_amount > 0, "Amount should be greater than 0");
        Post storage _post = posts[_postId];
        require(
            _post.status == PostStatus.ONGOING,
            "Post is not live to release funds"
        );
        require(_post.endTime > block.timestamp, "Post is Ended !!!");
        Deposit storage _depositData = _post.deposits[_depositID];
        require(_depositData.owner == msg.sender, "Not valid owner");

        require(
            _depositData.amount >= _amount,
            "Insufficient Funds to release"
        );
        uint256 rewardAmount = _updateEngagement(
            _amount,
            _likes,
            _shares,
            _views,
            _followers
        );
        require(
            erc20.transfer(msg.sender, rewardAmount),
            "withdraw(uint256 _depositNumber) : TRANSFER FAILED"
        );

        _post.amount -= _amount;
        _depositData.amount -= _amount;
    }

  
    function _transfer(uint256 _amount, address _receiver) public onlyOwner {
        erc20.approve(address(this), _amount);
        erc20.approve(address(this), _amount);
        require(
            erc20.transferFrom(address(this), _receiver, _amount),
            "Transfer failed"
        );
    }

    function getUserDeposits(address _user)
        external
        view
        returns (Deposit[] memory)
    {
        return userDeposits[_user];
    }

    function _calculateEngagementRate(
        uint256 likes,
        uint256 shares,
        uint256 views,
        uint256 followers
    ) private pure returns (uint256) {
        return ((likes + shares + views) / followers) * 10;
    }

    function _updateEngagement(
        uint256 fixedExpenses,
        uint256 newLikes,
        uint256 newShares,
        uint256 newViews,
        uint256 newFollowers
    ) private returns (uint256) {
        uint256 newEngagementRate = _calculateEngagementRate(
            newLikes,
            newShares,
            newViews,
            newFollowers
        );
        int256 engagementChange = int256(newEngagementRate) -
            int256(previousEngagementRate);

        // Calculate revenue and expenses
        uint256 revenue = _calculateRevenue(
            newLikes,
            newShares,
            newViews,
            newFollowers
        );
        uint256 expenses = fixedExpenses;

        // Calculate profit/loss
        int256 profitLoss = int256(revenue) - int256(expenses);

        emit LogUpdateEngagement(
            newEngagementRate,
            revenue,
            expenses,
            profitLoss
        );

        // Update the previous engagement rate, profit/loss, and shares for the next iteration
        previousEngagementRate = newEngagementRate;
        previousProfitLoss = profitLoss;
        previousShares = newShares;

        return revenue;
    }

    function _calculateRevenue(
        uint256 likes,
        uint256 shares,
        uint256 views,
        uint256 followers
    ) private pure returns (uint256) {
        return
            ((likes * likesWeight) +
                (shares * sharesWeight) +
                (views * viewsWeight) +
                (followers * followersWeight)) / 10; // Some arbitrary conversion rate to monetary value
    }
}
