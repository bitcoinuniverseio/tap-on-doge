# Security policy

## Reporting a vulnerability

Report vulnerabilities privately through GitHub private vulnerability reporting:

**<https://github.com/bitcoinuniverseio/tap-on-doge/security/advisories/new>**

Do not open a public issue for a vulnerability, and do not post one in a public channel.

Please include what you observed, how to reproduce it, and what you believe the impact is. If a
payload or a transaction is involved, include it verbatim.

## Scope

This repository is documentation. Findings that belong here include:

- A documented rule that does not match the behaviour of a conforming indexer.
- A test vector whose stated outcome is wrong.
- A validator result that would lead a reader to inscribe an invalid payload, or to reject a valid
  one.
- An example address, payload, or envelope that is unsafe to copy.

Findings that belong elsewhere:

- **The TAP protocol itself:** report to [Trac Systems](https://github.com/Trac-Systems), which
  owns the [Dogecoin TAP specification](https://github.com/Trac-Systems/doge-tap-protocol-specs).
- **A Bitcoin Universe product:** report through that product's own security policy.

Where a finding touches both this documentation and the protocol, report it in both places.

## What this documentation is not

It is not an audit of any indexer, wallet, or marketplace, and it does not certify third-party
tools. Where it states that Bitcoin Universe supports an action, that statement is drawn from the
protocol registry and generated capability snapshot in the Bitcoin Universe codebase, not from a
release guarantee.
