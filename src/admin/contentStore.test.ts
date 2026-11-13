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
import { ApiError, type ContentState } from '../lib/api'
import { useContent } from './contentStore'

const mocked = vi.mocked(api)

const FAQ = (intro = 'Published intro.') => ({
  intro,
  sections: [{ title: 'About Orchid', items: [{ q: 'Is it orchid based?', a: 'No.' }] }],
  product: [{ q: 'How long does it last?', a: 'Four to seven hours.' }],
})

function serverState(): ContentState {
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
    expect(mocked.adminSaveDraft).toHaveBeenCalledWith('faq', FAQ('Two'), 'sha-faq-1')
    expect(useContent.getState().docs.faq?.save).toBe('saved')
  })

  it('a draft continuing a saved one carries that draft’s base', async () => {
    const state = serverState()
    state.docs.faq = { ...state.docs.faq!, draft: FAQ('Drafted yesterday'), draftBase: 'sha-faq-0' }
    mocked.adminContentState.mockResolvedValue(state)
    await useContent.getState().load()
    useContent.getState().edit('faq', FAQ('Drafted yesterday, and today'))
    await vi.advanceTimersByTimeAsync(800)
    expect(mocked.adminSaveDraft).toHaveBeenCalledWith('faq', FAQ('Drafted yesterday, and today'), 'sha-faq-0')
  })

  it('after a discard the next draft starts from the published version', async () => {
    const state = serverState()
    state.docs.faq = { ...state.docs.faq!, draft: FAQ('Drafted yesterday'), draftBase: 'sha-faq-0' }
    mocked.adminContentState.mockResolvedValue(state)
    await useContent.getState().load()
    await useContent.getState().discard('faq')
    useContent.getState().edit('faq', FAQ('A fresh start'))
    await vi.advanceTimersByTimeAsync(800)
    expect(mocked.adminSaveDraft).toHaveBeenCalledWith('faq', FAQ('A fresh start'), 'sha-faq-1')
  })

  it('after editing back to the published text the next draft starts from the published version', async () => {
    const state = serverState()
    state.docs.faq = { ...state.docs.faq!, draft: FAQ('Drafted yesterday'), draftBase: 'sha-faq-0' }
    mocked.adminContentState.mockResolvedValue(state)
    await useContent.getState().load()
    useContent.getState().edit('faq', FAQ())
    await vi.advanceTimersByTimeAsync(800)
    expect(mocked.adminDiscardDraft).toHaveBeenCalledWith('faq')
    useContent.getState().edit('faq', FAQ('A fresh start'))
    await vi.advanceTimersByTimeAsync(800)
    expect(mocked.adminSaveDraft).toHaveBeenCalledWith('faq', FAQ('A fresh start'), 'sha-faq-1')
  })

  it('after a publish the next draft starts from the version just published', async () => {
    mocked.adminPublish.mockResolvedValue({ commit: 'commit-1', shas: { faq: 'sha-faq-2' } })
    mocked.adminDeployStatus.mockResolvedValue({ state: 'pending' })
    useContent.getState().edit('faq', FAQ('First change'))
    await useContent.getState().publish(['faq'])
    useContent.getState().edit('faq', FAQ('Second change'))
    await vi.advanceTimersByTimeAsync(800)
    expect(mocked.adminSaveDraft).toHaveBeenLastCalledWith('faq', FAQ('Second change'), 'sha-faq-2')
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

  /** Make the next draft save hang until the returned function is called. */
  function holdNextSave(): () => void {
    let release!: () => void
    mocked.adminSaveDraft.mockImplementationOnce(
      (doc) => new Promise((resolve) => {
        release = () => resolve(savedDraft(doc))
      }),
    )
    return () => release()
  }

  it('publish waits for an autosave already on its way', async () => {
    const release = holdNextSave()
    mocked.adminPublish.mockResolvedValue({ commit: 'commit-1', shas: { faq: 'sha-faq-2' } })
    mocked.adminDeployStatus.mockResolvedValue({ state: 'pending' })
    useContent.getState().edit('faq', FAQ('Typed just before Publish'))
    await vi.advanceTimersByTimeAsync(800)
    expect(mocked.adminSaveDraft).toHaveBeenCalledTimes(1)

    const publishing = useContent.getState().publish(['faq'])
    await vi.advanceTimersByTimeAsync(0)
    expect(mocked.adminPublish).not.toHaveBeenCalled()
    release()
    await publishing
    expect(mocked.adminPublish).toHaveBeenCalledTimes(1)
    expect(mocked.adminSaveDraft).toHaveBeenCalledTimes(1)
  })

  it('a newer edit is saved after the save on its way, never beside it', async () => {
    const release = holdNextSave()
    useContent.getState().edit('faq', FAQ('One'))
    await vi.advanceTimersByTimeAsync(800)
    useContent.getState().edit('faq', FAQ('Two'))
    await vi.advanceTimersByTimeAsync(800)
    expect(mocked.adminSaveDraft).toHaveBeenCalledTimes(1)

    release()
    await vi.waitFor(() => expect(mocked.adminSaveDraft).toHaveBeenCalledTimes(2))
    expect(mocked.adminSaveDraft.mock.calls[1][1]).toEqual(FAQ('Two'))
    await vi.waitFor(() => expect(useContent.getState().docs.faq?.save).toBe('saved'))
  })

  it('an edit typed while the draft is being dropped is still saved', async () => {
    const { edit } = useContent.getState()
    edit('faq', FAQ('Changed'))
    await vi.advanceTimersByTimeAsync(800)
    let release!: () => void
    mocked.adminDiscardDraft.mockImplementationOnce(
      () => new Promise((resolve) => {
        release = () => resolve({ ok: true })
      }),
    )
    edit('faq', FAQ())
    await vi.advanceTimersByTimeAsync(800)
    expect(mocked.adminDiscardDraft).toHaveBeenCalledTimes(1)

    edit('faq', FAQ('Changed again'))
    release()
    await vi.advanceTimersByTimeAsync(800)
    await vi.waitFor(() => expect(mocked.adminSaveDraft).toHaveBeenCalledTimes(2))
    expect(mocked.adminSaveDraft.mock.calls[1][1]).toEqual(FAQ('Changed again'))
  })

  it('a discard waits for an autosave already on its way', async () => {
    const release = holdNextSave()
    useContent.getState().edit('faq', FAQ('About to be thrown away'))
    await vi.advanceTimersByTimeAsync(800)

    const discarding = useContent.getState().discard('faq')
    await vi.advanceTimersByTimeAsync(0)
    expect(mocked.adminDiscardDraft).not.toHaveBeenCalled()
    release()
    await discarding
    expect(mocked.adminDiscardDraft).toHaveBeenCalledWith('faq')
    expect(useContent.getState().docs.faq?.working).toEqual(FAQ())
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
    mocked.adminPublish.mockResolvedValue({ commit: 'commit-1', shas: { faq: 'sha-faq-2' } })
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
    mocked.adminPublish.mockResolvedValue({ commit: 'commit-2', shas: { faq: 'sha-faq-2' } })
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
    mocked.adminPublish.mockResolvedValue({ commit: 'commit-3', shas: { faq: 'sha-faq-2' } })
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
