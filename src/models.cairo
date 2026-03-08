use starknet::ContractAddress;
use dojo::model::Model;

pub mod RaceState {
    pub const UNDEFINED: u8 = 0;
    pub const WAGERING: u8 = 1;
    pub const RACING: u8 = 2;
    pub const FINISHED: u8 = 3;
}

#[dojo::model]
#[derive(Copy, Drop, Serde)]
pub struct Race {
    #[key]
    pub race_id: u32,
    pub state: u8, // 0 = Undefined, 1 = Wagering, 2 = Racing, 3 = Finished
    pub creator: ContractAddress,   // Tracks who spawned the lobby
    pub fee_token: ContractAddress, // The token required for wagers in this lobby
    pub total_pool: u128,
    pub winning_pool: u128,
    pub distance: u32,              // Kept your existing distance tracking
}

#[dojo::model]
#[derive(Copy, Drop, Serde)]
pub struct Knight {
    #[key]
    pub race_id: u32,
    #[key]
    pub knight_id: u8,
    pub position: u32,
    pub total_wagered: u128,
    pub rank: u8, // what place did the knight finish in the race
}

#[dojo::model]
#[derive(Copy, Drop, Serde)]
pub struct Wager {
    #[key]
    pub race_id: u32,
    #[key]
    pub player: ContractAddress,
    pub knight_id: u8,
    pub amount: u128,
    pub reward: u128
}

#[dojo::model]
#[derive(Copy, Drop, Serde)]
pub struct GameTracker {
    #[key]
    pub id: u8, // We will always use '1' for this
    pub current_race_id: u32,
}