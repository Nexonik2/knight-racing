#[starknet::interface]
pub trait IActions<T> {
    fn spawn_race(ref self: T, fee_token: starknet::ContractAddress) -> u32;
    fn place_wager(ref self: T, race_id: u32, knight_id: u8, amount: u128);
    fn lock_betting(ref self: T, race_id: u32);
    fn resolve_race(ref self: T, race_id: u32);
    fn claim_reward(ref self: T, race_id: u32);
}

#[starknet::interface]
pub trait IERC20<TState> {
    fn transfer(ref self: TState, recipient: starknet::ContractAddress, amount: u256) -> bool;
    fn transfer_from(ref self: TState, sender: starknet::ContractAddress, recipient: starknet::ContractAddress, amount: u256) -> bool;
    fn balance_of(self: @TState, account: starknet::ContractAddress) -> u256;
}

#[dojo::contract]
pub mod actions {
    use super::IActions;
    use super::{IERC20Dispatcher, IERC20DispatcherTrait};
    use core::poseidon::poseidon_hash_span;
    use starknet::{ContractAddress, get_caller_address, get_contract_address, get_block_info, get_tx_info};
    use knight_race::models::{Race, Knight, Wager, RaceState, GameTracker};
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
    
    use dojo::model::{ModelStorage, ModelValueStorage};

    // THE FIX: Restoring the namespace helper trait we accidentally deleted
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"knight_race")
        }
    }

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn spawn_race(ref self: ContractState, fee_token: ContractAddress) -> u32 {
            let mut world = self.world_default();
            let mut tracker: GameTracker = world.read_model(1_u8);
            
            tracker.current_race_id += 1;
            let new_race_id = tracker.current_race_id;

            world.write_model(@tracker);

            // Capture the wallet address calling the function
            let caller = get_caller_address();

            // Initialize the Race
            let race       = Race {
                race_id: new_race_id,
                state: RaceState::WAGERING,
                creator: caller,       // Assign the spawner
                fee_token: fee_token,  // Assign the dynamic token
                total_pool: 0,
                winning_pool: 0,
                distance: 10,
            };
            world.write_model(@race);

            // Initialize the 4 Knights (Unchanged)
            let mut i: u8 = 1;
            while i <= 4 {
                world.write_model(@Knight {
                    race_id: new_race_id,
                    knight_id: i,
                    position: 0,
                    total_wagered: 0,
                    rank: 0
                });
                i += 1;
            };

            new_race_id
        }

        fn place_wager(
            ref self: ContractState, 
            race_id: u32, 
            knight_id: u8, 
            amount: u128
            // token_address parameter removed entirely
        ) {
            let mut world = self.world_default();
            let player = get_caller_address();
            let this_contract = get_contract_address();

            // 1. Read the race state to ensure betting is open
            let mut race: Race = world.read_model(race_id);
            assert(race.state == RaceState::WAGERING, 'Invalid race/betting is closed');
            assert(knight_id >= 1 && knight_id <= 4, 'Invalid knight ID');
            assert(amount > 0, 'Wager must be > 0');

            // 2. Read the knight and wager models
            let mut knight: Knight = world.read_model((race_id, knight_id));
            let mut wager: Wager = world.read_model((race_id, player));

            // Prevent splitting bets across multiple knights for the MVP
            assert(wager.amount == 0 || wager.knight_id == knight_id, 'You can only bet on one knight');

            // 3. Escrow Execution: Pull approved tokens into the contract using the Race's fee_token
            let erc20 = IERC20Dispatcher { contract_address: race.fee_token };
            
            let transfer_success = erc20.transfer_from(
                player,
                this_contract,
                amount.into() // Casts u128 to u256 for the ERC20 standard
            );
            assert(transfer_success, 'ERC20 transfer failed');

            // 4. Update the values
            race.total_pool += amount;
            knight.total_wagered += amount;
            wager.knight_id = knight_id;
            wager.amount += amount;
            wager.reward = 0;

            // 5. Write everything back to the world
            world.write_model(@race);
            world.write_model(@knight);
            world.write_model(@wager);
        }

        fn lock_betting(ref self: ContractState, race_id: u32) {
            let mut world = self.world_default();
            // 1. Read the current race model
            let mut race: Race = world.read_model(race_id);
            
            // 2. Ensure it's currently in Wagering state
            assert(race.state == RaceState::WAGERING, 'Not in wagering state');
            
            // 3. Move to Racing state (2)
            race.state = RaceState::RACING;
            
            // 4. Write back to World
            world.write_model(@race);
        }

        fn resolve_race(ref self: ContractState, race_id: u32) {
            let mut world = self.world_default();
            let mut race: Race = world.read_model(race_id);

            assert(race.state == RaceState::RACING, 'Race is not locked');

            // 1. Fetch environment variables for entropy
            let block_info = get_block_info().unbox();
            let tx_info = get_tx_info().unbox();

            let mut hash_data: Array<felt252> = ArrayTrait::new();
            hash_data.append(race_id.into());
            hash_data.append(block_info.block_timestamp.into());
            hash_data.append(block_info.block_number.into());
            hash_data.append(tx_info.transaction_hash);
            // generate random seed
            let pseudo_seed: felt252 = poseidon_hash_span(hash_data.span());
            let seed: u256 = pseudo_seed.into();

            // 2. Load the Knights
            let mut k1: Knight = world.read_model((race_id, 1_u8));
            let mut k2: Knight = world.read_model((race_id, 2_u8));
            let mut k3: Knight = world.read_model((race_id, 3_u8));
            let mut k4: Knight = world.read_model((race_id, 4_u8));

            let max_loops: u8 = 64;
            let mut loop_count: u8 = 0;
            let mut current_seed = seed;
            
            // 3. The REAL Race Loop
            while loop_count < max_loops {
                let move1: u32 = (current_seed % 2_u256).try_into().unwrap();
                current_seed /= 2_u256;
                let move2: u32 = (current_seed % 2_u256).try_into().unwrap();
                current_seed /= 2_u256;
                let move3: u32 = (current_seed % 2_u256).try_into().unwrap();
                current_seed /= 2_u256;
                let move4: u32 = (current_seed % 2_u256).try_into().unwrap();
                current_seed /= 2_u256;

                k1.position += move1;
                k2.position += move2;
                k3.position += move3;
                k4.position += move4;

                if k1.position >= race.distance || k2.position >= race.distance || 
                k3.position >= race.distance || k4.position >= race.distance {
                    break;
                }
                loop_count += 1;
            };

            // 4. Calculate Ranks (Tie-Aware Algorithm)
            // Rank = 1 + (number of knights with a strictly greater position)
            
            let mut r1: u8 = 1;
            if k2.position > k1.position { r1 += 1; }
            if k3.position > k1.position { r1 += 1; }
            if k4.position > k1.position { r1 += 1; }
            k1.rank = r1;

            let mut r2: u8 = 1;
            if k1.position > k2.position { r2 += 1; }
            if k3.position > k2.position { r2 += 1; }
            if k4.position > k2.position { r2 += 1; }
            k2.rank = r2;

            let mut r3: u8 = 1;
            if k1.position > k3.position { r3 += 1; }
            if k2.position > k3.position { r3 += 1; }
            if k4.position > k3.position { r3 += 1; }
            k3.rank = r3;

            let mut r4: u8 = 1;
            if k1.position > k4.position { r4 += 1; }
            if k2.position > k4.position { r4 += 1; }
            if k3.position > k4.position { r4 += 1; }
            k4.rank = r4;

            // 5. Finalize and Save
            race.state = RaceState::FINISHED;
            world.write_model(@race);
            world.write_model(@k1);
            world.write_model(@k2);
            world.write_model(@k3);
            world.write_model(@k4);

            // NEW: Calculate and store the winning pool once!
            let mut final_winning_pool: u128 = 0;
            if k1.rank == 1 { final_winning_pool += k1.total_wagered; }
            if k2.rank == 1 { final_winning_pool += k2.total_wagered; }
            if k3.rank == 1 { final_winning_pool += k3.total_wagered; }
            if k4.rank == 1 { final_winning_pool += k4.total_wagered; }

            race.winning_pool = final_winning_pool;
            race.state = RaceState::FINISHED;
            
            world.write_model(@race);
            world.write_model(@k1);
            world.write_model(@k2);
            world.write_model(@k3);
            world.write_model(@k4);
        }

        fn claim_reward(ref self: ContractState, race_id: u32) {
            let mut world = self.world_default();
            let player = starknet::get_caller_address();

            // 1. Verify the race is actually finished
            let race: Race = world.read_model(race_id);
            assert(race.state == RaceState::FINISHED, 'Race is not finished');

            // 2. Load the player's wager
            let mut wager: Wager = world.read_model((race_id, player));
            
            // If amount is 0, they either didn't bet, or they already claimed it.
            assert(wager.amount > 0, 'No wager or already claimed');

            // 3. Load the knight they bet on
            let player_knight: Knight = world.read_model((race_id, wager.knight_id));
            
            // 4. Verify their knight won (Rank 1)
            assert(player_knight.rank == 1, 'Your knight did not win');
            assert(race.winning_pool > 0, 'No wagers placed on winners');

            // 5. Calculate their slice of the pie
            let payout: u256 = (wager.amount.into() * race.total_pool.into()) / race.winning_pool.into();

            // 6. Zero out the wager to prevent double-spending
            wager.amount = 0;
            wager.reward = payout.try_into().unwrap(); // converts u256 back to u128
            world.write_model(@wager);

            // 7. Actual Token Transfer
            // 
            let erc20 = IERC20Dispatcher { contract_address: race.fee_token };
            
            // Cast payout (u128) to u256 for the ERC20 transfer
            erc20.transfer(player, payout.into());
        }
    }
}