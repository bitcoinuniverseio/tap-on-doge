# TAP on Doge documentation

Bitcoin Universe documentation for TAP on Doge on Dogecoin.

## What this covers

TAP on Doge uses Dogecoin-native transactions and Doginals-aware tooling. The basic token and DMT fields follow TAP conventions, but address validation, fee funding, and indexing are Dogecoin-specific.

## State model

Do not carry a Bitcoin address, fee rule, or Ordinals wallet assumption into this environment. Build from active Dogecoin token metadata and verify against the Dogecoin indexer that will read the event.

## Documentation site

- Overview: [index.html](index.html)
- Field reference: [reference.html](reference.html)
- Build and verification playbook: [guide.html](guide.html)

## Core rules

- Use Dogecoin mainnet addresses for mainnet transactions.
- Basic TAP asset minting uses token-mint with tick and amt.
- DMT minting uses dmt-mint with deployment identifier, ticker, and block field.
- The deployed asset metadata decides which payload fields are accepted.
- Bitcoin fee and UTXO assumptions do not apply unchanged to Dogecoin.
- Indexing availability is part of the integration surface, so confirm the active Doge reader before broadcast.

## Source material

- [Tapalytics](https://tapalytics.xyz/)
- [TAP protocol documentation](https://docs.tap-protocol.com/)

## Scope

This guide deliberately separates Dogecoin transport rules from Bitcoin TAP conventions. Treat the active Dogecoin indexer as the final compatibility target.
