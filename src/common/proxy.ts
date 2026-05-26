import * as vscode from 'vscode'
import * as tunnel from 'tunnel'
import { HttpProxyAgent } from 'http-proxy-agent'
import axios from 'axios'
import type { HTTPClient, HTTPClientRequest, HTTPResponse } from '@segment/analytics-node'

function resolveProxyUrl(): string | undefined {
  // VS Code setting takes precedence; an empty string means "no proxy"
  const vscodeProxy = vscode.workspace.getConfiguration('http').get<string>('proxy')
  if (vscodeProxy !== undefined) {
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

function resolveNoProxy(): string[] {
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
 * Applies proxy settings from VS Code config and environment variables to the global axios instance
 */
export function configureAxiosProxy(): void {
  if (noProxyInterceptorId !== null) {
    axios.interceptors.request.eject(noProxyInterceptorId)
    noProxyInterceptorId = null
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

    // Branch on the proxy protocol so TLS proxies work too.
    if (parsed.protocol === 'https:') {
      axios.defaults.httpsAgent = tunnel.httpsOverHttps({ rejectUnauthorized: strictSSL, proxy: proxyOpts })
      axios.defaults.httpAgent = tunnel.httpOverHttps({ proxy: proxyOpts })
    } else {
      axios.defaults.httpsAgent = tunnel.httpsOverHttp({ rejectUnauthorized: strictSSL, proxy: proxyOpts })
      axios.defaults.httpAgent = new HttpProxyAgent(normalizedUrl)
    }
    // Disable axios's built-in proxy parsing so the agents take full control
    axios.defaults.proxy = false

    // Per-connection rejectUnauthorized on the tunnel agent is not sufficient
    // in all Node.js versions to suppress TLS errors from an intercepting
    // proxy cert. Mirror the VS Code proxyStrictSSL setting via the
    // process-level flag so it is reliably honoured.
    if (!strictSSL) {
      process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
    } else {
      delete process.env['NODE_TLS_REJECT_UNAUTHORIZED']
    }

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
    axios.defaults.httpsAgent = undefined
    axios.defaults.httpAgent = undefined
    axios.defaults.proxy = undefined
    // Restore TLS verification when proxy is removed or strictSSL is re-enabled
    delete process.env['NODE_TLS_REJECT_UNAUTHORIZED']
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
