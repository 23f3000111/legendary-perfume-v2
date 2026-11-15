import { describe, expect, it } from 'vitest'
import { errorUnder } from './fields'

describe('the dashboard fields', () => {
  // A list of lines is one field, but the schema names the line at fault: the
  // field shows that message rather than leaving Publish held with nothing red.
  it("a list field shows the first problem in any of its lines", () => {
    const errors = [
      { path: 'layout.footer.paymentsX', message: 'Not this one.' },
      { path: 'layout.footer.payments.1', message: 'Keep this under 30 characters.' },
    ]
    expect(errorUnder(errors, 'layout.footer.payments')).toBe('Keep this under 30 characters.')
    expect(errorUnder([{ path: 'layout.footer.payments', message: 'Add at least one way to pay.' }, ...errors], 'layout.footer.payments')).toBe(
      'Add at least one way to pay.',
    )
    expect(errorUnder(errors, 'layout.footer.blurb')).toBeUndefined()
  })
})
