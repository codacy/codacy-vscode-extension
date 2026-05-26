import * as vscode from 'vscode'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'
import axios from 'axios'
import type { HTTPClient, HTTPClientRequest, HTTPResponse } from '@segment/analytics-node'

function resolveProxyUrl(): string | undefined {
  // VS Code setting takes precedence; an empty string means "no proxy"
  const vscodeProxy = vscode.workspace.getConfiguration('http').get<string>('proxy')
  if (vscodeProxy !== undefined) {
    return vscodeProxy || undefined
  }

  return (
    process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || undefined
  )
}

function resolveStrictSSL(): boolean {
  return vscode.workspace.getConfiguration('http').get<boolean>('proxyStrictSSL', true)
}

function resolveProxyAuthorization(): string | undefined {
  return vscode.workspace.getConfiguration('http').get<string | null>('proxyAuthorization') ?? undefined
}

/**
 * Applies proxy settings from VS Code config and environment variables to the global axios instance
 */
export function configureAxiosProxy(): void {
  const proxyUrl = resolveProxyUrl()

  if (proxyUrl) {
    const strictSSL = resolveStrictSSL()
    const authHeader = resolveProxyAuthorization()
    const extraHeaders = authHeader ? { 'Proxy-Authorization': authHeader } : undefined

    axios.defaults.httpsAgent = new HttpsProxyAgent(proxyUrl, {
      rejectUnauthorized: strictSSL,
      ...(extraHeaders ? { headers: extraHeaders } : {}),
    })
    axios.defaults.httpAgent = new HttpProxyAgent(proxyUrl, {
      rejectUnauthorized: strictSSL,
    })
    // Disable axios's built-in proxy parsing so the agents take full control
    axios.defaults.proxy = false
  } else {
    axios.defaults.httpsAgent = undefined
    axios.defaults.httpAgent = undefined
    axios.defaults.proxy = undefined
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
    })
    return { status: response.status, statusText: response.statusText }
  }
}
