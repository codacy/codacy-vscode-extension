/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from 'assert'
import * as http from 'http'
import * as https from 'https'
import { SinonSandbox, createSandbox } from 'sinon'
import * as vscode from 'vscode'
import axios from 'axios'
import { HttpProxyAgent } from 'http-proxy-agent'
import { configureAxiosProxy } from '../../../common/proxy'

function makeHttpConfig(opts: { proxy?: string; proxyStrictSSL?: boolean; proxyAuthorization?: string | null }) {
  return {
    get: <T>(key: string, defaultValue?: T): T | undefined => {
      if (key === 'proxy') return opts.proxy as unknown as T
      if (key === 'proxyStrictSSL') return (opts.proxyStrictSSL !== undefined ? opts.proxyStrictSSL : defaultValue) as T
      if (key === 'proxyAuthorization') return (opts.proxyAuthorization ?? undefined) as T
      return defaultValue
    },
    has: () => false,
    inspect: () => undefined,
    update: async () => {},
  } as unknown as vscode.WorkspaceConfiguration
}

suite('configureAxiosProxy', () => {
  let sandbox: SinonSandbox
  let savedEnv: Record<string, string | undefined>
  let initialInterceptorHandlerCount: number

  setup(() => {
    sandbox = createSandbox()
    initialInterceptorHandlerCount = (axios.interceptors.request as any).handlers.length
    savedEnv = {
      NODE_TLS_REJECT_UNAUTHORIZED: process.env['NODE_TLS_REJECT_UNAUTHORIZED'],
      HTTPS_PROXY: process.env['HTTPS_PROXY'],
      https_proxy: process.env['https_proxy'],
      HTTP_PROXY: process.env['HTTP_PROXY'],
      http_proxy: process.env['http_proxy'],
      NO_PROXY: process.env['NO_PROXY'],
      no_proxy: process.env['no_proxy'],
    }
    delete process.env['NODE_TLS_REJECT_UNAUTHORIZED']
    delete process.env['HTTPS_PROXY']
    delete process.env['https_proxy']
    delete process.env['HTTP_PROXY']
    delete process.env['http_proxy']
    delete process.env['NO_PROXY']
    delete process.env['no_proxy']
  })

  teardown(() => {
    sandbox.restore()
    axios.defaults.httpsAgent = undefined
    axios.defaults.httpAgent = undefined
    axios.defaults.proxy = undefined
    // Eject any interceptors added during this test
    const handlers = (axios.interceptors.request as any).handlers as Array<any>
    for (let i = initialInterceptorHandlerCount; i < handlers.length; i++) {
      if (handlers[i] !== null) {
        axios.interceptors.request.eject(i)
      }
    }
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) {
        delete process.env[k]
      } else {
        process.env[k] = v
      }
    }
  })

  function stubConfig(opts: { proxy?: string; proxyStrictSSL?: boolean; proxyAuthorization?: string | null }) {
    sandbox.stub(vscode.workspace, 'getConfiguration').callsFake((section?: string) => {
      if (section === 'http') return makeHttpConfig(opts)
      return makeHttpConfig({})
    })
  }

  function activeInterceptorCount(): number {
    return ((axios.interceptors.request as any).handlers as Array<any>).filter(Boolean).length
  }

  function getLastInterceptorFn(): ((config: any) => any) | undefined {
    const handlers = (axios.interceptors.request as any).handlers as Array<{ fulfilled: (c: any) => any } | null>
    return [...handlers].reverse().find(Boolean)?.fulfilled
  }

  // --- proxy agent setup ---

  test('sets httpsOverHttp and HttpProxyAgent for an http:// proxy', () => {
    stubConfig({ proxy: 'http://proxy.example.com:8080' })
    configureAxiosProxy()

    const httpsAgent = axios.defaults.httpsAgent as any
    assert.ok(httpsAgent, 'httpsAgent must be set')
    assert.strictEqual(httpsAgent.request, http.request, 'httpsAgent should be a httpsOverHttp tunnel agent')
    assert.strictEqual(httpsAgent.options.proxy.host, 'proxy.example.com')
    assert.strictEqual(httpsAgent.options.proxy.port, 8080)

    assert.ok(axios.defaults.httpAgent instanceof HttpProxyAgent, 'httpAgent should be an HttpProxyAgent')
    assert.strictEqual(axios.defaults.proxy, false, 'axios built-in proxy parsing must be disabled')
  })

  test('sets httpsOverHttps and httpOverHttps for an https:// proxy', () => {
    stubConfig({ proxy: 'https://proxy.example.com:8443' })
    configureAxiosProxy()

    const httpsAgent = axios.defaults.httpsAgent as any
    assert.ok(httpsAgent, 'httpsAgent must be set')
    assert.strictEqual(httpsAgent.request, https.request, 'httpsAgent should be a httpsOverHttps tunnel agent')
    assert.strictEqual(httpsAgent.options.proxy.host, 'proxy.example.com')
    assert.strictEqual(httpsAgent.options.proxy.port, 8443)

    const httpAgent = axios.defaults.httpAgent as any
    assert.ok(httpAgent, 'httpAgent must be set')
    assert.strictEqual(httpAgent.request, https.request, 'httpAgent should be a httpOverHttps tunnel agent')
    assert.strictEqual(axios.defaults.proxy, false)
  })

  test('sets NODE_TLS_REJECT_UNAUTHORIZED=0 when proxyStrictSSL is false', () => {
    stubConfig({ proxy: 'http://proxy.example.com:8080', proxyStrictSSL: false })
    configureAxiosProxy()

    assert.strictEqual(process.env['NODE_TLS_REJECT_UNAUTHORIZED'], '0')
    const httpsAgent = axios.defaults.httpsAgent as any
    assert.strictEqual(httpsAgent.options.rejectUnauthorized, false)
  })

  test('clears NODE_TLS_REJECT_UNAUTHORIZED when proxyStrictSSL is true', () => {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
    stubConfig({ proxy: 'http://proxy.example.com:8080', proxyStrictSSL: true })
    configureAxiosProxy()

    assert.strictEqual(process.env['NODE_TLS_REJECT_UNAUTHORIZED'], undefined)
    const httpsAgent = axios.defaults.httpsAgent as any
    assert.strictEqual(httpsAgent.options.rejectUnauthorized, true)
  })

  test('includes Proxy-Authorization header when proxyAuthorization is set', () => {
    stubConfig({ proxy: 'http://proxy.example.com:8080', proxyAuthorization: 'Basic dXNlcjpwYXNz' })
    configureAxiosProxy()

    const httpsAgent = axios.defaults.httpsAgent as any
    assert.deepStrictEqual(httpsAgent.options.proxy.headers, { 'Proxy-Authorization': 'Basic dXNlcjpwYXNz' })
  })

  test('no proxy headers when proxyAuthorization is not set', () => {
    stubConfig({ proxy: 'http://proxy.example.com:8080' })
    configureAxiosProxy()

    const httpsAgent = axios.defaults.httpsAgent as any
    assert.strictEqual(httpsAgent.options.proxy.headers, undefined)
  })

  test('clears agents and env var when proxy is not configured', () => {
    axios.defaults.httpsAgent = {} as any
    axios.defaults.httpAgent = {} as any
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

    stubConfig({ proxy: undefined })
    configureAxiosProxy()

    assert.strictEqual(axios.defaults.httpsAgent, undefined)
    assert.strictEqual(axios.defaults.httpAgent, undefined)
    assert.strictEqual(axios.defaults.proxy, undefined)
    assert.strictEqual(process.env['NODE_TLS_REJECT_UNAUTHORIZED'], undefined)
  })

  test('empty VS Code proxy string is treated as no proxy', () => {
    stubConfig({ proxy: '' })
    configureAxiosProxy()

    assert.strictEqual(axios.defaults.httpsAgent, undefined)
    assert.strictEqual(axios.defaults.httpAgent, undefined)
  })

  test('falls back to HTTPS_PROXY env var when VS Code proxy is undefined', () => {
    process.env['HTTPS_PROXY'] = 'http://envproxy.example.com:3128'
    stubConfig({ proxy: undefined })
    configureAxiosProxy()

    const httpsAgent = axios.defaults.httpsAgent as any
    assert.ok(httpsAgent, 'httpsAgent must be set from HTTPS_PROXY env var')
    assert.strictEqual(httpsAgent.options.proxy.host, 'envproxy.example.com')
    assert.strictEqual(httpsAgent.options.proxy.port, 3128)
    assert.strictEqual(axios.defaults.proxy, false)
  })

  test('VS Code proxy setting takes precedence over HTTPS_PROXY env var', () => {
    process.env['HTTPS_PROXY'] = 'http://envproxy.example.com:3128'
    stubConfig({ proxy: 'http://vscodeproxy.example.com:8080' })
    configureAxiosProxy()

    const httpsAgent = axios.defaults.httpsAgent as any
    assert.strictEqual(httpsAgent.options.proxy.host, 'vscodeproxy.example.com')
    assert.strictEqual(httpsAgent.options.proxy.port, 8080)
  })

  test('uses default port 80 when http:// proxy has no explicit port', () => {
    stubConfig({ proxy: 'http://proxy.example.com' })
    configureAxiosProxy()

    const httpsAgent = axios.defaults.httpsAgent as any
    assert.strictEqual(httpsAgent.options.proxy.port, 80)
  })

  test('uses default port 443 when https:// proxy has no explicit port', () => {
    stubConfig({ proxy: 'https://proxy.example.com' })
    configureAxiosProxy()

    const httpsAgent = axios.defaults.httpsAgent as any
    assert.strictEqual(httpsAgent.options.proxy.port, 443)
  })

  test('normalizes a protocol-less proxy URL before parsing', () => {
    stubConfig({ proxy: 'proxy.example.com:8080' })
    configureAxiosProxy()

    const httpsAgent = axios.defaults.httpsAgent as any
    assert.ok(httpsAgent, 'httpsAgent must be set for a bare host:port proxy')
    assert.strictEqual(httpsAgent.options.proxy.host, 'proxy.example.com')
    assert.strictEqual(httpsAgent.options.proxy.port, 8080)
  })

  // --- NO_PROXY ---

  test('registers a request interceptor when NO_PROXY is set', () => {
    process.env['NO_PROXY'] = 'internal.example.com'
    stubConfig({ proxy: 'http://proxy.example.com:8080' })
    const before = activeInterceptorCount()
    configureAxiosProxy()

    assert.strictEqual(activeInterceptorCount(), before + 1)
  })

  test('interceptor clears agents for a host that matches NO_PROXY', () => {
    process.env['NO_PROXY'] = 'internal.example.com'
    stubConfig({ proxy: 'http://proxy.example.com:8080' })
    configureAxiosProxy()

    const fn = getLastInterceptorFn()!
    const config = { url: 'https://internal.example.com/api', httpsAgent: {}, httpAgent: {}, proxy: false as const }
    const result = fn(config)

    assert.strictEqual(result.httpsAgent, undefined)
    assert.strictEqual(result.httpAgent, undefined)
    assert.strictEqual(result.proxy, undefined)
  })

  test('interceptor leaves agents intact for a host that does not match NO_PROXY', () => {
    process.env['NO_PROXY'] = 'internal.example.com'
    stubConfig({ proxy: 'http://proxy.example.com:8080' })
    configureAxiosProxy()

    const fn = getLastInterceptorFn()!
    const agent = {}
    const config = { url: 'https://app.codacy.com/api', httpsAgent: agent, httpAgent: agent, proxy: false as const }
    const result = fn(config)

    assert.strictEqual(result.httpsAgent, agent)
    assert.strictEqual(result.httpAgent, agent)
  })

  test('interceptor bypasses proxy for subdomains of a NO_PROXY entry', () => {
    process.env['NO_PROXY'] = '.example.com'
    stubConfig({ proxy: 'http://proxy.example.com:8080' })
    configureAxiosProxy()

    const fn = getLastInterceptorFn()!
    const result = fn({ url: 'https://sub.example.com/api', httpsAgent: {}, proxy: false as const })

    assert.strictEqual(result.httpsAgent, undefined)
  })

  test('interceptor bypasses proxy for all hosts when NO_PROXY is *', () => {
    process.env['NO_PROXY'] = '*'
    stubConfig({ proxy: 'http://proxy.example.com:8080' })
    configureAxiosProxy()

    const fn = getLastInterceptorFn()!
    const result = fn({ url: 'https://anything.com/api', httpsAgent: {}, proxy: false as const })

    assert.strictEqual(result.httpsAgent, undefined)
  })

  test('no_proxy lowercase env var is respected', () => {
    process.env['no_proxy'] = 'internal.example.com'
    stubConfig({ proxy: 'http://proxy.example.com:8080' })
    const before = activeInterceptorCount()
    configureAxiosProxy()

    assert.strictEqual(activeInterceptorCount(), before + 1)
  })

  test('no interceptor registered when NO_PROXY is not set', () => {
    stubConfig({ proxy: 'http://proxy.example.com:8080' })
    const before = activeInterceptorCount()
    configureAxiosProxy()

    assert.strictEqual(activeInterceptorCount(), before)
  })

  test('re-calling configureAxiosProxy replaces the NO_PROXY interceptor rather than accumulating', () => {
    process.env['NO_PROXY'] = 'internal.example.com'
    stubConfig({ proxy: 'http://proxy.example.com:8080' })
    const before = activeInterceptorCount()
    configureAxiosProxy()
    configureAxiosProxy()

    assert.strictEqual(activeInterceptorCount(), before + 1)
  })
})
