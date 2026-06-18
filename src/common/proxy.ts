import * as fs from 'fs'
import * as https from 'https'
import * as os from 'os'
import * as tls from 'tls'
import * as vscode from 'vscode'
import * as tunnel from 'tunnel'
import { HttpProxyAgent } from 'http-proxy-agent'
import axios from 'axios'
import type { HTTPClient, HTTPClientRequest, HTTPResponse } from '@segment/analytics-node'
import Logger from './logger'

function resolveProxyUrl(): string | undefined {
  // VS Code setting takes precedence; an empty string means "no proxy"
  const vscodeProxy = vscode.workspace.getConfiguration('http').get<string>('proxy')
  if (vscodeProxy !== undefined && vscodeProxy !== '') {
    return vscodeProxy
  }

  return process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy
}

function resolveStrictSSL(): boolean {
  return vscode.workspace.getConfiguration('http').get<boolean>('proxyStrictSSL', true)
}

function resolveProxyAuthorization(): string | undefined {
  return vscode.workspace.getConfiguration('http').get<string | null>('proxyAuthorization') ?? undefined
}

/**
 * Resolves the configured CA cert file paths, expanding `~` and `$VAR`.
 *
 * Reads from both the `codacy.proxy.caCertPath` VS Code setting and the
 * NODE_EXTRA_CA_CERTS env var. The setting is listed first and takes
 * precedence — it is launch-independent, whereas NODE_EXTRA_CA_CERTS is only
 * present when VS Code is launched from a shell (not from the Dock/Finder).
 */
function resolveCACertPaths(): { raw: string; resolved: string }[] {
  const raw = [
    vscode.workspace.getConfiguration('codacy').get<string>('proxy.caCertPath'),
    process.env.NODE_EXTRA_CA_CERTS,
  ].filter((p): p is string => !!p)

  return raw.map((rawPath) => ({
    raw: rawPath,
    resolved: rawPath
      .replace(/^~(?=\/|$)/, os.homedir())
      .replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, v) => process.env[v] ?? `$${v}`),
  }))
}

/**
 * Returns the resolved path of the first readable configured CA cert, or
 * undefined if none are readable. Used to pass a single cert file to
 * subprocesses (the MCP server and the CLI), which both accept only one path.
 */
function resolveReadableCACertPath(): string | undefined {
  const certFile = resolveCACertPaths().find(({ resolved }) => {
    try {
      fs.accessSync(resolved, fs.constants.R_OK)
      return true
    } catch (_e) {
      Logger.warn(`Skipping unreadable CA cert: ${resolved}`)
      return false
    }
  })
  return certFile?.resolved
}

function resolveCA(): Buffer[] | undefined {
  const extra: Buffer[] = []

  for (const { raw, resolved } of resolveCACertPaths()) {
    try {
      extra.push(fs.readFileSync(resolved))
    } catch (_e) {
      Logger.error(
        `Failed to load CA cert from ${raw} (resolved: ${resolved}): ${_e instanceof Error ? _e.message : String(_e)}`
      )
      // ignore missing or unreadable cert files
    }
  }

  if (extra.length === 0) return undefined
  return [...tls.rootCertificates.map((c) => Buffer.from(c)), ...extra]
}

function resolveNoProxy(): string[] {
  // VS Code setting takes precedence over env vars
  const vscodeNoProxy = vscode.workspace.getConfiguration('http').get<string[]>('noProxy')
  if (vscodeNoProxy !== undefined && vscodeNoProxy.length > 0) {
    return vscodeNoProxy
  }

  const raw = process.env.NO_PROXY || process.env.no_proxy || ''
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function hostMatchesNoProxy(hostname: string, entry: string): boolean {
  if (entry === '*') return true
  const normalized = entry.startsWith('.') ? entry.slice(1) : entry
  return hostname === normalized || hostname.endsWith('.' + normalized)
}

function shouldBypassProxy(url: string, noProxyList: string[]): boolean {
  try {
    const { hostname } = new URL(url)
    return noProxyList.some((entry) => hostMatchesNoProxy(hostname, entry))
  } catch {
    return false
  }
}

// Ensures the URL has a protocol so `new URL()` doesn't throw for bare host:port strings
function normalizeProxyUrl(url: string): string {
  return url.includes('://') ? url : `http://${url}`
}

let noProxyInterceptorId: number | null = null

/**
 * Mirrors the proxyStrictSSL setting onto the process-level
 * NODE_TLS_REJECT_UNAUTHORIZED flag. Per-connection rejectUnauthorized on the
 * agent is not reliable across all Node versions, so the env flag is used as
 * the authoritative switch (and cleared when strict SSL is enabled).
 */
function applyStrictSSLEnv(strictSSL: boolean): void {
  if (!strictSSL) {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
  } else {
    delete process.env['NODE_TLS_REJECT_UNAUTHORIZED']
  }
}

/**
 * Returns proxy-related env vars suitable for passing to a subprocess (e.g. an MCP server).
 * Translates VS Code proxy settings into standard env var form.
 */
export function buildProxyEnv(): Record<string, string> {
  const env: Record<string, string> = {}

  const proxyUrl = resolveProxyUrl()
  if (proxyUrl) {
    env.HTTPS_PROXY = proxyUrl
    env.HTTP_PROXY = proxyUrl

    if (!resolveStrictSSL()) {
      env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }
  }

  const noProxyList = resolveNoProxy()
  if (noProxyList.length > 0) {
    env.NO_PROXY = noProxyList.join(',')
  }

  // Pass the configured CA cert to Node subprocesses (e.g. the MCP server) via
  // NODE_EXTRA_CA_CERTS. Use the resolved path from settings/env so it also
  // works when VS Code is launched from the Dock, where shell env vars are
  // absent. This var takes a single file, so use the first readable cert path
  // (the codacy.proxy.caCertPath setting is preferred over NODE_EXTRA_CA_CERTS).
  const caCertPath = resolveReadableCACertPath()
  if (caCertPath) {
    env.NODE_EXTRA_CA_CERTS = caCertPath
  }

  return env
}

/**
 * Returns proxy-related env vars suitable for passing to the Codacy CLI subprocess.
 * Extends buildProxyEnv() with CLI-specific variable names:
 * - CODACY_CLI_INSECURE instead of NODE_TLS_REJECT_UNAUTHORIZED
 * - SSL_CERT_FILE instead of NODE_EXTRA_CA_CERTS
 */
export function buildCliProxyEnv(): Record<string, string> {
  const env = buildProxyEnv()

  if (env.NODE_TLS_REJECT_UNAUTHORIZED !== undefined) {
    delete env.NODE_TLS_REJECT_UNAUTHORIZED
    env.CODACY_CLI_INSECURE = 'true'
  }

  // The CLI is not a Node process, so translate the Node-style var to the one
  // the CLI honours.
  if (env.NODE_EXTRA_CA_CERTS !== undefined) {
    env.SSL_CERT_FILE = env.NODE_EXTRA_CA_CERTS
    delete env.NODE_EXTRA_CA_CERTS
  }

  return env
}

/**
 * Applies proxy settings from VS Code config and environment variables to the global axios instance
 */
export function configureAxiosProxy(): void {
  if (noProxyInterceptorId !== null) {
    axios.interceptors.request.eject(noProxyInterceptorId)
    noProxyInterceptorId = null
  }

  // Resolve CA certs once, before branching, so they can be applied globally.
  // This is necessary because VS Code's built-in proxy support (http.proxySupport: "override")
  // patches Node's HTTP/HTTPS modules and may handle TLS connections using the global agent
  // rather than the extension's custom tunnel agents. When NODE_EXTRA_CA_CERTS is not
  // processed at process startup (e.g. VS Code launched from a GUI rather than a terminal),
  // the default trust store lacks the extra CA — setting it on the global agent ensures
  // all TLS connections in the process can verify the certificate.
  const ca = resolveCA()
  if (ca) {
    https.globalAgent.options.ca = ca
  }

  const proxyUrl = resolveProxyUrl()

  if (proxyUrl) {
    const strictSSL = resolveStrictSSL()
    const authHeader = resolveProxyAuthorization()

    const normalizedUrl = normalizeProxyUrl(proxyUrl)
    const parsed = new URL(normalizedUrl)
    const proxyHost = parsed.hostname
    const proxyPort = parseInt(parsed.port || (parsed.protocol === 'https:' ? '443' : '80'), 10)
    const proxyHeaders = authHeader ? { 'Proxy-Authorization': authHeader } : undefined
    const proxyOpts = { host: proxyHost, port: proxyPort, ...(proxyHeaders ? { headers: proxyHeaders } : {}) }

    const tlsOpts = { rejectUnauthorized: strictSSL, ...(ca ? { ca } : {}) }

    // Branch on the proxy protocol so TLS proxies work too.
    if (parsed.protocol === 'https:') {
      axios.defaults.httpsAgent = tunnel.httpsOverHttps({ ...tlsOpts, proxy: proxyOpts })
      axios.defaults.httpAgent = tunnel.httpOverHttps({ proxy: proxyOpts })
    } else {
      axios.defaults.httpsAgent = tunnel.httpsOverHttp({ ...tlsOpts, proxy: proxyOpts })
      axios.defaults.httpAgent = new HttpProxyAgent(normalizedUrl)
    }
    // Disable axios's built-in proxy parsing so the agents take full control
    axios.defaults.proxy = false

    applyStrictSSLEnv(strictSSL)

    const noProxyList = resolveNoProxy()
    if (noProxyList.length > 0) {
      noProxyInterceptorId = axios.interceptors.request.use((config) => {
        if (config.url && shouldBypassProxy(config.url, noProxyList)) {
          config.httpsAgent = undefined
          config.httpAgent = undefined
          config.proxy = undefined
        }
        return config
      })
    }
  } else {
    const strictSSL = resolveStrictSSL()
    // Apply extra CA certs for transparent/system-level proxies even without an explicit proxy URL.
    axios.defaults.httpsAgent = ca ? new https.Agent({ ca, rejectUnauthorized: strictSSL }) : undefined
    axios.defaults.httpAgent = undefined
    axios.defaults.proxy = undefined
    // Mirror proxyStrictSSL even without an explicit proxy URL: the agent is
    // undefined when no extra CA cert is configured, so the process-level flag
    // is what actually honours the setting here.
    applyStrictSSLEnv(strictSSL)
  }
}

/**
 * An HTTPClient implementation for @segment/analytics-node that routes
 * requests through the proxy configured in axios defaults (if any).
 */
export class ProxiedSegmentHTTPClient implements HTTPClient {
  async makeRequest(options: HTTPClientRequest): Promise<HTTPResponse> {
    const response = await axios.post(options.url, options.data, {
      headers: options.headers,
      timeout: options.httpRequestTimeout,
      validateStatus: () => true,
    })
    return { status: response.status, statusText: response.statusText }
  }
}
