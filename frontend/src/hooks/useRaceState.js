// File: dojo-jam/frontend/src/hooks/useRaceState.js
import { useState, useEffect } from 'react';
import { request, gql } from 'graphql-request';

const TORII_URL = import.meta.env.VITE_TORII_URL;

// Define the query using the gql tag for syntax highlighting/tooling support
const GET_RACE_STATE = gql`
  query GetRaceState {
    knightRaceRaceModels(limit: 100) {
      edges {
        node {
          distance
          race_id
          state
          total_pool
          winning_pool
          fee_token
          creator
        }
      }
    }
    knightRaceKnightModels(limit: 100) {
      edges {
        node {
          knight_id
          position
          race_id
          total_wagered
          rank
        }
      }
    }
    knightRaceWagerModels(limit: 100) {
      edges {
        node {
          player
          amount
          knight_id
          race_id
          reward
        }
      }
    }
  }
`;

export const useRaceState = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await request(TORII_URL, GET_RACE_STATE);
        setData(response);
        setError(null);
      } catch (err) {
        console.error("Torii Polling Error:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Poll every 2 seconds to avoid spamming Sepolia/Torii too hard
    const interval = setInterval(fetchData, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // 1. Map the arrays first
  const races = data?.knightRaceRaceModels?.edges.map(e => e.node) || [];
  const knights = data?.knightRaceKnightModels?.edges.map(e => e.node) || [];
  const wagers = data?.knightRaceWagerModels?.edges.map(e => e.node) || [];

  if (races.length > 0) {
    console.log("🏇 PARSED RACES ARRAY:", races);
  } else if (data) {
    console.log("⚠️ Data received, but races array is empty.");
  }

  // 2. Find the active race (highest race_id)
  const activeRace = races.length > 0 
    ? [...races].sort((a, b) => b.race_id - a.race_id)[0] 
    : null;

  // 3. Return everything your App.jsx is expecting
  return { 
    races,
    activeRace, // Now App.jsx can destructure this!
    knights,
    wagers,
    loading,
    error 
  };
};