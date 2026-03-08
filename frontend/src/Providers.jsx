import React from "react";
import { sepolia } from "@starknet-react/chains";
import {
  StarknetConfig,
  jsonRpcProvider,
  voyager,
} from "@starknet-react/core";
import { ControllerConnector } from "@cartridge/connector"; 

const FEE_TOKEN_ADDRESS = "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
// Dynamically load variables based on Vite's active mode
const ACTIONS_CONTRACT_ADDRESS = import.meta.env.VITE_ACTIONS_ADDRESS; 
const ACTIVE_RPC_URL = import.meta.env.VITE_RPC_URL;

const cartridgeConnector = new ControllerConnector({
  policies: [
    {
      target: ACTIONS_CONTRACT_ADDRESS,
      method: "spawn_race",
      description: "Spawn a new race",
    },
    {
      target: FEE_TOKEN_ADDRESS,
      method: "approve",
      description: "Approve token spending for wagers",
    },
    {
      target: ACTIONS_CONTRACT_ADDRESS,
      method: "place_wager",
      description: "Place a wager on a knight",
    },
    {
      target: ACTIONS_CONTRACT_ADDRESS,
      method: "claim_reward",
      description: "Claim winning wager rewards",
    }
  ],
  rpc: ACTIVE_RPC_URL,
});

const rpcProvider = jsonRpcProvider({
  rpc: () => {
    return { nodeUrl: ACTIVE_RPC_URL };
  },
});

export function Providers({ children }) {
  return (
    <StarknetConfig
      chains={[sepolia]}
      provider={rpcProvider}
      connectors={[cartridgeConnector]}
      explorer={voyager}
      autoConnect={false}
    >
      {children}
    </StarknetConfig>
  );
}