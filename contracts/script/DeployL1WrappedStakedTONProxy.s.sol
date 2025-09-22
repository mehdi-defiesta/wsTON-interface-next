// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {L1WrappedStakedTON} from "../src/L1WrappedStakedTON.sol";
import {L1WrappedStakedTONProxy} from "../src/L1WrappedStakedTONProxy.sol";

contract DeployL1WrappedStakedTONProxy is Script {
    function run() external {
        // Required parameters for initialization
        address layer2Address = vm.envAddress("LAYER2_ADDRESS");
        address wtonAddress = vm.envAddress("WTON_ADDRESS");
        address tonAddress = vm.envAddress("TON_ADDRESS");
        address depositManagerAddress = vm.envAddress("DEPOSIT_MANAGER_ADDRESS");
        address seigManagerAddress = vm.envAddress("SEIG_MANAGER_ADDRESS");
        address ownerAddress = vm.envAddress("OWNER_ADDRESS");
        uint256 minimumWithdrawalAmount = vm.envUint("MINIMUM_WITHDRAWAL_AMOUNT");
        uint8 maxNumWithdrawal = uint8(vm.envUint("MAX_NUM_WITHDRAWAL"));
        string memory tokenName = vm.envString("TOKEN_NAME");
        string memory tokenSymbol = vm.envString("TOKEN_SYMBOL");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the implementation contract
        console.log("Deploying L1WrappedStakedTON implementation...");
        L1WrappedStakedTON implementation = new L1WrappedStakedTON();
        console.log("L1WrappedStakedTON implementation deployed at:", address(implementation));

        // Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            L1WrappedStakedTON.initialize.selector,
            layer2Address,
            wtonAddress,
            tonAddress,
            depositManagerAddress,
            seigManagerAddress,
            ownerAddress,
            minimumWithdrawalAmount,
            maxNumWithdrawal,
            tokenName,
            tokenSymbol
        );

        // Deploy the proxy contract
        console.log("Deploying L1WrappedStakedTONProxy...");
        L1WrappedStakedTONProxy proxy = new L1WrappedStakedTONProxy();
        console.log("L1WrappedStakedTONProxy deployed at:", address(proxy));

        // Set the implementation in the proxy
        console.log("Setting implementation in proxy...");
        proxy.setImplementation2(address(implementation), 0, true);
        console.log("Implementation set successfully");

        // Initialize the contract through the proxy
        console.log("Initializing contract through proxy...");
        (bool success,) = address(proxy).call(initData);
        require(success, "Initialization failed");
        console.log("Contract initialized successfully");

        vm.stopBroadcast();

        // Log deployment addresses
        console.log("=== Deployment Summary ===");
        console.log("L1WrappedStakedTON Implementation:", address(implementation));
        console.log("L1WrappedStakedTONProxy:", address(proxy));
        console.log("=========================");
    }
}
