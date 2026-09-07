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

function requireEmptySuccessfulAudit(
  result: AuditCommandResult,
  label: string,
): void {
  if (result.exitCode !== 0) {
    fail(
      `${label} audit exited ${result.exitCode}; stderr=${result.stderr.trim()}`,
    )
  }
  const findings = parseAuditJson(result, label)
  if (Object.keys(findings).length !== 0) {
    fail(`${label} audit must contain zero findings`)
  }
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

export function validateAuditPolicy(evidence: AuditPolicyEvidence): void {
  requireEmptySuccessfulAudit(evidence.production, "production")
  requireEmptySuccessfulAudit(evidence.complete, "complete")
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
      "high/critical=0; native package resolutions match the manifest",
  )
}

if (import.meta.main) {
  await main()
}
