/**
 * Just enough of Vercel's request and response for calling a (req, res)
 * handler in a test: the handler sets a status, headers and a JSON body, and
 * this records them.
 */
export interface Result {
  status: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
  headers: Record<string, string>
}

export interface Call {
  method?: string
  query?: Record<string, string>
  body?: unknown
  /** The bytes as sent. The body is then what the platform makes of them (see platformBody). */
  raw?: Buffer
  cookie?: string
  headers?: Record<string, string>
}

/**
 * What the Vercel Node runtime hands a function as `req.body`.
 *
 * When a request has a content type, the runtime reads the whole body before
 * the function runs, so the stream is already spent, and then parses it by
 * that type: JSON, plain text and forms are decoded, application/octet-stream
 * stays the raw bytes, and any other type, image/png included, comes out as
 * undefined. This mirrors getBodyParser in @vercel/node's serverless helpers
 * (node_modules/@vercel/node/dist/dev-server.mjs), which scripts/dev-api.mjs
 * does not copy exactly.
 */
export function platformBody(raw: Buffer, contentType: string | undefined): unknown {
  const type = (contentType ?? 'text/plain').split(';')[0].trim().toLowerCase()
  if (type === 'application/json') return raw.length ? JSON.parse(raw.toString('utf8')) : {}
  if (type === 'application/octet-stream') return raw
  if (type === 'application/x-www-form-urlencoded') return Object.fromEntries(new URLSearchParams(raw.toString('utf8')))
  if (type === 'text/plain') return raw.toString('utf8')
  return undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function invoke(handler: (req: any, res: any) => Promise<unknown>, call: Call = {}): Promise<Result> {
  const out: Result = { status: 200, body: undefined, headers: {} }
  const res = {
    status(code: number) {
      out.status = code
      return res
    },
    setHeader(name: string, value: string) {
      out.headers[name.toLowerCase()] = String(value)
      return res
    },
    send(payload: unknown) {
      out.body = typeof payload === 'string' ? JSON.parse(payload) : payload
      return res
    },
  }
  const headers: Record<string, string> = { ...(call.headers ?? {}), ...(call.cookie ? { cookie: call.cookie } : {}) }
  const req = {
    method: call.method ?? 'GET',
    query: call.query ?? {},
    body: call.raw ? platformBody(call.raw, headers['content-type']) : call.body,
    // The stream has been read and the body is above, as on the platform and in
    // scripts/dev-api.mjs, so nodeBody() takes the body as it is.
    readableEnded: true,
    headers,
  }
  await handler(req, res)
  return out
}
