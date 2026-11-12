import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    adminContentState: vi.fn(),
    adminSaveDraft: vi.fn(),
    adminDiscardDraft: vi.fn(),
    adminPublish: vi.fn(),
    adminRestore: vi.fn(),
    adminDeployStatus: vi.fn(),
  }
})

import * as api from '../lib/api'
import { ApiError } from '../lib/api'
import { useContent } from './contentStore'

const mocked = vi.mocked(api)

const FAQ = (intro = 'Published intro.') => ({
  intro,
  sections: [{ title: 'About Orchid', items: [{ q: 'Is it orchid based?', a: 'No.' }] }],
  product: [{ q: 'How long does it last?', a: 'Four to seven hours.' }],
})

function serverState() {
  return {
    configured: true,
    branch: 'main',
    durable: true,
    docs: {
      faq: { label: 'FAQ', published: FAQ(), sha: 'sha-faq-1', draft: null, draftBase: null, errors: [], warnings: [] },
    },
  }
}

const savedDraft = (doc: string) => ({ draft: { doc, data: {}, baseSha: 'sha-faq-1', updatedAt: '2026-11-12T10:00:00.000Z' }, errors: [], warnings: [] })

beforeEach(async () => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  useContent.setState({ status: 'loading', docs: {}, publishing: { state: 'idle' } })
  mocked.adminContentState.mockResolvedValue(serverState())
  mocked.adminSaveDraft.mockImplementation(async (doc) => savedDraft(doc))
  await useContent.getState().load()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('the dashboard content store', () => {
  it('edit marks the document dirty and autosaves once after 800 ms', async () => {
    const { edit } = useContent.getState()
    edit('faq', FAQ('One'))
    expect(useContent.getState().dirty()).toEqual(['faq'])
    await vi.advanceTimersByTimeAsync(500)
    edit('faq', FAQ('Two'))
    await vi.advanceTimersByTimeAsync(799)
    expect(mocked.adminSaveDraft).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(mocked.adminSaveDraft).toHaveBeenCalledTimes(1)
    expect(mocked.adminSaveDraft).toHaveBeenCalledWith('faq', FAQ('Two'))
    expect(useContent.getState().docs.faq?.save).toBe('saved')
  })

  it('an edit back to the published text discards the draft instead of saving it', async () => {
    const { edit } = useContent.getState()
    edit('faq', FAQ('Changed'))
    edit('faq', FAQ())
    await vi.advanceTimersByTimeAsync(800)
    expect(mocked.adminSaveDraft).not.toHaveBeenCalled()
    expect(mocked.adminDiscardDraft).toHaveBeenCalledWith('faq')
    expect(useContent.getState().dirty()).toEqual([])
  })

  it('a 401 on autosave keeps the edits', async () => {
    mocked.adminSaveDraft.mockRejectedValue(new ApiError(401, 'Please sign in again.'))
    useContent.getState().edit('faq', FAQ('Edited while signed out'))
    await vi.advanceTimersByTimeAsync(800)
    const faq = useContent.getState().docs.faq!
    expect(faq.save).toBe('signed-out')
    expect(faq.working).toEqual(FAQ('Edited while signed out'))
  })

  it('a 409 on publish shows the conflict', async () => {
    mocked.adminPublish.mockRejectedValue(
      new ApiError(409, 'FAQ changed since you began editing.', { error: 'FAQ changed since you began editing.', conflicts: ['faq'] }),
    )
    useContent.getState().edit('faq', FAQ('Mine'))
    await useContent.getState().publish(['faq'])
    const { publishing } = useContent.getState()
    expect(publishing.state).toBe('conflict')
    expect(publishing.conflicts).toEqual(['faq'])
  })

  it('a successful publish polls until live', async () => {
    mocked.adminPublish.mockResolvedValue({ commit: 'commit-1' })
    mocked.adminDeployStatus.mockResolvedValueOnce({ state: 'pending' }).mockResolvedValueOnce({ state: 'success' })

    useContent.getState().edit('faq', FAQ('Going live'))
    await useContent.getState().publish(['faq'])
    // The edit was saved before publishing, without waiting for the autosave.
    expect(mocked.adminSaveDraft.mock.invocationCallOrder[0]).toBeLessThan(mocked.adminPublish.mock.invocationCallOrder[0])
    expect(useContent.getState().publishing).toMatchObject({ state: 'deploying', commit: 'commit-1' })

    await vi.advanceTimersByTimeAsync(5000)
    expect(useContent.getState().publishing.state).toBe('deploying')
    await vi.advanceTimersByTimeAsync(5000)
    expect(useContent.getState().publishing.state).toBe('live')
    expect(mocked.adminDeployStatus).toHaveBeenCalledTimes(2)
    expect(mocked.adminDeployStatus).toHaveBeenCalledWith('commit-1')
    // The published content is read again once live.
    expect(mocked.adminContentState).toHaveBeenCalledTimes(2)
  })

  it('a failed deploy is reported and the drafts are kept', async () => {
    mocked.adminPublish.mockResolvedValue({ commit: 'commit-2' })
    mocked.adminDeployStatus.mockResolvedValue({ state: 'failure' })
    useContent.getState().edit('faq', FAQ('Not live yet'))
    await useContent.getState().publish(['faq'])
    await vi.advanceTimersByTimeAsync(5000)
    const { publishing, docs } = useContent.getState()
    expect(publishing.state).toBe('failed')
    expect(publishing.message).toMatch(/unchanged/i)
    expect(docs.faq?.working).toEqual(FAQ('Not live yet'))
  })

  it('stops waiting after five minutes', async () => {
    mocked.adminPublish.mockResolvedValue({ commit: 'commit-3' })
    mocked.adminDeployStatus.mockResolvedValue({ state: 'pending' })
    useContent.getState().edit('faq', FAQ('Slow'))
    await useContent.getState().publish(['faq'])
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(useContent.getState().publishing).toMatchObject({
      state: 'failed',
      message: 'Not live after 5 minutes. The site is unchanged.',
    })
  })
})
