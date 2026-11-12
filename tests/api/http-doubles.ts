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
  cookie?: string
  headers?: Record<string, string>
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
  const req = {
    method: call.method ?? 'GET',
    query: call.query ?? {},
    body: call.body,
    headers: { ...(call.headers ?? {}), ...(call.cookie ? { cookie: call.cookie } : {}) },
  }
  await handler(req, res)
  return out
}
