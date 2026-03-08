// frontend/src/components/RacePodium.jsx
import React from "react";

// Exported so you can import { KNIGHT_EMOJIS } into AdminPanel.jsx
export const KNIGHT_EMOJIS = {
  1: "🗡️", // Sword
  2: "🛡️", // Shield
  3: "🪓", // Axe
  4: "🏹", // Bow
};

const RacePodium = ({ knights, activeRace, userWager, hasClaimed }) => {
  if (!knights || knights.length === 0 || !activeRace) return null;

  const winningKnight = knights.find(k => k.rank === 1 || k.position >= activeRace.distance);
  const didUserWin = userWager && winningKnight && userWager.knight_id === winningKnight.knight_id;

  // --- Race State Progress Bar Logic ---
  const steps = [
    { id: 0, label: "Initialized" },
    { id: 1, label: "Wagers Open" },
    { id: 2, label: "Wagers Closed" },
    { id: 3, label: "Finished" },
  ];
  const currentStep = activeRace.state || 0;

  return (
    <div className="podium-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      
      {/* Visual Progress Stepper */}
      <div className="race-progress-container" style={{ position: 'relative', width: '100%', padding: '0 1rem', marginTop: '1rem' }}>
        
        {/* Inner wrapper to tightly contain the flex items and absolute lines */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          
          {/* Background Track - Anchored to the exact centers of the 60px node wrappers */}
          <div style={{ position: 'absolute', top: '12px', left: '30px', right: '30px', height: '4px', background: '#333', zIndex: 0 }} />
          
          {/* Active Fill Track - Mathematically divides the remaining space into 3 exact segments */}
          <div style={{ 
            position: 'absolute', 
            top: '12px', 
            left: '30px', 
            width: `calc((100% - 60px) * ${Math.min(currentStep, 3) / 3})`, 
            height: '4px', 
            background: '#4CAF50', 
            zIndex: 0, 
            transition: 'width 0.5s ease-in-out' 
          }} />
          
          {steps.map((step) => {
            const isActive = currentStep >= step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, width: '60px' }}>
                <div style={{ 
                  width: '28px', height: '28px', borderRadius: '50%', 
                  background: isActive ? '#4CAF50' : '#1a1a24', // Uses dashboard background to "hide" the line running behind it
                  border: isActive ? '4px solid #4CAF50' : '4px solid #444',
                  transition: 'all 0.3s ease',
                  boxShadow: isCurrent ? '0 0 12px #4CAF50' : 'none',
                  display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                  {isActive && <span style={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                </div>
                {/* Position text absolutely so long labels don't break the 60px flex spacing */}
                <span style={{ 
                  position: 'absolute', top: '35px',
                  fontSize: '0.75rem', 
                  color: isActive ? '#fff' : '#666', 
                  fontWeight: isActive ? 'bold' : 'normal', 
                  textTransform: 'uppercase', letterSpacing: '1px',
                  whiteSpace: 'nowrap'
                }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* The Knight Leaderboards */}
      <div className="podium-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {knights.map((knight) => {
          const isUserChoice = userWager?.knight_id === knight.knight_id;
          const isWinner = activeRace.state === 3 && (knight.rank === 1 || knight.position >= activeRace.distance);
          const emoji = KNIGHT_EMOJIS[knight.knight_id] || "🏇";

          return (
            <div 
              key={knight.knight_id}
              className={`knight-lane ${isWinner ? 'winner-glow' : ''}`}
              style={{
                padding: '1rem 1.5rem',
                background: isUserChoice ? '#1a2e1a' : '#2a2a32',
                borderRadius: '8px',
                border: isUserChoice ? '2px solid #4CAF50' : '1px solid #444',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: isWinner ? '0 0 15px rgba(255, 215, 0, 0.4)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem' }}>{emoji}</span>
                <strong style={{ fontSize: '1.2rem', color: isWinner ? '#ffd700' : '#fff' }}>Knight {knight.knight_id}</strong>
                {isUserChoice && (
                  <span style={{ fontSize: '0.7rem', background: '#4CAF50', color: '#fff', padding: '3px 8px', borderRadius: '4px', letterSpacing: '1px', fontWeight: 'bold' }}>
                    YOUR WAGER
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {activeRace.state === 3 ? (
                  <span style={{ fontSize: '1.5rem', fontWeight: '900', color: isWinner ? '#ffd700' : '#888' }}>
                    {knight.rank === 1 ? '1ST 🏆' : knight.rank === 2 ? '2ND' : knight.rank === 3 ? '3RD' : `${knight.rank}TH`}
                  </span>
                ) : (
                  <div className="progress-track" style={{ width: '120px', height: '8px', borderRadius: '4px', border: '1px solid #333' }}>
                    <div style={{ 
                      width: `${Math.min(100, (knight.position / activeRace.distance) * 100)}%`, 
                      height: '100%', 
                      background: isUserChoice ? '#4CAF50' : '#888', 
                      borderRadius: '4px',
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {didUserWin && activeRace.state === 3 && !hasClaimed && (
          <div className="victory-banner" style={{ textAlign: 'center', padding: '1rem', background: '#ffd700', color: '#000', borderRadius: '8px', fontWeight: '900', marginTop: '1rem', letterSpacing: '2px', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)' }}>
            🏆 VICTORY! CLAIM YOUR REWARDS BELOW 🏆
          </div>
        )}
      </div>
      
    </div>
  );
};

export default RacePodium;