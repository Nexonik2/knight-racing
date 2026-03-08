// frontend/src/components/AdminPanel.jsx
import React, { useState } from "react";
import { useAccount } from "@starknet-react/core";
import { uint256 } from "starknet";

export function AdminPanel({ activeRaceId, raceState, userWager, winningKnightId, raceCreator, hasClaimed }) {  
  const { account } = useAccount();
  const [executingAction, setExecutingAction] = useState(null);

  const ACTIONS_CONTRACT_ADDRESS = import.meta.env.VITE_ACTIONS_ADDRESS;
  const FEE_TOKEN_ADDRESS = import.meta.env.VITE_WAGER_TOKEN_ADDRESS; 

  // readable values for raceState
  const isOpenForWagers = raceState === 1;
  const isRunning = raceState === 2;
  const isFinished = raceState === 3;

  const isCreator = account && raceCreator && BigInt(account.address) === BigInt(raceCreator);
  const isWinner = userWager && winningKnightId && userWager.knight_id === winningKnightId;
  const canClaim = isFinished && isWinner && !hasClaimed;
  
  // --- UI Visibility Toggles ---
  const showWagers = account && isOpenForWagers;
  const showGameLoop = account && isCreator && !isFinished;
  const showPayouts = account;

  // --- Contract Executions ---

  const handleLockBetting = async () => {
    if (!account) return alert("Connect wallet first!");
    if (!activeRaceId) return alert("No active race state found.");
    setExecutingAction("lock");
    try {
      await account.execute([{
        contractAddress: ACTIONS_CONTRACT_ADDRESS,
        entrypoint: "lock_betting",
        calldata: [activeRaceId], 
      }]);
    } catch (error) {
      console.error("Lock Betting failed:", error);
    } finally {
      setExecutingAction(null);
    }
  };

  const handleResolveRace = async () => {
    if (!account) return alert("Connect wallet first!");
    if (!activeRaceId) return alert("No active race state found.");
    setExecutingAction("resolve");
    try {
      await account.execute([{
        contractAddress: ACTIONS_CONTRACT_ADDRESS,
        entrypoint: "resolve_race",
        calldata: [activeRaceId], 
      }]);
    } catch (error) {
      console.error("Resolve Race failed:", error);
    } finally {
      setExecutingAction(null);
    }
  };

  const handleWager = async (knightId) => {
    if (!account) return alert("Connect wallet first!");
    if (!activeRaceId) return alert("No active race state found.");
    
    setExecutingAction(`wager-${knightId}`);
    
    // Hardcoded 10 token test wager
    const amountUint256 = uint256.bnToUint256( 10n**17n);

    try {
      await account.execute([
        {
          contractAddress: FEE_TOKEN_ADDRESS,
          entrypoint: "approve",
          // Standard ERC20 approve requires u256 (low, high)
          calldata: [ACTIONS_CONTRACT_ADDRESS, amountUint256.low.toString(), amountUint256.high.toString()],
        },
        {
          contractAddress: ACTIONS_CONTRACT_ADDRESS,
          entrypoint: "place_wager",
          calldata: [activeRaceId, knightId, amountUint256.low.toString()],
        }
      ]);
    } catch (error) {
      console.error(`Wager on Knight ${knightId} failed:`, error);
    } finally {
      setExecutingAction(null);
    }
  };

  const handleClaim = async () => {
    if (!account) return alert("Connect wallet first!");
    if (!activeRaceId) return alert("No active race state found.");

    setExecutingAction("claim");
    try {
      await account.execute([{
        contractAddress: ACTIONS_CONTRACT_ADDRESS,
        entrypoint: "claim_reward",
        calldata: [activeRaceId],
      }]);
    } catch (error) {
      console.error("Claim failed:", error);
    } finally {
      setExecutingAction(null);
    }
  };

  // --- Render ---

  return (
    <div className="admin-panel">
      <div className="admin-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* WAGERS (Hidden if locked or no wallet) */}
        {showWagers && (
          <div className="admin-section">
            <h4>Place a wager (0.1 Testnet $STRK)</h4>
            <div className="wager-grid">
              {[1, 2, 3, 4].map(id => (
                <button 
                  key={id}
                  className="btn-admin-wager" 
                  onClick={() => handleWager(id)}
                  disabled={executingAction !== null}
                >
                  {executingAction === `wager-${id}` ? "..." : `Knight ${id}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GAME LOOP (Hidden if not creator, race finished, or no wallet) */}
        {showGameLoop && (
          <div className="admin-section">
            <h4>Race Creator Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className="btn-admin-action simulate" 
                onClick={handleLockBetting}
                disabled={executingAction !== null || !isOpenForWagers}
              >
                {executingAction === "lock" ? "Executing..." : "Lock Betting"}
              </button>
              <button 
                className="btn-admin-action simulate" 
                onClick={handleResolveRace}
                disabled={executingAction !== null || !isRunning}
              >
                {executingAction === "resolve" ? "Executing..." : "Resolve Race"}
              </button>
            </div>
          </div>
        )}

        {/* PAYOUTS (Hidden if no wallet) */}
        {showPayouts && (
          <div className="admin-section">
            {hasClaimed ? (
              <div style={{ padding: '1.5rem', background: '#1a2e1a', borderRadius: '8px', border: '1px solid #4CAF50', textAlign: 'center' }}>
                <span className="rewards-claimed-label" style={{ fontSize: '1.25rem', color: '#4CAF50', fontWeight: '800' }}>
                  ✅ Rewards Claimed
                </span>
              </div>
            ) : isFinished ? (
              /* PHASE 2: The race is over, let's check outcomes */
              userWager ? (
                isWinner ? (
                  /* User won and hasn't claimed yet */
                  <button 
                    className="btn-admin-action claim" 
                    onClick={handleClaim} 
                    disabled={executingAction !== null} 
                    style={{ fontSize: '1.1rem', height: '50px' }}
                  >
                    {executingAction === "claim" ? "Executing..." : "Claim Rewards"}
                  </button>
                ) : (
                  /* User wagered but their knight lost */
                  <div style={{ padding: '1.5rem', background: 'rgba(244, 67, 54, 0.1)', border: '1px solid #f44336', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ color: '#f44336', fontSize: '1.1rem', fontWeight: '800', textTransform: 'uppercase' }}>
                      YOUR KNIGHT DID NOT WIN
                    </span>
                  </div>
                )
              ) : (
                /* User never placed a bet in this specific race */
                <div style={{ padding: '1.25rem', background: '#222', border: '1px solid #444', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ color: '#888', fontSize: '1rem', fontWeight: '600' }}>
                    YOU DID NOT WAGER IN THIS RACE
                  </span>
                </div>
              )
            ) : (
              /* PHASE 3: Race is still active or initialized */
              <button 
                className="btn-admin-action claim" 
                disabled={true}
                style={{ fontSize: '1.1rem', height: '50px' }}
              >
                {executingAction === "claim" ? "Executing..." : "Claim Rewards"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}