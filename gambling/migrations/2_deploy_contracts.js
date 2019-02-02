var gambling = artifacts.require("./gambling.sol");

module.exports = function(deployer) {
  deployer.deploy(gambling,100000, web3.toWei('0.01', 'ether'));
};
