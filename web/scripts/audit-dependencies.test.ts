import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import {
  type AuditCommandResult,
  type AuditException,
  type AuditPolicyEvidence,
  validateAuditPolicy as validateWithCheckedInExceptions,
} from "./audit-dependencies"

const webRoot = resolve(import.meta.dir, "..")
const packageJson = readFileSync(resolve(webRoot, "package.json"), "utf8")
const bunLock = readFileSync(resolve(webRoot, "bun.lock"), "utf8")

const emptyAudit: AuditCommandResult = {
  exitCode: 0,
  stdout: "{}",
  stderr: "",
}

const reviewedAudit: AuditCommandResult = {
  exitCode: 1,
  stdout: JSON.stringify({
    "brace-expansion": [
      {
        id: 1130588,
        url: "https://github.com/advisories/GHSA-mh99-v99m-4gvg",
        severity: "high",
        vulnerable_versions: "<1.1.17",
      },
    ],
  }),
  stderr: "",
}

const katexAudit: AuditCommandResult = {
  exitCode: 1,
  stdout: JSON.stringify({
    katex: [
      {
        id: 1241206,
        url: "https://github.com/advisories/GHSA-238p-pmpm-9mq7",
        severity: "low",
        vulnerable_versions: ">=0.11.0 <0.18.2",
      },
    ],
  }),
  stderr: "",
}

const katexException: AuditException = {
  package: "katex",
  advisory: "GHSA-238p-pmpm-9mq7",
  reason: "test",
  expires: "2027-01-23",
}

// Behavior tests pin their own exception list so the checked-in one can change
// without rewriting them.
function validateAuditPolicy(
  candidate: AuditPolicyEvidence,
  exceptions: readonly AuditException[] = [],
  today = "2026-10-25",
) {
  validateWithCheckedInExceptions(candidate, exceptions, today)
}

function evidence() {
  return {
    production: emptyAudit,
    complete: emptyAudit,
    packageJson,
    bunLock,
  }
}

describe("dependency audit policy", () => {
  test("accepts clean production and complete audits", () => {
    expect(() => validateAuditPolicy(evidence())).not.toThrow()
  })

  test("rejects any production high or critical advisory", () => {
    const candidate = evidence()
    candidate.production = reviewedAudit

    // The message must name the advisory: an exit code alone left six weeks of
    // scheduled failures unactionable.
    expect(() => validateAuditPolicy(candidate)).toThrow(
      /production audit found 1 advisories: brace-expansion/u,
    )
  })

  test("rejects any complete-audit advisory", () => {
    const candidate = evidence()
    candidate.complete = reviewedAudit

    expect(() => validateAuditPolicy(candidate)).toThrow(
      /complete audit found 1 advisories: brace-expansion/u,
    )
  })

  test("rejects moving eslint-config-next into production dependencies", () => {
    const candidate = evidence()
    const manifest = JSON.parse(candidate.packageJson)
    manifest.dependencies["eslint-config-next"] =
      manifest.devDependencies["eslint-config-next"]
    delete manifest.devDependencies["eslint-config-next"]
    candidate.packageJson = JSON.stringify(manifest)

    expect(() => validateAuditPolicy(candidate)).toThrow(
      "must remain a devDependency",
    )
  })

  test("allows compatible upgrades when both audits are clean", () => {
    const candidate = evidence()
    const manifest = JSON.parse(candidate.packageJson)
    manifest.dependencies["lucide-react"] = "^1.35.0"
    candidate.packageJson = JSON.stringify(manifest)
    expect(() => validateAuditPolicy(candidate)).not.toThrow()
  })

  test("rejects an ineffective React type upgrade hidden by an override", () => {
    const candidate = evidence()
    const manifest = JSON.parse(candidate.packageJson)
    manifest.devDependencies["@types/react-dom"] = "19.2.99"
    candidate.packageJson = JSON.stringify(manifest)
    expect(() => validateAuditPolicy(candidate)).toThrow("override must match")
  })

  test("rejects duplicate SDK versions", () => {
    const candidate = evidence()
    candidate.bunLock += '\n    "nested/@langchain/langgraph-sdk": ["@langchain/langgraph-sdk@1.0.0"],'
    expect(() => validateAuditPolicy(candidate)).toThrow("one resolution")
  })

  test("rejects a native package range", () => {
    const candidate = evidence()
    const manifest = JSON.parse(candidate.packageJson)
    manifest.dependencies["@langchain/react"] = "^1.0.35"
    candidate.packageJson = JSON.stringify(manifest)
    expect(() => validateAuditPolicy(candidate)).toThrow("pinned exactly")
  })

  test("rejects local runtime patches", () => {
    const candidate = evidence()
    candidate.packageJson = JSON.stringify({ ...JSON.parse(candidate.packageJson), patchedDependencies: {} })
    expect(() => validateAuditPolicy(candidate)).toThrow("without local patches")
  })

  test("rejects malformed audit output", () => {
    const candidate = evidence()
    candidate.production = { ...emptyAudit, stdout: "unavailable" }
    expect(() => validateAuditPolicy(candidate)).toThrow("valid JSON")
  })
})

describe("dated audit exceptions", () => {
  function katexEvidence() {
    return { ...evidence(), production: katexAudit, complete: katexAudit }
  }

  test("accepts an advisory covered by an active exception despite the non-zero exit", () => {
    expect(() => validateAuditPolicy(katexEvidence(), [katexException])).not.toThrow()
  })

  test("rejects an expired exception", () => {
    expect(() => validateAuditPolicy(katexEvidence(), [katexException], "2027-01-24"))
      .toThrow(/katex GHSA-238p-pmpm-9mq7 expired on 2027-01-23/u)
  })

  test("rejects a stale exception once the advisory is gone", () => {
    expect(() => validateAuditPolicy(evidence(), [katexException]))
      .toThrow(/no longer matches any advisory/u)
  })

  test("still rejects a different advisory on an excepted package", () => {
    const candidate = katexEvidence()
    const findings = JSON.parse(katexAudit.stdout)
    findings.katex.push({ id: 1, url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc" })
    candidate.complete = { ...katexAudit, stdout: JSON.stringify(findings) }
    expect(() => validateAuditPolicy(candidate, [katexException]))
      .toThrow(/complete audit found 1 advisories: katex/u)
  })

  test("checked-in exceptions name a GHSA advisory, a reason, and an expiry", async () => {
    const { AUDIT_EXCEPTIONS } = await import("./audit-dependencies")
    for (const entry of AUDIT_EXCEPTIONS) {
      expect(entry.advisory).toMatch(/^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/u)
      expect(entry.reason.length).toBeGreaterThan(20)
      expect(entry.expires).toMatch(/^\d{4}-\d{2}-\d{2}$/u)
    }
  })
})
