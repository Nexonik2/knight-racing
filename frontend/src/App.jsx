// frontend/src/App.jsx
import React, { useState } from "react";
import { useAccount, useBalance } from "@starknet-react/core";
import { Providers } from "./Providers";
import { WalletControls } from "./components/WalletControls";
import { AdminPanel } from "./components/AdminPanel";
import { useRaceState } from "./hooks/useRaceState";
import DebugDashboard from './components/DebugDashboard';
import RacePodium from "./components/RacePodium";
import RaceLog from "./components/RaceLog";
import "./App.css";

const FEE_TOKEN_ADDRESS = import.meta.env.VITE_WAGER_TOKEN_ADDRESS || "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const ACTIONS_CONTRACT_ADDRESS = import.meta.env.VITE_ACTIONS_ADDRESS;
const SHOW_DEBUG_PANEL = import.meta.env.VITE_SHOW_DEBUG === "true";

function AppContent() {
  const { races, activeRace, knights, wagers, loading } = useRaceState();
  const { account, address, status } = useAccount();

  // Accordion UI State
  const [showLog, setShowLog] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [executingAction, setExecutingAction] = useState(null);
  const [selectedRaceId, setSelectedRaceId] = useState(null);

  const { data: balanceData } = useBalance({
    address,
    token: FEE_TOKEN_ADDRESS,
    watch: true, 
  });

  // Helper to convert hex wei to standard token format (divides by 1e18)
  const formatTokens = (hexValue) => {
    if (!hexValue) return "0.00";
    try {
      const wei = BigInt(hexValue);
      return (Number(wei) / 1e18).toFixed(2);
    } catch (e) {
      return "0.00";
    }
  };

  const getRaceStatusMessage = (state) => {
    switch (state) {
      case 1: return "OPEN FOR WAGERS";
      case 2: return "BETTING LOCKED";
      case 3: return "RACE FINISHED";
      default: return `STATE: ${state}`;
    }
  };

  const handleSpawnRace = async () => {
    if (!account) return alert("Connect wallet first!");
    setExecutingAction("spawn");
    try {
      await account.execute([{
        contractAddress: ACTIONS_CONTRACT_ADDRESS,
        entrypoint: "spawn_race",
        // 2. Pass the fee token to initialize the lobby
        calldata: [FEE_TOKEN_ADDRESS], 
      }]);
    } catch (error) {
      console.error("Spawn Race failed:", error);
    } finally {
      setExecutingAction(null);
    }
  };

  const currentRaceId = selectedRaceId || activeRace?.race_id;
  const displayRace = races?.find(r => r.race_id === currentRaceId) || activeRace;
  
  let displayKnights = knights?.filter(k => k.race_id === currentRaceId) || [];
  if (displayRace?.state === 3) {
    displayKnights.sort((a, b) => a.rank - b.rank);
  }

  const displayWagers = wagers?.filter(w => w.race_id === currentRaceId) || [];
  const currentUserWager = displayWagers.find(w => 
    address && w.player && BigInt(w.player) === BigInt(address)
  );

  const hasClaimed = currentUserWager && BigInt(currentUserWager.amount || 0) === 0n && BigInt(currentUserWager.reward || 0) > 0n;

  return (
    <div className="main-layout">
      
      {/* CENTER COLUMN: Main Game Area */}
      <div className="center-column">
        <div className="app-container">
          <header className="app-header">
            <h1 className="game-title">
              Knight Racing
            </h1>
          </header>
          
          <main className="app-main">
            {loading ? (
              <div className="placeholder-state"><p>Syncing with Torii indexer...</p></div>
            ) : displayRace ? (
              <div className="race-dashboard" style={{ width: '100%' }}>
                
                <div className="status-container" style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1.5rem', background: '#1a1a24', borderRadius: '12px', borderBottom: displayRace.state === 3 ? '4px solid #f44336' : '4px solid #4CAF50' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.85rem' }}>
                    Race ID: #{displayRace.race_id} Status
                  </h3>
                  <h2 style={{ color: displayRace.state === 3 ? '#f44336' : '#4CAF50', margin: 0, fontSize: '2rem' }}>
                    {getRaceStatusMessage(displayRace.state)}
                  </h2>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', color: '#aaa', fontSize: '0.9rem' }}>
                    <span><strong>Total Pool:</strong> {formatTokens(displayRace.total_pool)} STRK</span>
                    {displayRace.state === 3 && (
                      <span style={{ color: '#ffd700' }}><strong>Winning Pool:</strong> {formatTokens(displayRace.winning_pool)} STRK</span>
                    )}
                  </div>
                </div>

                <RacePodium 
                  knights={displayKnights}
                  activeRace={displayRace}
                  userWager={currentUserWager}
                  hasClaimed={hasClaimed}
                />

                <div style={{ marginTop: '1rem' }}>
                  <AdminPanel 
                    activeRaceId={displayRace?.race_id} 
                    raceState={displayRace?.state} 
                    userWager={currentUserWager} 
                    winningKnightId={displayKnights[0]?.knight_id}
                    raceCreator={displayRace?.creator}
                    hasClaimed={hasClaimed}
                  />
                </div>

              </div>
            ) : (
              <div className="placeholder-state">
                <h2>No Active Race</h2>
                <p>Open the Judge Controls below to spawn a new race session.</p>
                <AdminPanel activeRaceId={null} raceState={null} />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Controls, Logs & Debug */}
      <aside className="sidebar-right">
        
        {/* 1. Stacked Non-Game Controls */}
        <div className="sidebar-controls">
          <div className="cartridge-btn-wrapper" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
             <WalletControls />
          </div>

          {address && (
            <div className="token-balance">
              {balanceData ? `${Number(balanceData.formatted).toFixed(2)} STRK` : "Syncing Balance..."}
            </div>
          )}

          {/* Optional Faucet / Claim Testnet Tokens Button */}
          <button className="btn-admin-action" onClick={() => window.open('https://starknet-faucet.vercel.app/', '_blank')} style={{ background: '#222', color: '#fff' }}>
            Get Testnet STRK
          </button>

          <button 
            className="btn-admin-action" 
            onClick={handleSpawnRace} // Move your spawn logic here
            disabled={!address}
            style={{ background: '#4CAF50', color: '#fff', fontSize: '1rem' }}
          >
            Spawn New Race
          </button>
        </div>

        {/* 2. Collapsible Race Log */}
        <div className={`accordion-section ${showLog ? 'expanded' : ''}`}>
          <button className="accordion-header" onClick={() => setShowLog(!showLog)}>
            <span>📋 Race Log</span>
            <span>{showLog ? '▼' : '▶'}</span>
          </button>
          
          {showLog && (
            <div className="accordion-content">
              <RaceLog 
                races={races} 
                selectedRaceId={currentRaceId} 
                onSelectRace={setSelectedRaceId} 
                loading={loading} 
              />
            </div>
          )}
        </div>

        {/* 3. Collapsible Debug Dashboard */}
        <div className={`accordion-section ${showDebug ? 'expanded' : ''}`}>
          <button className="accordion-header" onClick={() => setShowDebug(!showDebug)}>
            <span>⚙️ Debug Dashboard</span>
            <span>{showDebug ? '▼' : '▶'}</span>
          </button>
          
          {showDebug && (
            <div className="accordion-content">
              {SHOW_DEBUG_PANEL ? <DebugDashboard /> : <p style={{ color: '#888' }}>Debug only available in DEV mode.</p>}
            </div>
          )}
        </div>

      </aside>
    </div>
  );
}

function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}

export default App;