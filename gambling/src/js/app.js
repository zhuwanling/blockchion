App = {
    web3Provider: null,
    contracts: {},
    candidates: {},
    tokenPrice: null,
    init: function() {
  
      return App.initWeb3();
    },
  
    initWeb3: function() {
      if (typeof web3 !== 'undefined') {      
          App.web3Provider = web3.currentProvider;    
      } else {      
          // If no injected web3 instance is detected, fall back to Ganache     
           App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');   
      }    
      web3 = new Web3(App.web3Provider);    
  
      return App.initContract();
    },
  
    initContract: function() {
      $.getJSON('gambling.json', function(data) {    
              var gamblingArtifact = data;    
              App.contracts.gambling = TruffleContract(gamblingArtifact);    
              App.contracts.gambling.setProvider(App.web3Provider);    
              return App.populateTokenData();  
          }
      );  
  
      return App.bindEvents();
    },

    bindEvents: function() {

  //购买游戏卷
      $("#voter_buyTokens").click(() => {
         let tokensToBuy = $("#buy").val();
         let price = tokensToBuy * App.tokenPrice;
         
         web3.eth.getAccounts(function(error, accounts){
        if (error) {
            console.log(error);
        }
            var account = accounts[0];
            App.contracts.gambling.deployed().then(function(contractInstance) {
              contractInstance.buy( {value: web3.toWei(price, 'ether'), from: web3.eth.accounts[0]}  ).then(function(v) {
                  console.log("web3.eth.accounts[0] = " + web3.eth.accounts[0]);
                  console.log("web3.eth.accounts[1] = " + web3.eth.accounts[1]);
                
                //查询，更新余额
                web3.eth.getBalance(accounts[0], function(error, result) {
                  $("#contract-balance").html(web3.fromWei(result.toString()) + " Ether");
                });
        
                $("#buy-msg").fadeIn(300);    //fadeIn() 方法逐渐改变被选元素的不透明度，从隐藏到可见（褪色效果）。
                setTimeout(() => $("#buy-msg").fadeOut(1000),1000);
               
              })
             });
             App.populateTokenData(); //更新值
       });
       
      });
      //赌博结果
      function Result(aims) {
        App.contracts.gambling.deployed().then((contractInstance) => {
            let time = setInterval(() => {
                web3.eth.getBlockNumber(function (error, result) {
                    console.log(result);
                    console.log(aims);
                    if (result == aims) {
                        contractInstance.GetBoolWin.call().then((vi) => {
                            console.log("vi = " + vi);
                            //玩家赢
                            if (vi == 1) {
                                console.log("赢");
                                document.querySelector('#message').innerHTML = 'You are win!';
                                //前端播放赢得动画 
                            } else {
                                console.log("输");
                                document.querySelector('#message').innerHTML = 'You are lost!';
                                //前端播放输得动画
                            }
                            clearInterval(time);
                        });
                        clearInterval(time);
                    }
                });
            }, 1000);
        });
    }
     //下注
     $("#voter-send").click(() => {
        //let candidateName = $("#candidate").val(); //获取被投票的候选人
        let voteTokens = $("#vote-tokens").val();  //押注量
        document.querySelector('#message').innerHTML = '';
       // $("#candidate").val("");
        $("#vote-tokens").val("");
        console.log("下注量 = " + voteTokens);
        web3.eth.getAccounts(function(error, accounts){
        if (error) {
            console.log(error);
        }
        var account = accounts[0];
            App.contracts.gambling.deployed().then( (contractInstance) => {

                contractInstance.GetCurrenPlayerTokens.call().then((v) => {
                    console.log("剩余货币 = " + v);
                });

                //合约判断输赢，参数：投票量 
                contractInstance.Judge (voteTokens ).then((v) =>{

                    setTimeout(Result(v.receipt.blockNumber), 3000);
                    console.log("赌币结束");
                });
             
             });
      });
       App.populateTokenData(); //更新值
      });
    },
    //根据合约变量初始化页面值
    populateTokenData: function(){
        App.contracts.gambling.deployed().then(function(contractInstance) {
        web3.eth.getAccounts(function(error, accounts){
            if(error){
               console.log(error);
            }    
        console.log(contractInstance);
        console.log(accounts);

        contractInstance.GetCurrenAddress().then(function(v) {
           console.log("msg.sender = " +  v.toString());       
           });

           contractInstance.GetBoolWin.call().then((v) => {
            console.log("直接函数获取输赢结果 = " + v);
        });
        
         //庄家游戏币
         contractInstance.GetBalanceTokens().then(function(v) {
          $("#tokens-total").html(v.toString() + " 个");             
         });
         //庄家输赢游戏币
         contractInstance.GetWinLose.call().then(function(v) {
          $("#tokens-sold").html( parseInt(v) + " 个");
         });
         //游戏币单价
         contractInstance.tokenPrice().then(function(v) {
          App.tokenPrice = parseFloat(web3.fromWei(v.toString()));
          var p = 1 / App.tokenPrice;
          $("#token-cost").html(p  + " 个 / 1 Ether");
         });
         //账户ETH账户ETH
         web3.eth.getBalance(accounts[0], function(error, result) {
            $("#contract-balance").html(web3.fromWei(result.toString()) + " Ether");
           });
         //账户游戏币
         contractInstance.GetCurrenPlayerTokens.call().then(function(v) {
            $("#user-count").html(v.toString() + " 个");
           });
        //个人输赢
        contractInstance.GetPlayerWinLose.call().then(function(v) {
            $("#user-winlose").html(v.toString() + " 个");
           });
        });
        });
    }
};

$(function () {
    $(window).on('load', function () {
        App.init();
    });
});