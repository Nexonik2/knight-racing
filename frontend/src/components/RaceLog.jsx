// frontend/src/components/RaceLog.jsx
import React from "react";

const RaceLog = ({ races, selectedRaceId, onSelectRace, loading }) => {
  
  const getStatusStyle = (state) => {
    switch (state) {
      case 1: return { label: "OPEN FOR WAGERS", color: "#4CAF50" }; // Green
      case 2: return { label: "BETTING LOCKED", color: "#FFC107" };  // Yellow
      case 3: return { label: "RACE FINISHED", color: "#888" };      // Default Gray
      default: return { label: `STATE: ${state}`, color: "#aaa" };
    }
  };

  if (loading) return <p style={{ padding: '1rem', color: '#666' }}>Loading races...</p>;
  if (!races || races.length === 0) return <p style={{ padding: '1rem', color: '#888' }}>No races found.</p>;

  return (
    <div className="race-log-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {races.map((race) => {
        const status = getStatusStyle(race.state);
        const isActive = selectedRaceId === race.race_id;

        return (
          <div 
            key={race.race_id} 
            onClick={() => onSelectRace(race.race_id)}
            style={{ 
              padding: '1rem', 
              background: isActive ? '#2a2a32' : '#151515', 
              cursor: 'pointer',
              borderRadius: '8px',
              border: isActive ? '1px solid #4CAF50' : '1px solid transparent',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Subtle left-border accent for the current race */}
            {isActive && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#4CAF50' }} />}
            
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#fff', fontSize: '0.95rem' }}>
              Race #{race.race_id}
            </h4>
            
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 'bold', 
              color: status.color,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {status.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default RaceLog;