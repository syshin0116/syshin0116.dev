import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

const NATIVE_AGENT_PACKAGES = [
  "@assistant-ui/react", "@assistant-ui/react-langchain",
  "@assistant-ui/react-markdown",
  "@langchain/react", "@langchain/langgraph-sdk", "@langchain/protocol",
] as const

export interface AuditCommandResult {
  exitCode: number
  stdout: string
  stderr: string
}

export interface AuditPolicyEvidence {
  production: AuditCommandResult
  complete: AuditCommandResult
  packageJson: string
  bunLock: string
}

export interface AuditException {
  package: string
  advisory: string
  reason: string
  /** Last day (UTC, YYYY-MM-DD) the exception applies; re-review before then. */
  expires: string
}

// Only advisories with no upstream-compatible fix belong here. An entry fails the
// policy once it expires or once the advisory no longer appears in either audit.
export const AUDIT_EXCEPTIONS: readonly AuditException[] = [
  {
    package: "katex",
    advisory: "GHSA-238p-pmpm-9mq7",
    reason:
      "Low severity and needs an existing prototype pollution. The fix is 0.18.2, " +
      "but mermaid 12.1.0, rehype-katex 7.0.1 and micromark-extension-math 3.1.0 " +
      "all require ^0.16; KaTeX only renders owner-authored posts at build time.",
    expires: "2027-01-23",
  },
]

function fail(message: string): never {
  throw new Error(`dependency audit policy failed: ${message}`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseAuditJson(result: AuditCommandResult, label: string) {
  try {
    const parsed: unknown = JSON.parse(result.stdout.trim())
    if (!isRecord(parsed)) {
      fail(`${label} audit JSON must be one object`)
    }
    return parsed
  } catch (error) {
    if (error instanceof SyntaxError) {
      fail(
        `${label} audit did not emit valid JSON; exit=${result.exitCode}, ` +
          `stderr=${result.stderr.trim()}`,
      )
    }
    throw error
  }
}

function advisoryId(advisory: unknown): string | undefined {
  if (!isRecord(advisory) || typeof advisory.url !== "string") {
    return undefined
  }
  return /GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/u.exec(advisory.url)?.[0]
}

function requireAuditWithinExceptions(
  result: AuditCommandResult,
  label: string,
  exceptions: readonly AuditException[],
  matched: Set<AuditException>,
): void {
  // bun audit reports advisories on stdout and exits non-zero, so the exit code
  // alone names neither the package nor the advisory. Parse first, and only fall
  // back to the raw streams when stdout is not the documented JSON.
  const findings = parseAuditJson(result, label)
  const unexcepted: Record<string, unknown[]> = {}
  for (const [name, advisories] of Object.entries(findings)) {
    for (const advisory of Array.isArray(advisories) ? advisories : [advisories]) {
      const exception = exceptions.find(entry =>
        entry.package === name && entry.advisory === advisoryId(advisory))
      if (exception) {
        matched.add(exception)
      } else {
        unexcepted[name] = [...(unexcepted[name] ?? []), advisory]
      }
    }
  }
  const packages = Object.keys(unexcepted)
  if (packages.length !== 0) {
    fail(
      `${label} audit found ${packages.length} advisories: ` +
        `${packages.join(", ")}\n${JSON.stringify(unexcepted, null, 2)}`,
    )
  }
  if (result.exitCode !== 0 && Object.keys(findings).length === 0) {
    fail(
      `${label} audit exited ${result.exitCode} with no findings in stdout; ` +
        `stderr=${result.stderr.trim()}`,
    )
  }
}

function activeExceptions(
  exceptions: readonly AuditException[],
  today: string,
): readonly AuditException[] {
  for (const entry of exceptions) {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(entry.expires)) {
      fail(`audit exception ${entry.package} ${entry.advisory} needs a YYYY-MM-DD expiry`)
    }
    if (entry.expires < today) {
      fail(
        `audit exception ${entry.package} ${entry.advisory} expired on ` +
          `${entry.expires}; fix the dependency or re-review and extend it`,
      )
    }
  }
  return exceptions
}

function packageRecords(lock: string) {
  const records = new Map<string, { resolved: string; line: string }>()
  for (const line of lock.split(/\r?\n/u)) {
    const match = /^ {4}"([^"]+)": \["([^"]+)"/u.exec(line)
    if (!match) {
      continue
    }
    const [, key, resolved] = match
    if (records.has(key)) {
      fail(`bun.lock contains duplicate package record ${key}`)
    }
    records.set(key, { resolved, line })
  }
  return records
}

function requireDependencyBaseline(packageJson: string, bunLock: string): void {
  const manifest: unknown = JSON.parse(packageJson)
  if (!isRecord(manifest) || !isRecord(manifest.dependencies) ||
      !isRecord(manifest.devDependencies) || !isRecord(manifest.overrides)) {
    fail("package.json must contain dependency, devDependency, and override objects")
  }
  const { dependencies, devDependencies, overrides } = manifest
  if ("eslint-config-next" in dependencies) fail("eslint-config-next must remain a devDependency")
  if ("patchedDependencies" in manifest) fail("use upstream packages without local patches")
  const records = packageRecords(bunLock)
  for (const name of NATIVE_AGENT_PACKAGES) {
    const version = dependencies[name]
    if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) {
      fail(`${name} must be pinned exactly`)
    }
    const resolutions = [...records.values()].filter(record => record.resolved.startsWith(`${name}@`))
    if (resolutions.length !== 1 || resolutions[0].resolved !== `${name}@${version}`) {
      fail(`${name} must have one resolution matching package.json`)
    }
  }
  for (const name of ["@types/react", "@types/react-dom"]) {
    if (overrides[name] !== devDependencies[name] ||
        records.get(name)?.resolved !== `${name}@${devDependencies[name]}`) {
      fail(`${name} override must match its declared and resolved version`)
    }
  }
  if (records.get("next")?.resolved.split("@").at(-1) !==
      records.get("eslint-config-next")?.resolved.split("@").at(-1)) {
    fail("next and eslint-config-next must resolve to the same version")
  }
}

export function validateAuditPolicy(
  evidence: AuditPolicyEvidence,
  exceptions: readonly AuditException[] = AUDIT_EXCEPTIONS,
  today: string = new Date().toISOString().slice(0, 10),
): void {
  const active = activeExceptions(exceptions, today)
  const matched = new Set<AuditException>()
  requireAuditWithinExceptions(evidence.production, "production", active, matched)
  requireAuditWithinExceptions(evidence.complete, "complete", active, matched)
  for (const entry of active) {
    if (!matched.has(entry)) {
      fail(
        `audit exception ${entry.package} ${entry.advisory} no longer matches ` +
          "any advisory; remove the stale entry",
      )
    }
  }
  requireDependencyBaseline(
    evidence.packageJson,
    evidence.bunLock,
  )
}

function runAudit(args: string[]): AuditCommandResult {
  const result = Bun.spawnSync({
    cmd: [process.execPath, "audit", ...args, "--json"],
    cwd: resolve(import.meta.dir, ".."),
    stdout: "pipe",
    stderr: "pipe",
  })
  const decoder = new TextDecoder()
  return {
    exitCode: result.exitCode,
    stdout: decoder.decode(result.stdout),
    stderr: decoder.decode(result.stderr),
  }
}

async function main(): Promise<void> {
  const webRoot = resolve(import.meta.dir, "..")
  const evidence: AuditPolicyEvidence = {
    production: runAudit(["--prod", "--audit-level=high"]),
    complete: runAudit(["--audit-level=high"]),
    packageJson: await readFile(resolve(webRoot, "package.json"), "utf8"),
    bunLock: await readFile(resolve(webRoot, "bun.lock"), "utf8"),
  }
  validateAuditPolicy(evidence)
  console.log(
    "dependency audit policy passed: production and complete " +
      `high/critical=0 outside ${AUDIT_EXCEPTIONS.length} dated exceptions; ` +
      "native package resolutions match the manifest",
  )
}

if (import.meta.main) {
  await main()
}
