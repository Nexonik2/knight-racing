// frontend/src/components/WalletControls.jsx
import React from "react";
import { useConnect, useAccount, useDisconnect } from "@starknet-react/core";

export function WalletControls() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  // Redirects to the official Starknet Sepolia Faucet
  const handleFaucet = () => {
    window.open("https://starknet-faucet.vercel.app/", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="wallet-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      {isConnected ? (
        <div className="active-wallet-ui">
          <p className="wallet-address">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
          <div className="button-group" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
            <button className="btn-faucet" onClick={handleFaucet}>
              Claim Testnet Tokens
            </button>
            <button className="btn-disconnect" onClick={() => disconnect()}>
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <button 
          className="btn-connect" 
          onClick={() => connect({ connector: connectors[0] })}
        >
          Connect Cartridge Wallet
        </button>
      )}
    </div>
  );
}