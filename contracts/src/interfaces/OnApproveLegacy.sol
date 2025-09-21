// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "./ERC165Legacy.sol";

/**
 * @dev OnApprove contract that matches the exact pattern from TON/WTON contracts
 */
contract OnApproveLegacy is ERC165Legacy {
    constructor() {
        // Register the onApprove interface exactly like TON/WTON does
        _registerInterface(OnApproveLegacy(this).onApprove.selector);
    }

    function onApprove(address owner, address spender, uint256 amount, bytes calldata data) external virtual returns (bool) {}
}