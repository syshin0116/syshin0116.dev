import { describe, expect, test } from "bun:test"

import {
  AGENT_TOKEN_INTENT_HEADER,
  ANONYMOUS_AGENT_TOKEN_INTENT,
} from "@/lib/agent-token-intent"
import {
  AgentAuthenticationError,
  AgentTokenBroker,
  TOKEN_REFRESH_MARGIN_SECONDS,
  tokenBrokerTesting,
} from "./token-broker"

function token(exp: number, subject = "user-1"): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url")
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    sub: subject,
    iss: "syshin0116.dev",
    aud: "agent-api",
    iat: 900,
    exp,
  })}.signature`
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

describe("AgentTokenBroker", () => {
  test("uses a validated initial credential without reminting it", async () => {
    let mintCalls = 0
    const initialToken = token(1_300, "user-1")
    const broker = new AgentTokenBroker("user-1", {
      agentOrigin: "https://agent.example",
      initialToken,
      nowSeconds: () => 1_000,
      fetch: async () => {
        mintCalls += 1
        return jsonResponse({ token: token(2_000, "user-1") })
      },
    })

    expect(
      await broker.get(new AbortController().signal)
    ).toBe(initialToken)
    expect(mintCalls).toBe(0)
    expect(tokenBrokerTesting.inspect(broker).cached).toBe(true)
  })

  test("rejects an initial credential for another identity", () => {
    expect(
      () =>
        new AgentTokenBroker("user-1", {
          agentOrigin: "https://agent.example",
          initialToken: token(1_300, "user-2"),
          nowSeconds: () => 1_000,
        })
    ).toThrow("invalid claims")
  })

  test("notifies anonymous recovery when remint authentication expires", async () => {
    let expired = 0
    const broker = new AgentTokenBroker("user-1", {
      agentOrigin: "https://agent.example",
      nowSeconds: () => 1_000,
      onAuthenticationExpired: () => {
        expired += 1
      },
      fetch: async () => jsonResponse({}, 400),
    })

    await expect(
      broker.get(new AbortController().signal)
    ).rejects.toMatchObject({ status: 400 })
    expect(expired).toBe(1)
  })

  test("notifies anonymous recovery when a remint changes subjects", async () => {
    let expired = 0
    const broker = new AgentTokenBroker("anon:user-1", {
      agentOrigin: "https://agent.example",
      nowSeconds: () => 1_000,
      tokenIntent: ANONYMOUS_AGENT_TOKEN_INTENT,
      onAuthenticationExpired: () => {
        expired += 1
      },
      fetch: async () =>
        jsonResponse({ token: token(2_000, "anon:user-2") }),
    })

    await expect(
      broker.get(new AbortController().signal)
    ).rejects.toThrow("invalid claims")
    expect(expired).toBe(1)
  })

  test("coalesces refreshes and refreshes 60 seconds before JWT exp", async () => {
    let now = 1_000
    let mintCalls = 0
    const broker = new AgentTokenBroker("user-1", {
      agentOrigin: "https://agent.example",
      nowSeconds: () => now,
      fetch: async () => {
        mintCalls += 1
        return jsonResponse({
          token: token(mintCalls === 1 ? 1_120 : 1_400),
          expiresAt: 9_999,
        })
      },
    })
    const signal = new AbortController().signal

    const [first, second] = await Promise.all([
      broker.get(signal),
      broker.get(signal),
    ])
    expect(first).toBe(second)
    expect(mintCalls).toBe(1)
    expect(TOKEN_REFRESH_MARGIN_SECONDS).toBe(60)

    now = 1_059
    expect(await broker.get(signal)).toBe(first)
    expect(mintCalls).toBe(1)

    now = 1_060
    expect(await broker.get(signal)).not.toBe(first)
    expect(mintCalls).toBe(2)
  })

  test("retains anonymous intent across expiry and forced 401 remints", async () => {
    let now = 1_000
    let mintCalls = 0
    let agentCalls = 0
    const mintIntents: Array<string | null> = []
    const broker = new AgentTokenBroker("anon:user-1", {
      agentOrigin: "https://agent.example",
      nowSeconds: () => now,
      tokenIntent: ANONYMOUS_AGENT_TOKEN_INTENT,
      fetch: async (input, init) => {
        if (String(input) === "/api/anonymous-agent-token") {
          mintCalls += 1
          mintIntents.push(
            new Headers(init?.headers).get(AGENT_TOKEN_INTENT_HEADER)
          )
          return jsonResponse({
            token: token(
              mintCalls === 1 ? 1_120 : 1_400 + mintCalls,
              "anon:user-1"
            ),
          })
        }
        agentCalls += 1
        return new Response(null, {
          status: agentCalls === 1 ? 401 : 200,
        })
      },
    })
    const signal = new AbortController().signal

    await broker.get(signal)
    now = 1_060
    await broker.get(signal)
    const authorized = await broker.onRequest(
      new URL("https://agent.example/state"),
      { signal }
    )
    const response = await broker.fetchWithAuthRetry(
      "https://agent.example/state",
      authorized
    )

    expect(response.status).toBe(200)
    expect(mintCalls).toBe(3)
    expect(mintIntents).toEqual([
      "anonymous",
      "anonymous",
      "anonymous",
    ])
  })

  test("partitions tokens by identity and aborts the previous refresh", async () => {
    let observedSignal: AbortSignal | undefined
    let resolveFetch: ((response: Response) => void) | undefined
    const broker = new AgentTokenBroker("user-1", {
      agentOrigin: "https://agent.example",
      nowSeconds: () => 1_000,
      fetch: async (_input, init) => {
        observedSignal = init?.signal as AbortSignal
        return await new Promise<Response>((resolve) => {
          resolveFetch = resolve
        })
      },
    })
    const pending = broker.get(new AbortController().signal)
    await Promise.resolve()

    broker.setIdentity("user-2")
    expect(observedSignal?.aborted).toBe(true)
    resolveFetch?.(jsonResponse({ token: token(2_000) }))
    await expect(pending).rejects.toMatchObject({ name: "AbortError" })
  })

  test("propagates caller abort without caching a token", async () => {
    let networkSignal: AbortSignal | undefined
    const broker = new AgentTokenBroker("user-1", {
      agentOrigin: "https://agent.example",
      fetch: async (_input, init) => {
        networkSignal = init?.signal as AbortSignal
        return await new Promise<Response>((_resolve, reject) => {
          networkSignal?.addEventListener(
            "abort",
            () => reject(networkSignal?.reason),
            { once: true }
          )
        })
      },
    })
    const controller = new AbortController()
    const pending = broker.get(controller.signal)
    controller.abort(new DOMException("stop", "AbortError"))

    await expect(pending).rejects.toMatchObject({ name: "AbortError" })
    expect(networkSignal?.aborted).toBe(true)
  })

  test("retries a 401 exactly once with a forced fresh token", async () => {
    const calls: Array<{ url: string; authorization: string | null }> = []
    const mintIntents: Array<string | null> = []
    let minted = 0
    const broker = new AgentTokenBroker("user-1", {
      agentOrigin: "https://agent.example",
      nowSeconds: () => 1_000,
      fetch: async (input, init) => {
        const url = String(input)
        if (url === "/api/agent-token") {
          minted += 1
          mintIntents.push(
            new Headers(init?.headers).get(AGENT_TOKEN_INTENT_HEADER)
          )
          return jsonResponse({ token: token(2_000 + minted, "user-1") })
        }
        calls.push({
          url,
          authorization: new Headers(init?.headers).get("Authorization"),
        })
        return new Response(null, { status: calls.length <= 2 ? 401 : 200 })
      },
    })
    const signal = new AbortController().signal
    const initial = await broker.onRequest(new URL("https://agent.example/state"), {
      signal,
    })
    const response = await broker.fetchWithAuthRetry(
      "https://agent.example/state",
      initial
    )

    expect(response.status).toBe(401)
    expect(calls).toHaveLength(2)
    expect(minted).toBe(2)
    expect(mintIntents).toEqual([null, null])
    expect(calls[0]!.authorization).not.toBe(calls[1]!.authorization)
  })

  test("rejects malformed and expired JWTs even if route metadata says fresh", async () => {
    const malformed = new AgentTokenBroker("user-1", {
      agentOrigin: "https://agent.example",
      nowSeconds: () => 1_000,
      fetch: async () =>
        jsonResponse({ token: "not-a-jwt", expiresAt: 9_999 }),
    })
    await expect(
      malformed.get(new AbortController().signal)
    ).rejects.toBeInstanceOf(AgentAuthenticationError)

    const expired = new AgentTokenBroker("user-1", {
      agentOrigin: "https://agent.example",
      nowSeconds: () => 1_000,
      fetch: async () =>
        jsonResponse({ token: token(999), expiresAt: 9_999 }),
    })
    await expect(
      expired.get(new AbortController().signal)
    ).rejects.toThrow("already expired")
  })

  test("decodes unicode-safe JWT payloads and preserves existing headers", () => {
    expect(tokenBrokerTesting.decodeJwtExpiration(token(2_000, "한글"))).toBe(
      2_000
    )
    const next = tokenBrokerTesting.withAuthorization(
      { headers: { "x-request-id": "req-1" } },
      "fresh"
    )
    const headers = new Headers(next.headers)
    expect(headers.get("x-request-id")).toBe("req-1")
    expect(headers.get("Authorization")).toBe("Bearer fresh")
  })

  test("rejects the wrong JWT subject, issuer, audience, or header shape", async () => {
    const encode = (value: object) =>
      Buffer.from(JSON.stringify(value)).toString("base64url")
    const cases = [
      `${encode({ alg: "none", typ: "JWT" })}.${encode({
        sub: "user-1",
        iss: "syshin0116.dev",
        aud: "agent-api",
        iat: 900,
        exp: 2_000,
      })}.signature`,
      token(2_000, "user-2"),
      `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
        sub: "user-1",
        iss: "evil.example",
        aud: "agent-api",
        iat: 900,
        exp: 2_000,
      })}.signature`,
      `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
        sub: "user-1",
        iss: "syshin0116.dev",
        aud: "other-api",
        iat: 900,
        exp: 2_000,
      })}.signature`,
    ]

    for (const jwt of cases) {
      const broker = new AgentTokenBroker("user-1", {
        agentOrigin: "https://agent.example",
        nowSeconds: () => 1_000,
        fetch: async () => jsonResponse({ token: jwt }),
      })
      await expect(
        broker.get(new AbortController().signal)
      ).rejects.toBeInstanceOf(AgentAuthenticationError)
    }
  })

  test("accepts only a normalized HTTPS or exact loopback origin", () => {
    const options = {
      nowSeconds: () => 1_000,
      fetch: async () => jsonResponse({ token: token(2_000) }),
    }
    for (const agentOrigin of [
      "https://agent.example/path",
      "https://agent.example/?query=1",
      "https://user@agent.example",
      "http://agent.example",
      "http://service.localhost:8000",
    ]) {
      expect(
        () =>
          new AgentTokenBroker("user-1", {
            ...options,
            agentOrigin,
          })
      ).toThrow(AgentAuthenticationError)
    }
    expect(
      () =>
        new AgentTokenBroker("user-1", {
          ...options,
          agentOrigin: "http://localhost:8000",
        })
    ).not.toThrow()
  })

  test("never attaches or refreshes a bearer token outside the exact agent origin", async () => {
    let mintCalls = 0
    let agentCalls = 0
    let foreignCalls = 0
    const broker = new AgentTokenBroker("user-1", {
      agentOrigin: "https://agent.example",
      nowSeconds: () => 1_000,
      fetch: async (input) => {
        const url = String(input)
        if (url === "/api/agent-token") {
          mintCalls += 1
          return jsonResponse({ token: token(2_000) })
        }
        if (new URL(url).origin === "https://agent.example") {
          agentCalls += 1
          return new Response(null, { status: 401 })
        }
        foreignCalls += 1
        return new Response(null, { status: 200 })
      },
    })
    const signal = new AbortController().signal

    await expect(
      broker.onRequest(new URL("https://evil.example/steal"), { signal })
    ).rejects.toBeInstanceOf(AgentAuthenticationError)
    await expect(
      broker.fetchWithAuthRetry("https://evil.example/steal", {
        signal,
        headers: { Authorization: "Bearer must-not-leak" },
      })
    ).rejects.toBeInstanceOf(AgentAuthenticationError)

    const initial = await broker.onRequest(
      new URL("https://agent.example/state"),
      { signal }
    )
    expect(
      (
        await broker.fetchWithAuthRetry(
          "https://agent.example/state",
          initial
        )
      ).status
    ).toBe(401)
    expect({ mintCalls, agentCalls, foreignCalls }).toEqual({
      mintCalls: 2,
      agentCalls: 2,
      foreignCalls: 0,
    })
  })


})
