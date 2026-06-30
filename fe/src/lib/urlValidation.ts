import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Schemes that must never be shortened. Checked on the raw string before
 *  any parsing, so percent-encoding or whitespace tricks can't slip past. */
const BLOCKED_PROTOCOLS = [
  "javascript:",
  "data:",
  "vbscript:",
  "file:",
  "ftp:",
  "ftps:",
  "blob:",
  "about:",
  "chrome:",
  "chrome-extension:",
  "ws:",
  "wss:",
  "mailto:",
  "tel:",
];

/** RFC 6761 / RFC 2606 reserved & special-use TLDs. None of these resolve on
 *  the public internet, so a shortened link to them is either broken or an
 *  SSRF/phishing vector dressed up as a normal domain. */
const RESERVED_TLDS = new Set([
  "local",
  "localhost",
  "localdomain",
  "internal",
  "intranet",
  "private",
  "corp",
  "home",
  "lan",
  "test",
  "invalid",
  "example",
  "onion", // Tor — not resolvable via normal DNS, browsers can't follow it
]);

/** Valid TLD: 2–63 ASCII letters, or punycode (xn--…). */
const VALID_TLD_RE = /^([a-z]{2,63}|xn--[a-z0-9-]{1,59})$/i;

/** Each hostname label: alphanumeric start/end, hyphens only in the middle,
 *  1–63 chars (RFC 1123). Underscores are deliberately rejected — not valid
 *  in hostnames even though some DNS servers tolerate them. */
const VALID_LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;

// ─────────────────────────────────────────────────────────────────────────────
// Normaliser
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeUrlInput(value: string): string {
  // Only trim; do NOT automatically add a scheme.
  // The validator will decide whether to accept the provided input.
  return value.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// IPv4 obfuscation detection
//
// Attackers (and curious users) can write 127.0.0.1 as:
//   - a single decimal integer:  2130706433
//   - a single hex integer:      0x7f000001
//   - octal-padded octets:       017700000001 / 0177.0.0.1
//   - shorthand dotted forms:    127.1  (2-part)   127.0.1 (3-part)
// new URL() silently canonicalises all of these to the real IP, so a naive
// regex check against the *original* hostname string misses every one of
// them. We parse the actual numeric value out of the hostname ourselves and
// check the resulting octets against the private/reserved ranges — this is
// the only approach that can't be bypassed by re-encoding the same address.
// ─────────────────────────────────────────────────────────────────────────────

function parseIpObfuscation(
  hostname: string,
): [number, number, number, number] | null {
  const parts = hostname.split(".");
  if (parts.length < 1 || parts.length > 4) return null;
  if (!parts.every((p) => /^(0x[0-9a-f]+|0[0-7]*|[1-9]\d*|0)$/i.test(p)))
    return null;

  const nums = parts.map((p) => {
    if (/^0x/i.test(p)) return parseInt(p, 16);
    if (/^0[0-7]+$/.test(p)) return parseInt(p, 8);
    return parseInt(p, 10);
  });
  if (!nums.every((n) => Number.isSafeInteger(n) && n >= 0)) return null;

  if (nums.length === 4) {
    if (nums.some((n) => n > 255)) return null;
    return nums as [number, number, number, number];
  }
  if (nums.length === 1) {
    if (nums[0] > 4294967295) return null;
    const n = nums[0];
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  }
  if (nums.length === 2) {
    if (nums[0] > 255 || nums[1] > 16777215) return null;
    const n = nums[1];
    return [nums[0], (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  }
  if (nums.length === 3) {
    if (nums[0] > 255 || nums[1] > 255 || nums[2] > 65535) return null;
    const n = nums[2];
    return [nums[0], nums[1], (n >>> 8) & 255, n & 255];
  }
  return null;
}

function isPrivateOrReservedOctets(
  octets: [number, number, number, number],
): boolean {
  const [a, b] = octets;
  if (a === 0) return true; // 0.0.0.0/8 — "this network"
  if (a === 127) return true; // 127.0.0.0/8 — loopback
  if (a === 10) return true; // 10.0.0.0/8 — private
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 — private
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 — private
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 — link-local
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 — CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 — benchmarking
  if (a === 192 && b === 0 && octets[2] === 0) return true; // 192.0.0.0/24 — IETF protocol assignments
  if (a === 192 && b === 0 && octets[2] === 2) return true; // 192.0.2.0/24 — TEST-NET-1 (docs)
  if (a === 198 && b === 51 && octets[2] === 100) return true; // TEST-NET-2 (docs)
  if (a === 203 && b === 0 && octets[2] === 113) return true; // TEST-NET-3 (docs)
  if (a >= 224) return true; // 224.0.0.0+ — multicast / reserved / broadcast
  return false;
}

/** Raw IPv6 loopback / unspecified / link-local checks. We don't attempt a
 *  full IPv6 private-range parser (the address space is enormous and edge
 *  cases multiply fast); we block the handful of addresses that are
 *  unambiguously non-public, which covers the realistic SSRF surface. */
function isPrivateIpv6(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (h === "::1" || h === "::") return true; // loopback / unspecified
  if (h.startsWith("fe80:") || h.startsWith("fe80::")) return true; // link-local
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // unique local (fc00::/7)

  // IPv4-mapped IPv6 (::ffff:a.b.c.d) is canonicalised by the URL parser into
  // hex-group form, e.g. "::ffff:127.0.0.1" -> "::ffff:7f00:1". The last two
  // 16-bit hex groups encode the four IPv4 octets, two per group.
  if (h.startsWith("::ffff:")) {
    const groups = h.split(":");
    const last = groups[groups.length - 1];
    const secondLast = groups[groups.length - 2];
    // Reject this notation outright — it's never how a legitimate destination
    // URL is written, and is a known SSRF filter-bypass technique regardless
    // of whether the embedded address happens to be public.
    if (/^[0-9a-f]{1,4}$/.test(last) && /^[0-9a-f]{1,4}$/.test(secondLast)) {
      return true;
    }
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core validator — single source of truth for every form in the app
// ─────────────────────────────────────────────────────────────────────────────

export type ValidationResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

export function validateUrlStrict(raw: string): ValidationResult {
  const trimmed = raw.trim();

  // 1. Empty
  if (!trimmed) {
    return { ok: false, message: "Enter a destination URL." };
  }

  // 2. Block dangerous / unsupported schemes before any parsing or normalising.
  const lower = trimmed.toLowerCase();
  for (const proto of BLOCKED_PROTOCOLS) {
    if (lower.startsWith(proto)) {
      return { ok: false, message: "Only http and https URLs are supported." };
    }
  }

  // 3. Reject embedded whitespace / control characters anywhere in the raw
  //    string — a URL with an internal space or newline is either malformed
  //    or an attempt to confuse a downstream parser.
  if (/[\s\u0000-\u001F\u007F]/.test(trimmed)) {
    return {
      ok: false,
      message: "URLs can't contain spaces or control characters.",
    };
  }

  // 4. Normalise (currently: trim only)
  const normalized = normalizeUrlInput(trimmed);

  // 4a. If the user omitted the scheme (e.g. "http.com"), don't modify it.
  //     Just inform them that a scheme is required.
  if (!/^https?:\/\//i.test(trimmed)) {
    return {
      ok: false,
      message: "Please include http:// or https:// in your URL.",
    };
  }

  // 5. Structural parse.
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { ok: false, message: "That doesn't look like a valid URL." };
  }

  // 6. Protocol guard (post-parse — catches anything the string check missed,
  //    e.g. scheme written with unusual casing or whitespace tricks).
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, message: "Only http and https URLs are supported." };
  }

  // 7. Embedded credentials (https://user:pass@host) — a classic phishing
  //    pattern where the visible "host" before @ is fake.
  if (parsed.username || parsed.password) {
    return {
      ok: false,
      message: "URLs with embedded credentials aren't allowed.",
    };
  }

  // 8. Port range — the URL parser accepts any numeric string; enforce the
  //    real TCP range.
  if (parsed.port) {
    const port = Number(parsed.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return { ok: false, message: "Port must be between 1 and 65535." };
    }
  }

  const hostname = parsed.hostname;

  if (!hostname) {
    return { ok: false, message: "Enter a full domain, e.g. example.com." };
  }

  // 9. IPv6 literal — parsed.hostname keeps the brackets for IPv6 in some
  //    environments, so normalise before checking.
  const isIpv6Literal = hostname.startsWith("[") || hostname.includes(":");
  if (isIpv6Literal) {
    if (isPrivateIpv6(hostname)) {
      return {
        ok: false,
        message: "Private or local addresses can't be shortened.",
      };
    }
    // A non-private IPv6 literal is structurally valid at this point — accept.
    return { ok: true, url: normalized };
  }

  // 10. "localhost" and any hostname ending in a reserved TLD — checked
  //     before the IP-obfuscation logic since "localhost" itself isn't
  //     numeric and would otherwise fall through untouched.
  const hostLower = hostname.toLowerCase();
  if (hostLower === "localhost" || hostLower.endsWith(".localhost")) {
    return { ok: false, message: "Local addresses can't be shortened." };
  }

  // 11. IPv4 — including every obfuscated encoding (decimal, hex, octal,
  //     shorthand dotted forms). This MUST run before the label/TLD checks
  //     below, because a bare decimal like "2130706433" or a single octet
  //     like "0" would otherwise either fail the "needs a TLD" check (false
  //     rejection) or — worse — silently pass as some exotic single-label
  //     host.
  const ipv4Octets = parseIpObfuscation(hostname);
  if (ipv4Octets) {
    if (isPrivateOrReservedOctets(ipv4Octets)) {
      return {
        ok: false,
        message: "Private or local addresses can't be shortened.",
      };
    }
    // Public IPv4 literal — structurally valid, accept as-is.
    return { ok: true, url: normalized };
  }

  // ── From here on, hostname is treated as a DNS name, not an IP ──────────

  // 12. Leading dot → ".example.com"
  if (hostname.startsWith(".")) {
    return { ok: false, message: "Domain can't start with a dot." };
  }

  // 13. Strip a single trailing dot (FQDN notation) before further checks —
  //     but reject it outright since it's never what a user intends to share.
  if (hostname.endsWith(".")) {
    return { ok: false, message: "Domain can't end with a dot." };
  }

  // 14. Consecutive dots → "exa..mple.com"
  if (hostname.includes("..")) {
    return { ok: false, message: "Domain contains consecutive dots." };
  }

  const labels = hostname.split(".");

  // 15. Single-label hostname with no TLD (e.g. "intranet", "http://payroll")
  if (labels.length < 2) {
    return {
      ok: false,
      message: "Enter a full domain with a TLD, e.g. example.com.",
    };
  }

  // 16. Validate each label against RFC 1123.
  for (const label of labels) {
    if (!label) {
      return { ok: false, message: "Domain contains an empty label." };
    }
    if (!VALID_LABEL_RE.test(label)) {
      return { ok: false, message: `"${label}" isn't a valid domain label.` };
    }
  }

  // 17. TLD format — alpha (2–63 chars) or punycode.
  const tld = labels[labels.length - 1].toLowerCase();
  if (!VALID_TLD_RE.test(tld)) {
    return { ok: false, message: `".${tld}" isn't a recognised TLD format.` };
  }

  // 18. Reserved / special-use TLD (RFC 6761, RFC 2606) — .local, .test,
  //     .internal, etc. never resolve publicly.
  if (RESERVED_TLDS.has(tld)) {
    return {
      ok: false,
      message: `".${tld}" is a reserved domain and can't be shortened.`,
    };
  }

  // 19. Block a second-level "localhost" label anywhere, e.g.
  //     "foo.localhost.com" is fine (real TLD .com) but we already caught
  //     bare *.localhost above; this guards "localhost" appearing as the
  //     second-to-last label with a fake-looking TLD pattern is already
  //     covered by RESERVED_TLDS — no further action needed here.

  return { ok: true, url: normalized };
}

// ─────────────────────────────────────────────────────────────────────────────
// Zod field — every form in the app shares this exact validator
// ─────────────────────────────────────────────────────────────────────────────

export const destinationUrlField = z
  .string()
  .superRefine((val, ctx) => {
    const result = validateUrlStrict(val);
    if (!result.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.message,
      });
    }
  })
  .transform((val) => {
    // superRefine has already guaranteed this succeeds by the time transform runs.
    const result = validateUrlStrict(val) as { ok: true; url: string };
    return result.url;
  });

// ─────────────────────────────────────────────────────────────────────────────
// Other fields
// ─────────────────────────────────────────────────────────────────────────────

export const titleField = z
  .string()
  .transform((val) => val.trim())
  .pipe(z.string().max(60, "Title must be 60 characters or fewer"));

const ALIAS_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/i;

export const customCodeField = z
  .string()
  .transform((val) => val.trim().toLowerCase())
  .pipe(
    z
      .string()
      .refine(
        (val) => val === "" || val.length >= 4,
        "Alias must be at least 4 characters",
      )
      .refine(
        (val) => val === "" || val.length <= 50,
        "Alias must be 50 characters or fewer",
      )
      .refine(
        (val) => val === "" || ALIAS_PATTERN.test(val),
        "Only letters, numbers, and hyphens — can't start or end with a hyphen",
      )
      .refine(
        (val) => val === "" || !val.includes("--"),
        "Consecutive hyphens aren't allowed",
      ),
  );

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const createUrlSchema = z.object({
  originalUrl: destinationUrlField,
  title: titleField,
  customCode: customCodeField,
});

export const editUrlSchema = z.object({
  originalUrl: destinationUrlField,
  title: titleField,
  isActive: z.boolean(),
  resetClicks: z.boolean(),
});

export type CreateUrlForm = z.infer<typeof createUrlSchema>;
export type EditUrlForm = z.infer<typeof editUrlSchema>;
