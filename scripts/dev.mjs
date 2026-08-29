/**
 * Run the whole shop locally: the site and its API together.
 *
 * The site is served by Vite on 5173 and proxies /api to the function server on
 * 3000. Starting only one of the two is the easiest mistake to make here, and
 * it fails as a wall of ECONNREFUSED in the Vite log rather than as anything
 * that names the missing piece, so `npm run dev` starts both.
 *
 * Output from each is prefixed and coloured. Ctrl+C stops both, and either one
 * exiting takes the other down, so there is never a half running pair left
 * behind holding a port.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const parts = [
  { name: 'api ', colour: '\x1b[35m', argv: ['scripts/dev-api.mjs'] },
  { name: 'site', colour: '\x1b[36m', argv: ['node_modules/vite/bin/vite.js'] },
]

/*
 * Stripe's callback, forwarded to the local API.
 *
 * Stripe cannot reach a laptop, so a webhook endpoint in the dashboard can only
 * ever point at a deployed URL; the CLI is what covers local work, by holding an
 * outbound connection open and relaying events back down it. Without it a test
 * card is charged and the order then sits at pending forever, which is a
 * confusing thing to debug, so it is started here rather than left as a step to
 * remember in a third terminal.
 *
 * Skipped, with a reason, when the CLI is absent or the key is a live one. The
 * signing secret is passed through the environment rather than written to .env:
 * it is stable per account, so .env already has it, and re-reading it here keeps
 * the two from drifting if the account ever changes.
 */
function stripeListener() {
  const env = existsSync('.env') ? readFileSync('.env', 'utf8') : ''
  const key = env.match(/^STRIPE_SECRET_KEY=(.*)$/m)?.[1]?.trim()

  if (!key) return { skip: 'STRIPE_SECRET_KEY is not set' }
  if (!key.startsWith('sk_test_')) return { skip: 'not a test key, refusing to forward live events' }

  const probe = spawnSync('stripe', ['--version'], { shell: true, encoding: 'utf8' })
  if (probe.status !== 0) return { skip: 'the Stripe CLI is not installed (scoop install stripe)' }

  return {
    name: 'hook', colour: '\x1b[33m', shell: true,
    argv: ['stripe', 'listen', '--api-key', key, '--forward-to', 'localhost:3000/api/webhook'],
  }
}

const listener = stripeListener()
if (listener.skip) {
  console.log(`\x1b[33mhook\x1b[0m \x1b[2m│\x1b[0m not started: ${listener.skip}`)
  console.log('\x1b[33mhook\x1b[0m \x1b[2m│\x1b[0m orders will stay pending until a webhook reaches the API')
} else {
  parts.push(listener)
}

const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
let stopping = false

const children = parts.map(({ name, colour, argv, shell }) => {
  // Node scripts run on this interpreter; the Stripe CLI is a binary on PATH.
  const [command, args] = shell ? [argv[0], argv.slice(1)] : [process.execPath, argv]
  const child = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: Boolean(shell),
    // Vite's own colours survive, which matters for its ready banner.
    env: { ...process.env, FORCE_COLOR: '1' },
  })

  const prefix = `${colour}${name}${RESET} ${DIM}│${RESET} `
  const pipe = (stream) => {
    let tail = ''
    stream.setEncoding('utf8')
    stream.on('data', (chunk) => {
      const lines = (tail + chunk).split('\n')
      tail = lines.pop() ?? ''
      for (const line of lines) process.stdout.write(prefix + line + '\n')
    })
  }
  pipe(child.stdout)
  pipe(child.stderr)

  child.on('exit', (code) => {
    if (stopping) return
    stopping = true
    process.stdout.write(`${prefix}exited (${code}), stopping the other\n`)
    for (const other of children) if (other !== child) other.kill()
    process.exit(code ?? 0)
  })

  return child
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopping = true
    for (const child of children) child.kill(signal)
    process.exit(0)
  })
}
