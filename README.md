# music-city
npm install

# Start the local replica

dfx generate
dfx start --clean --background
dfx deploy
dfx canister call storage_index setBucket '(principal "uzt4z-lp777-77774-qaabq-cai")'



#frontend
npm run dev