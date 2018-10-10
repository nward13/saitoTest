var SimplePaymentChannel = artifacts.require("./SimplePaymentChannel.sol");
var SimpleValidator = artifacts.require("./SimpleValidator.sol");

module.exports = function(deployer) {
    deployer.deploy(SimplePaymentChannel);
    deployer.deploy(SimpleValidator);
};