pragma solidity ^0.4.18; 
contract gambling{

    //庄家游戏币总量
    uint public totalTokens; 
    //庄家游戏币剩余数量
    uint public balanceTokens;
    //庄家输赢数量
    int public winLose;
    //货币单价
    uint public tokenPrice;
     //当前输赢
    uint public boolWin;

    //每一个用户
    struct player {
        address playerAddress;//用户地址
        uint tokensBought;//用户持有的货币数
        int winLose;  //玩家输数量
        uint[] PerBuynum;  //每次购买的数量
        //uint[] tokensUsedPerCandidate;//为每个候选人消耗的股票通证数量
    }
    mapping(address => player) allplayer; //一个用户的映射
    //获取用户拥有得游戏币数
    function GetPlayerTokens(address user) public returns(uint) {
        checkisOldUser(user);
        return allplayer[user].tokensBought;
     
    }
    //对用户游戏结果改变用户拥有游戏券数量
    function Update(bool result,uint num,address user) private {
        //赢
        int tmp = int(num);
        if(result==true)
        {
            
            balanceTokens += num;
            allplayer[user].tokensBought+=num;
            allplayer[user].winLose += tmp;
            winLose -= tmp;
        }
        //输
        else
        {
            balanceTokens -= num;
            allplayer[user].tokensBought-=num; 
            allplayer[user].winLose -= tmp;
            winLose += tmp;
        }
    }

    //生成随机数
    function rand() view public returns(uint256) {       
        return  block.timestamp % 3;
    } 

    //返回前端一个 输赢 结果
    function Judge(uint Bet) public returns(bool){
        //检查用户是否存在
        checkisOldUser(msg.sender);
        //下注量需要小于等于庄家拥有的游戏币量
        require(Bet <= balanceTokens);
        //下注量需要小于等于玩家拥有的游戏币量
        require(Bet <= allplayer[msg.sender].tokensBought);
        //玩家赢
        if(block.timestamp % 2 == 1) 
        {
            //是balanceTokens，不是totalTokens   
            boolWin = 1;         
            Update(true, Bet, msg.sender);
            return  true;
        }
        //输
        else 
        {
            boolWin = 2;
            Update(false, Bet, msg.sender);
            return false;
        }
    }
    //构造方法，初始化投票通证总数量、通证单价
    constructor(uint tokens, uint pricePerToken) public {
        totalTokens = tokens;
        balanceTokens = tokens;
        tokenPrice = pricePerToken;
        winLose = 0;
        boolWin = 100;
    }

    //购买投票通证，此方法使用 payable 修饰，在Sodility合约中，
    //只有声明为payable的方法， 才可以接收支付的货币（msg.value值）
    function buy() payable public returns (uint) {
        checkisOldUser(msg.sender);
        uint tokensToBuy = msg.value / tokenPrice;         //根据购买金额和通证单价，计算出购买量
        require(tokensToBuy <= balanceTokens);             //继续执行合约需要确认合约的通证余额不小于购买量
        allplayer[msg.sender].PerBuynum.push(tokensToBuy); //加入该用户每次购买的数量
        allplayer[msg.sender].tokensBought += tokensToBuy;  //保存玩家货币
        balanceTokens -= tokensToBuy;                      //将售出的货币数量从合约的余额中剔除
        return tokensToBuy;                                //返回本次购买的货币数量
    }
    //函数获当前庄家买了多少票出去，用于变化前端页面值
    function tokensSold() view public returns (uint) {
        return totalTokens-balanceTokens;
    }

    function GetBalanceTokens() view public returns (uint){
        return balanceTokens;
    }

 // 检测该用户是否为新用户，如果不是生成该用户数据
    function checkisOldUser (address user)private returns(bool) {
        if(allplayer[user].playerAddress==0){
             // 初始化用户 
            player storage tmpUser = allplayer[user];         
            tmpUser.playerAddress = user;
            tmpUser.tokensBought = 0;
            tmpUser.winLose = 0;
            return false;
        }
        return true;
    }
    //获得当前用户地址
    function GetCurrenAddress() view public returns (address){
        return msg.sender;
    }

    //返回当前玩家的拥有的游戏币
    function GetCurrenPlayerTokens() public returns (uint){
        checkisOldUser(msg.sender);
        return allplayer[msg.sender].tokensBought;
    }
    //庄家输赢数量
    function GetWinLose() view public returns (int) {
        return winLose;
    }
    //玩家输赢数量
    function GetPlayerWinLose() public returns(int) {
        checkisOldUser(msg.sender);
        return allplayer[msg.sender].winLose;
    }
    //获取玩家购买记录
    function GetBuyRecord() public returns(uint[]) {
        address user = msg.sender;
        uint[] storage tmp = allplayer[user].PerBuynum;
        return tmp;

    }

    //获取输赢结果  赢 1   输 2
    function GetBoolWin() view public returns(uint){
        return boolWin;
    }


}