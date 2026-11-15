import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { applyDrafts } from '../content/preview'
import { CONTENT } from '../content/registry'
import siteJson from '../content/site.json'
import pagesJson from '../content/pages.json'
import { FaqHelp } from './Faq'

describe('the FAQ page', () => {
  // The words either side of the number are the page's; the number is the
  // site details', so a new number shows here as everywhere else.
  it("the FAQ page's help line carries the number from Site details", () => {
    const saved = structuredClone(siteJson)
    try {
      applyDrafts({ site: { ...saved, whatsapp: '+60 12 345 6789' } }, CONTENT)
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <FaqHelp />
        </MemoryRouter>,
      )
      expect(html).toContain('WhatsApp at +60 12 345 6789, or you')
    } finally {
      applyDrafts({ site: saved }, CONTENT)
    }
  })

  // Publish trims what the team typed, so words after the number arrive with
  // no leading space; the page must still keep them apart from the number.
  it('words after the number keep their space, as published', () => {
    const saved = structuredClone(pagesJson)
    const draft = structuredClone(pagesJson)
    draft.faq.help.after = 'or send us a note and we will reply within one business day.'
    try {
      applyDrafts({ pages: draft }, CONTENT)
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <FaqHelp />
        </MemoryRouter>,
      )
      expect(html).toContain('WhatsApp at +60 19 383 6633 or send us a note')
    } finally {
      applyDrafts({ pages: saved }, CONTENT)
    }
  })
})
