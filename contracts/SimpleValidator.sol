pragma solidity ^0.4.24;

contract SimpleValidator {

    // Test contract created to test matching of signature verification

    uint public valid;
    bytes32 public message;
    address public checkAddress;
    address public firstRecover;
    address public secondRecover;

    function checkMessage(address sender, bytes32 r1, bytes32 s1, uint withdrawal1, uint sig1, uint8 v1) public returns (uint) {
        var msg = generateMessage(withdrawal1, sig1);
        // uint _valid = validateMessage(sender, msg, r1, s1);
        uint _valid = validateMessage(sender, msg, r1, s1, v1);
        valid += _valid;
        return _valid;
    }
    
    function generateMessage(uint x, uint y) returns (bytes32) {
        message = keccak256(uint2str(x), uint2str(y));
        return keccak256(uint2str(x), uint2str(y));
    }

    function validateMessage(address add1, bytes32 m, bytes32 r, bytes32 s, uint8 v) returns (uint) {
        // Header
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        m = keccak256(prefix, m);
        checkAddress = add1;
        firstRecover = ecrecover(m,uint8(27),r,s);
        secondRecover = ecrecover(m,v,r,s);
        if (ecrecover(m,uint8(27),r,s) == add1) { return 1; }
        // if (ecrecover(m,v,r,s) == add1) { return 1; }

        // checkAddress = add1;
        // firstRecover = ecrecover(m,uint8(27),r,s);
        // secondRecover = ecrecover(m,uint8(28),r,s);
        // if (ecrecover(m,uint8(28),r,s) == add1) { return 1; }
        // if (ecrecover(m,uint8(27),r,s) == add1) { return 1; }
        return 0;
    }

    function uint2str(uint i) internal pure returns (string){
        if (i == 0) return "0";
        uint j = i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (i != 0){
            bstr[k--] = byte(48 + i % 10);
            i /= 10;
        }
        return string(bstr);
    }
}