# TAP on Doge

Protocol documentation for **TAP on Dogecoin mainnet**: the TAP token protocol from the Trac
ecosystem, carried by Doginals inscriptions.

**Site:** <https://bitcoinuniverseio.github.io/tap-on-doge/>

TAP on Doge shares its operation names with TAP on Bitcoin and very little else. This
documentation stands alone: a reader who has never seen the Bitcoin site can use it, and every
place the two chains differ is stated concretely rather than in general terms.

| | |
| --- | --- |
| Chain and network | Dogecoin mainnet |
| Protocol tag | `p: "tap"` |
| Registry id | `tap_doge` |
| Document version | 1.0.0 |
| Lifecycle | Experimental |
| Origin | [Trac Systems](https://github.com/Trac-Systems), not Bitcoin Universe |
| Protocol rules | [Trac-Systems/doge-tap-protocol-specs](https://github.com/Trac-Systems/doge-tap-protocol-specs) |
| Doginals client of record | [Trac-Systems/ord-dogecoin](https://github.com/Trac-Systems/ord-dogecoin) |

## Pages

| Page | What it covers |
| --- | --- |
| [Overview](https://bitcoinuniverseio.github.io/tap-on-doge/) | What the protocol is, what Dogecoin changes, the operation list, verified product support |
| [Specification](https://bitcoinuniverseio.github.io/tap-on-doge/spec.html) | Numbered rules: envelope, payload, identifiers, tapping, operations, state, activations, invalid conditions |
| [Guide](https://bitcoinuniverseio.github.io/tap-on-doge/guide.html) | Worked mint, transfer and batch send; confirmation counts; the mistakes that cost money |
| [Reference](https://bitcoinuniverseio.github.io/tap-on-doge/reference.html) | Terminology, confirmation, mempool and reorg semantics, fees, limitations, security, checklist |
| [Test vectors](https://bitcoinuniverseio.github.io/tap-on-doge/vectors.html) | Accepted and rejected envelopes and payloads, address vectors, state transitions |
| [Validator](https://bitcoinuniverseio.github.io/tap-on-doge/validator.html) | Client-side payload validator and confirmation time comparator |
| [Changelog](https://bitcoinuniverseio.github.io/tap-on-doge/changelog.html) | Document history and Dogecoin protocol activation heights |

## Operations

Every TAP token operation name is prefixed. A payload carrying `p: "tap"` with a bare `mint` or
`transfer` confirms on chain, costs a full Dogecoin fee, and is then indexed by nobody: no TAP
indexer recognises the name, and no DRC-20 indexer claims the message because the tag is not
`drc-20`.

- **External:** `token-deploy`, `token-mint`, `token-transfer`
- **Internal:** `token-send`, `block-transferables`, `unblock-transferables`, `token-trade`, `token-auth`, `privilege-auth`
- **DMT:** `dmt-deploy`, `dmt-mint`

## What Dogecoin changes

| Concern | TAP on Bitcoin | TAP on Doge |
| --- | --- | --- |
| Block target | 10 minutes | 1 minute, so six confirmations is about six minutes |
| Inscription carrier | Taproot witness envelope | Push data in the signature script of input 0 |
| Byte economics | Witness bytes at one quarter weight | No witness, no discount, full rate on every byte |
| Large content | One reveal transaction | A chain of transactions; an interrupted chain indexes as nothing |
| Addresses | Bech32m ordinals address | Base58check payment address, version `0x1e` or `0x16`, case-sensitive |
| Reorg window | 40 to 49 blocks is 7 to 8 hours | 40 to 49 blocks is under an hour |

A Bitcoin `OP_FALSE OP_IF` envelope decodes to nothing on Dogecoin: the parser accepts push
opcodes only, and `OP_IF` is not one.

## Bitcoin Universe product support

Verified against the protocol registry and the generated capability snapshot in the Bitcoin
Universe codebase. Absence means the code does not implement it.

- **Wallet:** view, send, receive
- **Inscribe:** mint
- **Marketplace:** feature gated, external execution. Bitcoin Universe builds and validates the
  exact Dogecoin transaction; your wallet signs it. Settlement requires at least one confirmation
  plus the expected protocol state transition in a later authoritative checkpoint.
- **Not supported:** `sell`. Recorded reason: TAP on Doge has no executable offer workflow on
  this marketplace surface.
- **Coverage:** reported as partial. The pinned reader exposes no Dogecoin mempool feed and
  publishes no block replacement notifications.

## This repository

Static, hand-authored HTML, CSS, and vanilla JavaScript. No build step, no framework, no CDN, no
external fonts, no trackers. All ordinary content works with JavaScript disabled; scripts only add
search, the theme toggle, and the two interactive tools. Deployed by GitHub Pages from `main`.

To work on it, edit the files and open them in a browser. There is nothing to install.

- `docs.manifest.json` declares this repository to the [Bitcoin Universe documentation portal](https://docs.bitcoinuniverse.io).
- `search-index.json` is the hand-authored index behind the local search box.
- `llms.txt` describes the site for automated readers.

## Contributing and support

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SUPPORT.md](SUPPORT.md)
- [SECURITY.md](SECURITY.md): report vulnerabilities privately, never in a public issue.

## Licence

See [LICENSE](LICENSE). TAP is a protocol of Trac Systems; this repository documents it and does
not claim ownership of it.
