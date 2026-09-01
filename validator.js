/* TAP on Doge payload validator and confirmation comparator.
   Everything runs in this browser tab. Nothing you paste is sent anywhere,
   stored, or logged. Rules follow the Dogecoin TAP specification and the
   behaviour of the Bitcoin Universe Dogecoin TAP source, document version 1.0.0,
   Dogecoin mainnet. */
(function () {
  "use strict";

  /* ================= constants ================= */

  var OPS = {
    "token-deploy": "Create a ticker with a maximum supply and an optional per-mint limit.",
    "token-mint": "Mint from a deployed ticker, within its per-mint limit.",
    "token-transfer": "Park an amount as a transfer inscription that can then be sent.",
    "token-send": "Move many amounts of many tickers to many recipients in one tapped inscription.",
    "block-transferables": "Disable incoming inscribe transfers for the tapping address.",
    "unblock-transferables": "Re-enable incoming inscribe transfers for the tapping address.",
    "token-trade": "Create, cancel, or fill an inscription-based trade.",
    "token-auth": "Create, use, or cancel a signing authority that issues redeems.",
    "privilege-auth": "Create or cancel a privilege authority, or record a hashed verification.",
    "dmt-deploy": "Deploy a Digital Matter Theory token against an element inscription.",
    "dmt-mint": "Mint a Digital Matter Theory token for one block height."
  };

  var WRONG_OP = {
    "deploy": "token-deploy",
    "mint": "token-mint",
    "transfer": "token-transfer",
    "send": "token-send",
    "trade": "token-trade",
    "auth": "token-auth"
  };

  var TICKER_RELAX_HEIGHT = 5487639;
  var DMT_PRECISE_HEIGHT = 5497100;
  var CHUNK = 520;

  /* ================= sha256 (for base58check) ================= */

  var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

  function sha256(bytes) {
    var h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var l = bytes.length;
    var withPad = l + 9;
    var total = Math.ceil(withPad / 64) * 64;
    var m = new Uint8Array(total);
    m.set(bytes);
    m[l] = 0x80;
    var bits = l * 8;
    for (var i = 0; i < 4; i++) m[total - 1 - i] = (bits >>> (8 * i)) & 0xff;
    var w = new Uint32Array(64);
    for (var off = 0; off < total; off += 64) {
      for (var t = 0; t < 16; t++) {
        w[t] = (m[off + t * 4] << 24) | (m[off + t * 4 + 1] << 16) | (m[off + t * 4 + 2] << 8) | m[off + t * 4 + 3];
      }
      for (t = 16; t < 64; t++) {
        var s0 = rr(w[t - 15], 7) ^ rr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        var s1 = rr(w[t - 2], 17) ^ rr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (t = 0; t < 64; t++) {
        var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (hh + S1 + ch + K[t] + w[t]) >>> 0;
        var S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    var res = new Uint8Array(32);
    for (i = 0; i < 8; i++) {
      res[i * 4] = (h[i] >>> 24) & 0xff; res[i * 4 + 1] = (h[i] >>> 16) & 0xff;
      res[i * 4 + 2] = (h[i] >>> 8) & 0xff; res[i * 4 + 3] = h[i] & 0xff;
    }
    return res;
  }
  function rr(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }

  var B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  function b58decode(str) {
    var bytes = [0];
    for (var i = 0; i < str.length; i++) {
      var v = B58.indexOf(str[i]);
      if (v < 0) return null;
      var carry = v;
      for (var j = 0; j < bytes.length; j++) {
        carry += bytes[j] * 58;
        bytes[j] = carry & 0xff;
        carry >>= 8;
      }
      while (carry > 0) { bytes.push(carry & 0xff); carry >>= 8; }
    }
    for (i = 0; i < str.length && str[i] === "1"; i++) bytes.push(0);
    return new Uint8Array(bytes.reverse());
  }

  /* Returns { ok, version, reason } for a Dogecoin mainnet base58check address. */
  function checkDogeAddress(addr) {
    if (typeof addr !== "string" || !addr) return { ok: false, reason: "not a string" };
    var s = addr;
    if (s !== s.trim()) return { ok: false, reason: "has leading or trailing whitespace" };
    if (/^(bc1|tb1|bcrt1)/i.test(s)) return { ok: false, reason: "is a Bitcoin bech32 address, not a Dogecoin address", btc: true };
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(s)) return { ok: false, reason: "looks like a Bitcoin base58 address, not a Dogecoin address", btc: true };
    var raw = b58decode(s);
    if (!raw) return { ok: false, reason: "contains characters outside the base58 alphabet" };
    if (raw.length !== 25) return { ok: false, reason: "does not decode to 25 bytes" };
    var body = raw.subarray(0, 21);
    var sum = sha256(sha256(body));
    for (var i = 0; i < 4; i++) if (sum[i] !== raw[21 + i]) return { ok: false, reason: "fails its base58check checksum" };
    if (raw[0] === 0x1e) return { ok: true, version: "0x1e", kind: "P2PKH (D…)" };
    if (raw[0] === 0x16) return { ok: true, version: "0x16", kind: "P2SH (9… or A…)" };
    return { ok: false, reason: "has version byte 0x" + raw[0].toString(16) + ", which is not Dogecoin mainnet" };
  }

  /* ================= payload validation ================= */

  function F(sev, msg) { return { sev: sev, msg: msg }; }

  function isPlainObject(v) { return v && typeof v === "object" && !Array.isArray(v); }

  function amountShape(v, label, f) {
    if (typeof v === "number") {
      f.push(F("w", label + " is a JSON number. Every published TAP example other than the privileged mint uses a decimal string, and a JSON number cannot carry a large supply without rounding. Quote it."));
      if (!isFinite(v) || v < 0) f.push(F("e", label + " is not a finite non-negative number."));
      return;
    }
    if (typeof v !== "string") { f.push(F("e", label + " must be a decimal string.")); return; }
    if (v !== v.trim()) f.push(F("e", label + " has leading or trailing whitespace."));
    if (!/^\d+(\.\d+)?$/.test(v.trim())) {
      f.push(F("e", label + ' is not a plain decimal string. Expected digits with at most one "." and no sign, exponent, comma, or unit.'));
    } else if (/^0\d/.test(v.trim())) {
      f.push(F("w", label + " has a leading zero. Indexers compare amounts numerically, but a leading zero is a sign of hand assembly."));
    }
  }

  function tickerShape(v, f) {
    if (typeof v !== "string") { f.push(F("e", '"tick" must be a string.')); return; }
    if (v !== v.trim()) f.push(F("e", '"tick" has leading or trailing whitespace.'));
    var t = v.trim();
    var len = Array.from(t).length;
    if (len === 0) { f.push(F("e", '"tick" is empty.')); return; }
    if (len > 32) f.push(F("e", '"tick" is ' + len + " Unicode symbols. The Dogecoin TAP limit is 32."));
    if (len !== 3 && (len < 5 || len > 32)) {
      f.push(F("w", '"tick" is ' + len + " symbols. Dogecoin TAP allowed only 3, or 5 to 32, until block " +
        TICKER_RELAX_HEIGHT.toLocaleString("en-US") + "; 1 to 32 is allowed from that block onward. A deployment older than that height cannot have this length."));
    }
    if (t !== t.toLowerCase()) {
      f.push(F("i", '"tick" contains uppercase symbols. TAP tickers are compared case-insensitively; indexers lowercase them.'));
    }
    if (t.charAt(0) === "-") {
      f.push(F("i", 'A leading "-" marks a cursed-inscription ticker. It is a distinct ticker from the same name without the dash.'));
    }
  }

  function requireKeys(obj, keys, f, opName) {
    for (var i = 0; i < keys.length; i++) {
      if (!(keys[i] in obj)) f.push(F("e", '"' + opName + '" requires "' + keys[i] + '", which is missing.'));
    }
  }

  function checkPrv(prv, f) {
    if (typeof prv === "string") {
      if (!/^[0-9a-f]{64}i\d+$/i.test(prv)) {
        f.push(F("e", '"prv" must be the inscription id of the privilege authority, in the form <64 hex txid>i<index>.'));
      }
      return;
    }
    if (!isPlainObject(prv)) { f.push(F("e", '"prv" must be an inscription id string or a signed object.')); return; }
    requireKeys(prv, ["sig", "hash", "address", "salt"], f, "prv");
    if (prv.sig && !(isPlainObject(prv.sig) && "v" in prv.sig && "r" in prv.sig && "s" in prv.sig)) {
      f.push(F("e", '"prv.sig" must be an object with "v", "r" and "s".'));
    }
    if ("hash" in prv && !/^[0-9a-f]{64}$/i.test(String(prv.hash))) {
      f.push(F("e", '"prv.hash" must be a 64 character hex sha256 digest.'));
    }
    if ("address" in prv) {
      var r = checkDogeAddress(String(prv.address));
      if (!r.ok) f.push(F("e", '"prv.address" ' + r.reason + ". The minting address must be a Dogecoin mainnet address."));
    }
  }

  function checkSigned(o, f, opName) {
    if (!isPlainObject(o.sig) || !("v" in o.sig) || !("r" in o.sig) || !("s" in o.sig)) {
      f.push(F("e", '"' + opName + '" requires "sig" with "v", "r" and "s".'));
    }
    if (!("hash" in o)) f.push(F("e", '"' + opName + '" requires "hash".'));
    else if (!/^[0-9a-f]{64}$/i.test(String(o.hash))) f.push(F("e", '"hash" must be a 64 character hex sha256 digest.'));
    if (!("salt" in o)) f.push(F("e", '"' + opName + '" requires "salt". It exists so the hash is unique across the whole protocol state.'));
  }

  function validate(text) {
    var f = [];
    var raw = text;
    var trimmed = String(text == null ? "" : text).trim();
    if (!trimmed) return { state: "empty", findings: [], bytes: 0 };

    var bytes = new TextEncoder().encode(raw).length;
    var parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      return {
        state: "bad", bytes: bytes, findings: [F("e", "The payload is not valid JSON: " + err.message)],
        summary: "Not JSON"
      };
    }

    if (Array.isArray(parsed)) {
      return { state: "bad", bytes: bytes, findings: [F("e", "The payload is a JSON array. A TAP inscription body is one JSON object.")], summary: "Not an object" };
    }
    if (!isPlainObject(parsed)) {
      return { state: "bad", bytes: bytes, findings: [F("e", "The payload is a bare JSON value. A TAP inscription body is one JSON object.")], summary: "Not an object" };
    }

    /* p */
    if (!("p" in parsed)) {
      f.push(F("e", 'Missing "p". Every TAP payload declares the protocol.'));
    } else if (parsed.p !== "tap") {
      if (typeof parsed.p === "string" && parsed.p.trim().toLowerCase() === "tap") {
        f.push(F("e", '"p" must be exactly "tap" in lowercase with no surrounding whitespace.'));
      } else if (typeof parsed.p === "string" && /^drc-?20$/i.test(parsed.p.trim())) {
        f.push(F("e", '"p" is "' + parsed.p + '". That is DRC-20, a different protocol with a different operation set. TAP on Doge uses "tap".'));
      } else {
        f.push(F("e", '"p" is ' + JSON.stringify(parsed.p) + '. TAP on Doge payloads use "tap".'));
      }
    }

    /* op */
    var op = parsed.op;
    if (!("op" in parsed)) {
      f.push(F("e", 'Missing "op".'));
    } else if (typeof op !== "string") {
      f.push(F("e", '"op" must be a string.'));
    } else if (!OPS[op]) {
      var key = op.trim().toLowerCase();
      if (WRONG_OP[key]) {
        f.push(F("e", '"op": "' + op + '" is not a TAP operation. It is the DRC-20 and BRC-20 spelling. TAP prefixes its token operations, so the operation you want is "' +
          WRONG_OP[key] + '". A payload carrying "p": "tap" with "op": "' + op + '" is inscribed successfully and then indexed by nobody: no TAP indexer recognises it and no DRC-20 indexer claims it, because "p" is not "drc-20". The tokens are not moved and the inscription cannot be replayed.'));
      } else if (OPS[key]) {
        f.push(F("e", '"op" must be exactly "' + key + '" in lowercase with no surrounding whitespace.'));
      } else {
        f.push(F("e", '"op": ' + JSON.stringify(op) + " is not a TAP operation. The full set is " + Object.keys(OPS).join(", ") + "."));
      }
    }

    /* per-operation */
    switch (op) {
      case "token-deploy":
        requireKeys(parsed, ["tick", "max"], f, op);
        if ("tick" in parsed) tickerShape(parsed.tick, f);
        if ("max" in parsed) amountShape(parsed.max, '"max"', f);
        if ("lim" in parsed) amountShape(parsed.lim, '"lim"', f);
        else f.push(F("i", 'No "lim". The whole maximum supply can then be minted in a single mint.'));
        if ("dec" in parsed) {
          var dec = parsed.dec;
          var n = typeof dec === "string" ? Number(dec) : dec;
          if (!Number.isInteger(n) || n < 0 || n > 18) f.push(F("e", '"dec" must be an integer from 0 through 18.'));
        }
        if ("prv" in parsed) checkPrv(parsed.prv, f);
        break;

      case "token-mint":
        requireKeys(parsed, ["tick", "amt"], f, op);
        if ("tick" in parsed) tickerShape(parsed.tick, f);
        if ("amt" in parsed) amountShape(parsed.amt, '"amt"', f);
        if ("prv" in parsed) checkPrv(parsed.prv, f);
        f.push(F("i", "A mint is valid only while the deployment still has supply left and the amount is within its per-mint limit. Neither can be checked from the payload alone."));
        break;

      case "token-transfer":
        requireKeys(parsed, ["tick", "amt"], f, op);
        if ("tick" in parsed) tickerShape(parsed.tick, f);
        if ("amt" in parsed) amountShape(parsed.amt, '"amt"', f);
        if ("to" in parsed || "address" in parsed) {
          f.push(F("e", 'A "token-transfer" carries no recipient. It parks an amount as a transfer inscription; the recipient is decided later by sending that inscription in an ordinary Dogecoin transaction. A "to" or "address" field here is ignored by indexers and is a sign the payload was built from a different protocol\'s template.'));
        }
        break;

      case "token-send":
        if (!Array.isArray(parsed.items)) {
          f.push(F("e", '"token-send" requires "items", an array of {tick, amt, address}.'));
        } else if (!parsed.items.length) {
          f.push(F("e", '"items" is empty.'));
        } else {
          for (var i = 0; i < parsed.items.length; i++) {
            var it = parsed.items[i];
            var lbl = "items[" + i + "]";
            if (!isPlainObject(it)) { f.push(F("e", lbl + " is not an object.")); continue; }
            if (!("tick" in it)) f.push(F("e", lbl + '.tick is missing.'));
            else tickerShape(it.tick, f);
            if (!("amt" in it)) f.push(F("e", lbl + ".amt is missing.")); else amountShape(it.amt, lbl + ".amt", f);
            if (!("address" in it)) f.push(F("e", lbl + ".address is missing."));
            else {
              var res = checkDogeAddress(String(it.address));
              if (!res.ok) {
                f.push(F("e", lbl + ".address " + res.reason + "." + (res.btc
                  ? " The published Dogecoin TAP specification inherited the phrase \"valid Bitcoin addresses\" and bech32 examples from the Bitcoin document. On Dogecoin the recipient must be a Dogecoin mainnet address."
                  : "")));
              } else {
                f.push(F("i", lbl + ".address is a valid Dogecoin mainnet " + res.kind + " address, version byte " + res.version + "."));
              }
            }
          }
          f.push(F("i", '"token-send" is atomic on syntax: if any item is malformed the whole inscription is invalid before tapping. Semantic failures such as insufficient funds are skipped item by item at tapping time.'));
          f.push(F("i", "Each item spends available balance only, meaning balance minus the amount parked in live transfer inscriptions."));
        }
        break;

      case "block-transferables":
      case "unblock-transferables":
        var extra = Object.keys(parsed).filter(function (k) { return k !== "p" && k !== "op"; });
        if (extra.length) f.push(F("w", '"' + op + '" takes no fields beyond "p" and "op". Found: ' + extra.join(", ") + "."));
        f.push(F("i", "This operation only takes effect once the inscription is tapped, meaning sent from the address to itself."));
        break;

      case "token-trade":
        if (!("side" in parsed)) f.push(F("e", '"token-trade" requires "side": "0" for the seller, "1" for the buyer.'));
        else if (parsed.side !== "0" && parsed.side !== "1") {
          f.push(F(typeof parsed.side === "number" ? "w" : "e",
            '"side" must be the string "0" or "1".' + (typeof parsed.side === "number" ? " It was given as a JSON number." : "")));
        }
        if (String(parsed.side) === "0") {
          if ("trade" in parsed) {
            if (!/^[0-9a-f]{64}i\d+$/i.test(String(parsed.trade))) f.push(F("e", '"trade" must be the inscription id of the trade being cancelled, in the form <64 hex txid>i<index>.'));
            f.push(F("i", "Read as a seller cancellation. It only cancels if the tapping address owns the referenced trade inscription."));
          } else {
            requireKeys(parsed, ["tick", "amt", "accept", "valid"], f, op);
            if ("tick" in parsed) tickerShape(parsed.tick, f);
            if ("amt" in parsed) amountShape(parsed.amt, '"amt"', f);
            if ("accept" in parsed) {
              if (!Array.isArray(parsed.accept) || !parsed.accept.length) f.push(F("e", '"accept" must be a non-empty array of {tick, amt}.'));
              else {
                var seen = {};
                for (var a = 0; a < parsed.accept.length; a++) {
                  var ac = parsed.accept[a];
                  if (!isPlainObject(ac) || !("tick" in ac) || !("amt" in ac)) { f.push(F("e", "accept[" + a + "] must be an object with tick and amt.")); continue; }
                  amountShape(ac.amt, "accept[" + a + "].amt", f);
                  var lk = String(ac.tick).toLowerCase();
                  if (seen[lk]) f.push(F("w", 'accept[' + a + '] repeats ticker "' + ac.tick + '". Only the first entry for a ticker is indexed.'));
                  seen[lk] = true;
                }
              }
            }
            if ("valid" in parsed) {
              if (!/^\d+$/.test(String(parsed.valid))) f.push(F("e", '"valid" must be a block height.'));
              else f.push(F("i", '"valid" is Dogecoin block ' + Number(parsed.valid).toLocaleString("en-US") +
                ". It must still be in the future when the buyer taps. At one minute per block a window of 900 blocks is about 15 hours, not about six days as the same number would be on Bitcoin."));
            }
          }
        } else if (String(parsed.side) === "1") {
          requireKeys(parsed, ["trade", "tick", "amt"], f, op);
          if ("trade" in parsed && !/^[0-9a-f]{64}i\d+$/i.test(String(parsed.trade))) {
            f.push(F("e", '"trade" must be the inscription id of the trade being filled, in the form <64 hex txid>i<index>, not the inscription number.'));
          }
          if ("tick" in parsed) tickerShape(parsed.tick, f);
          if ("amt" in parsed) amountShape(parsed.amt, '"amt"', f);
          if ("fee_rcv" in parsed) {
            var fr = checkDogeAddress(String(parsed.fee_rcv));
            if (!fr.ok) f.push(F("e", '"fee_rcv" ' + fr.reason + "."));
            else f.push(F("i", 'Setting "fee_rcv" adds a fixed 0.3% fee in the purchased token, paid by the buyer on top of the purchase amount.'));
          }
          f.push(F("i", '"tick" and "amt" must exactly match one entry in the referenced trade\'s "accept" array, and exactly one.'));
        }
        break;

      case "token-auth":
        if ("cancel" in parsed) {
          if (!/^[0-9a-f]{64}i\d+$/i.test(String(parsed.cancel))) f.push(F("e", '"cancel" must be the inscription id of the authority being cancelled.'));
          f.push(F("i", "Read as an authority cancellation. Once tapped, no further redeems can ever execute against that authority."));
        } else {
          checkSigned(parsed, f, op);
          if ("redeem" in parsed) {
            var rd = parsed.redeem;
            if (!isPlainObject(rd)) f.push(F("e", '"redeem" must be an object with "items", "auth" and "data".'));
            else {
              if (!Array.isArray(rd.items) || !rd.items.length) f.push(F("e", '"redeem.items" must be a non-empty array of {tick, amt, address}.'));
              else {
                for (var ri = 0; ri < rd.items.length; ri++) {
                  var rit = rd.items[ri];
                  if (!isPlainObject(rit)) { f.push(F("e", "redeem.items[" + ri + "] is not an object.")); continue; }
                  if ("amt" in rit) amountShape(rit.amt, "redeem.items[" + ri + "].amt", f);
                  if ("tick" in rit) tickerShape(rit.tick, f);
                  if ("address" in rit) {
                    var rr2 = checkDogeAddress(String(rit.address));
                    if (!rr2.ok) f.push(F("e", "redeem.items[" + ri + "].address " + rr2.reason + "."));
                  } else f.push(F("e", "redeem.items[" + ri + "].address is missing."));
                }
              }
              if (!("auth" in rd)) f.push(F("e", '"redeem.auth" must carry the inscription id of the signing authority.'));
              else if (!/^[0-9a-f]{64}i\d+$/i.test(String(rd.auth))) f.push(F("e", '"redeem.auth" must be an inscription id.'));
              if (!("data" in rd)) f.push(F("e", '"redeem.data" must be present. It may be an empty string.'));
            }
            f.push(F("i", "A redeem is signed by the authority, so anyone may inscribe it and tapping is not required."));
          } else if ("auth" in parsed) {
            if (!Array.isArray(parsed.auth)) f.push(F("e", '"auth" must be an array of deployed tickers. An empty array authorises every token the authority address holds.'));
            f.push(F("i", "Read as an authority creation. It must be tapped, and every listed ticker must already be deployed."));
          } else {
            f.push(F("e", '"token-auth" must carry one of "auth" (create), "redeem" (issue), or "cancel".'));
          }
        }
        break;

      case "privilege-auth":
        if ("cancel" in parsed) {
          if (!/^[0-9a-f]{64}i\d+$/i.test(String(parsed.cancel))) f.push(F("e", '"cancel" must be the inscription id of the privilege authority being cancelled.'));
        } else {
          checkSigned(parsed, f, op);
          if ("verify" in parsed) {
            if (!/^[0-9a-f]{64}$/i.test(String(parsed.verify))) f.push(F("e", '"verify" must be a 64 character hex sha256 digest of the file contents.'));
            if (!("col" in parsed)) f.push(F("e", '"col" must be present. It may be an empty string.'));
            else if (typeof parsed.col !== "string") f.push(F("e", '"col" must be a string.'));
            else if (Array.from(parsed.col).length > 512) f.push(F("e", '"col" is longer than 512 Unicode symbols.'));
            if (!("seq" in parsed)) f.push(F("e", '"seq" must be present.'));
            else if (typeof parsed.seq === "string") f.push(F("e", '"seq" was passed as a string. The specification states that a string "seq" fails the verification. It must be a JSON integer.'));
            else if (!Number.isInteger(parsed.seq) || parsed.seq < 0 || parsed.seq > 9007199254740991) f.push(F("e", '"seq" must be an unsigned integer no larger than 9007199254740991.'));
            if (!("prv" in parsed)) f.push(F("e", '"prv" must carry the inscription id of the issuing authority.'));
            if ("address" in parsed) {
              var pa = checkDogeAddress(String(parsed.address));
              if (!pa.ok) f.push(F("e", '"address" ' + pa.reason + "."));
            }
          } else if (!("auth" in parsed)) {
            f.push(F("e", '"privilege-auth" must carry "auth" (create), "verify" (hashed verification), or "cancel".'));
          }
        }
        break;

      case "dmt-deploy":
        requireKeys(parsed, ["elem", "tick", "dt"], f, op);
        if ("tick" in parsed) tickerShape(parsed.tick, f);
        if ("elem" in parsed && !/^[0-9a-f]{64}i\d+$/i.test(String(parsed.elem))) f.push(F("e", '"elem" must be the inscription id of the element.'));
        if ("prv" in parsed) checkPrv(parsed.prv, f);
        f.push(F("i", "Dogecoin TAP supports element fields 4 (block height), 10 (nonce) and 11 (bits)."));
        break;

      case "dmt-mint":
        requireKeys(parsed, ["tick", "blk", "dep"], f, op);
        if ("tick" in parsed) tickerShape(parsed.tick, f);
        if ("dep" in parsed && !/^[0-9a-f]{64}i\d+$/i.test(String(parsed.dep))) f.push(F("e", '"dep" must be the inscription id of the deployment.'));
        if ("blk" in parsed) {
          if (typeof parsed.blk === "string") {
            f.push(F("w", '"blk" is a string. Until Dogecoin block ' + (DMT_PRECISE_HEIGHT - 1).toLocaleString("en-US") +
              " it was read with JavaScript parseInt rules; from block " + DMT_PRECISE_HEIGHT.toLocaleString("en-US") +
              " onward the value must be precise. Use a JSON integer."));
          } else if (!Number.isInteger(parsed.blk) || parsed.blk < 0) {
            f.push(F("e", '"blk" must be a non-negative integer block height.'));
          }
        }
        if ("prv" in parsed) checkPrv(parsed.prv, f);
        break;
    }

    /* generic hygiene */
    if (/\r?\n/.test(raw) || /\s{2,}/.test(raw)) {
      f.push(F("i", "The payload is pretty printed. Whitespace between JSON tokens is not significant, but every byte of it is paid for at the full Dogecoin byte rate, with no witness discount."));
    }
    var known = { p: 1, op: 1 };
    var perOp = {
      "token-deploy": ["tick", "max", "lim", "dec", "prv"],
      "token-mint": ["tick", "amt", "prv"],
      "token-transfer": ["tick", "amt"],
      "token-send": ["items"],
      "token-trade": ["side", "tick", "amt", "accept", "valid", "trade", "fee_rcv"],
      "token-auth": ["sig", "hash", "salt", "auth", "redeem", "cancel"],
      "privilege-auth": ["sig", "hash", "salt", "auth", "cancel", "prv", "verify", "col", "seq", "address"],
      "dmt-deploy": ["elem", "tick", "dt", "prv"],
      "dmt-mint": ["tick", "blk", "dep", "prv"],
      "block-transferables": [],
      "unblock-transferables": []
    }[op];
    if (perOp) {
      for (var pk = 0; pk < perOp.length; pk++) known[perOp[pk]] = 1;
      var unknown = Object.keys(parsed).filter(function (k) { return !known[k]; });
      if (unknown.length) {
        f.push(F("w", "Unrecognised field" + (unknown.length > 1 ? "s" : "") + " for this operation: " + unknown.join(", ") +
          ". Indexers ignore unknown fields, so a typo in a required field name silently becomes a missing required field."));
      }
    }

    var errs = f.filter(function (x) { return x.sev === "e"; }).length;
    var warns = f.filter(function (x) { return x.sev === "w"; }).length;
    return {
      state: errs ? "bad" : (warns ? "warn" : "ok"),
      findings: f,
      bytes: bytes,
      op: OPS[op] ? op : null,
      summary: errs ? (errs + " problem" + (errs > 1 ? "s" : "")) : (warns ? warns + " caution" + (warns > 1 ? "s" : "") : "Well formed")
    };
  }

  /* ================= validator UI ================= */

  var ta = document.getElementById("payload");
  var out = document.getElementById("v-out");

  var SAMPLES = {
    deploy: '{\n  "p": "tap",\n  "op": "token-deploy",\n  "tick": "tap",\n  "max": "21000000",\n  "lim": "1000"\n}',
    mint: '{\n  "p": "tap",\n  "op": "token-mint",\n  "tick": "tap",\n  "amt": "1000"\n}',
    transfer: '{\n  "p": "tap",\n  "op": "token-transfer",\n  "tick": "tap",\n  "amt": "100"\n}',
    send: '{\n  "p": "tap",\n  "op": "token-send",\n  "items": [\n    { "tick": "tap", "amt": "10000", "address": "DHZqJo3DUyhQsrdR3Kcs8xvfaMzPkzE5gP" }\n  ]\n}',
    dmt: '{\n  "p": "tap",\n  "op": "dmt-mint",\n  "tick": "dogenat",\n  "blk": 5000000,\n  "dep": "825e287bb7dd163ed633110e31bc6abb6c80815ca68b7dd3cc71d729ecaaa3dci0"\n}',
    badop: '{\n  "p": "tap",\n  "op": "mint",\n  "tick": "tap",\n  "amt": "1000"\n}',
    badaddr: '{\n  "p": "tap",\n  "op": "token-send",\n  "items": [\n    { "tick": "tap", "amt": "1", "address": "bc1p9lpne8pnzq87dpygtqdd9vd3w28fknwwgv362xff9zv4ewxg6was504w20" }\n  ]\n}'
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  function render() {
    if (!ta || !out) return;
    var r = validate(ta.value);
    if (r.state === "empty") {
      out.innerHTML = '<div class="verdict"><h4>Nothing to check yet</h4><p>Paste a payload above, or load one of the examples.</p></div>';
      return;
    }
    var cls = r.state === "ok" ? "ok" : (r.state === "warn" ? "warn" : "bad");
    var head = r.state === "ok" ? "Well formed for Dogecoin TAP"
      : r.state === "warn" ? "Structurally valid, with cautions"
        : "Rejected";
    var chunks = Math.max(1, Math.ceil(r.bytes / CHUNK));
    var html = '<div class="verdict ' + cls + '"><h4>' + esc(head) + "</h4><p>" +
      (r.op ? "Operation <code>" + esc(r.op) + "</code>. " + esc(OPS[r.op]) : "The operation could not be identified.") +
      "</p></div>";
    html += '<ul class="readout">' +
      '<li><span class="k">Payload bytes</span><span class="v">' + r.bytes + "</span></li>" +
      '<li><span class="k">520-byte chunks</span><span class="v">' + chunks + "</span></li>" +
      '<li><span class="k">Verdict</span><span class="v">' + esc(r.summary) + "</span></li>" +
      "</ul>";
    if (r.findings.length) {
      html += '<ul class="findings">';
      var order = { e: 0, w: 1, i: 2 };
      r.findings.slice().sort(function (a, b) { return order[a.sev] - order[b.sev]; }).forEach(function (x) {
        var label = x.sev === "e" ? "Error" : x.sev === "w" ? "Caution" : "Note";
        html += '<li><span class="sev ' + x.sev + '">' + label + "</span><span>" + esc(x.msg) + "</span></li>";
      });
      html += "</ul>";
    }
    out.innerHTML = html;
  }

  if (ta && out) {
    var form = document.getElementById("v-form");
    if (form) { form.hidden = false; form.removeAttribute("hidden"); }
    var fallback = document.getElementById("v-nojs");
    if (fallback) fallback.hidden = true;
    ta.addEventListener("input", render);
    var chips = document.querySelectorAll("[data-sample]");
    for (var c = 0; c < chips.length; c++) {
      chips[c].addEventListener("click", function (e) {
        ta.value = SAMPLES[e.currentTarget.getAttribute("data-sample")] || "";
        render();
        ta.focus();
      });
    }
    var clear = document.getElementById("v-clear");
    if (clear) clear.addEventListener("click", function () { ta.value = ""; render(); ta.focus(); });
    render();
  }

  /* ================= confirmation comparator ================= */

  var DOGE_MIN = 1;   /* Dogecoin block target, minutes */
  var BTC_MIN = 10;   /* Bitcoin block target, minutes */

  function human(minutes) {
    if (minutes < 1) return Math.round(minutes * 60) + " seconds";
    if (minutes < 90) return round1(minutes) + (minutes === 1 ? " minute" : " minutes");
    var hours = minutes / 60;
    if (hours < 36) return round1(hours) + (hours === 1 ? " hour" : " hours");
    var days = hours / 24;
    if (days < 21) return round1(days) + (days === 1 ? " day" : " days");
    return round1(days / 7) + " weeks";
  }
  function round1(n) { return (Math.round(n * 10) / 10).toLocaleString("en-US"); }

  var conf = document.getElementById("confs");
  var cout = document.getElementById("c-out");

  function compare() {
    if (!conf || !cout) return;
    var n = parseInt(conf.value, 10);
    if (!isFinite(n) || n < 1) n = 1;
    if (n > 10000) n = 10000;
    var dogeMin = n * DOGE_MIN;
    var btcMin = n * BTC_MIN;
    var matchBlocks = n * (BTC_MIN / DOGE_MIN);
    var pctDoge = 100 * (dogeMin / btcMin);

    var html = '<ul class="readout">' +
      '<li><span class="k">' + n + " Dogecoin confirmations</span><span class=\"v\">" + esc(human(dogeMin)) + "</span></li>" +
      '<li><span class="k">' + n + " Bitcoin confirmations</span><span class=\"v\">" + esc(human(btcMin)) + "</span></li>" +
      '<li><span class="k">Doge blocks for the same wait</span><span class="v">' + matchBlocks.toLocaleString("en-US") + "</span></li>" +
      "</ul>";

    html += '<div class="bars">' +
      '<div class="bar-row"><span class="bl">Dogecoin</span><span class="bar-track"><span class="bar-fill doge" style="width:' +
      Math.max(pctDoge, 6).toFixed(2) + '%">' + esc(human(dogeMin)) + "</span></span></div>" +
      '<div class="bar-row"><span class="bl">Bitcoin</span><span class="bar-track"><span class="bar-fill btc" style="width:100%">' +
      esc(human(btcMin)) + "</span></span></div>" +
      "</div>";

    html += "<p>" + n + " confirmations on Dogecoin is about " + esc(human(dogeMin)) +
      " of elapsed time. The same advice on Bitcoin buys about " + esc(human(btcMin)) + ". To wait as long as " + n +
      " Bitcoin confirmations you would need about " + matchBlocks.toLocaleString("en-US") + " Dogecoin confirmations.</p>";

    html += '<p class="bar-note">Elapsed time is not accumulated work. Dogecoin and Bitcoin are separate chains with separate hashrate and separate proof-of-work functions, so ' +
      matchBlocks.toLocaleString("en-US") + ' Dogecoin blocks and ' + n + " Bitcoin blocks are equal only in minutes on a clock.</p>";

    if (n <= 40) {
      html += '<p class="bar-note">For context, the Bitcoin Universe Dogecoin inscription index keeps rollback savepoints covering roughly 40 to 49 blocks behind the tip. At one minute per block that whole recoverable window is under an hour.</p>';
    }
    cout.innerHTML = html;
  }

  if (conf && cout) {
    var cform = document.getElementById("c-form");
    if (cform) cform.removeAttribute("hidden");
    var cnojs = document.getElementById("c-nojs");
    if (cnojs) cnojs.hidden = true;
    conf.addEventListener("input", compare);
    var presets = document.querySelectorAll("[data-conf]");
    for (var p = 0; p < presets.length; p++) {
      presets[p].addEventListener("click", function (e) {
        conf.value = e.currentTarget.getAttribute("data-conf");
        compare();
      });
    }
    compare();
  }
})();
