import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import {
  type AuditCommandResult,
  validateAuditPolicy,
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

    expect(() => validateAuditPolicy(candidate)).toThrow(
      "production audit exited 1",
    )
  })

  test("rejects any complete-audit advisory", () => {
    const candidate = evidence()
    candidate.complete = reviewedAudit

    expect(() => validateAuditPolicy(candidate)).toThrow(
      "complete audit exited 1",
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
