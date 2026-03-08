return (
    // Responsive Wrapper: Centers the game, max-width caps it for desktop, 100% allows mobile shrinking
    <div style={{ 
      margin: '30px auto 0 auto', 
      padding: '20px', 
      backgroundColor: '#1e1e1e', 
      width: '100%', 
      maxWidth: '500px', // Caps the width for desktop viewing
      borderRadius: '8px',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2>Race #{raceId}</h2>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '5px 0', color: '#aaa' }}>Status: <strong style={{color: 'white'}}>{stateText[race?.state]}</strong></p>
          <p style={{ margin: '5px 0', color: '#aaa' }}>Pool: <strong style={{color: 'gold'}}>{race?.totalPool}</strong></p>
        </div>
      </div>

      {knights.length > 0 && race && (
        <PixiTrack knights={knights} distance={race.distance} raceState={race.state} />
      )}
      
      <div style={{ marginTop: '15px' }}>
        {knights.map(k => (
          <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '14px', marginBottom: '4px' }}>
            <span>Knight {k.id}</span>
            <span>Pos: {k.position} | Wager: {k.wagered}</span>
          </div>
        ))}
      </div>
    </div>
  );