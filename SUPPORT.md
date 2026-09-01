# Support

## Questions about this documentation

Open an issue: <https://github.com/bitcoinuniverseio/tap-on-doge/issues>

Useful things to include: the page and section, what you expected, and what you found. If a
payload is involved, paste it verbatim.

## Questions about the TAP protocol

TAP is a protocol of [Trac Systems](https://github.com/Trac-Systems). The Dogecoin rules live at
[doge-tap-protocol-specs](https://github.com/Trac-Systems/doge-tap-protocol-specs), which also
links the project community channels.

## Questions about a Bitcoin Universe product

Start at the [Bitcoin Universe documentation portal](https://docs.bitcoinuniverse.io).

## Before you ask

A few questions come up constantly and are answered on the site:

- **My inscription confirmed but my balance did not change.** Check the operation name first. TAP
  prefixes its token operations: `token-mint`, not `mint`. See the
  [guide](https://bitcoinuniverseio.github.io/tap-on-doge/guide.html#bad-op).
- **I inscribed a token-transfer but the recipient got nothing.** A `token-transfer` has no
  recipient. It parks an amount in an inscription you still hold; you then send that inscription.
  See the [guide](https://bitcoinuniverseio.github.io/tap-on-doge/guide.html#transfer).
- **Two indexers disagree about my balance.** Compare their indexed heights before anything else.
  See the [reference](https://bitcoinuniverseio.github.io/tap-on-doge/reference.html#universe).
- **How many confirmations should I wait for?** Not the number you use on Bitcoin. Six
  confirmations is about six minutes here. Use the
  [comparator](https://bitcoinuniverseio.github.io/tap-on-doge/validator.html#comparator).
- **My inscriber produces transactions that inscribe nothing.** If it was ported from Bitcoin it
  is probably building an `OP_FALSE OP_IF` witness envelope, which decodes to nothing on Dogecoin.
  See the [specification](https://bitcoinuniverseio.github.io/tap-on-doge/spec.html#envelope).

## Security

Do not report vulnerabilities through issues. See [SECURITY.md](SECURITY.md).
