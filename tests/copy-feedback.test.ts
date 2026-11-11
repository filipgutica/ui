import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'

import { UiCodeBlock } from '../src/index.js'
import { UiCommandList } from '../src/site/index.js'
import { useClipboardCopy } from '../src/use-clipboard-copy.js'

// After a successful copy the copy icon is a plain tick for 1.5s. A repeat or overlapping copy
// restarts the wait once it settles, and a failure keeps the copy icon. This follows the catalogue's
// showCopied script in @filipgutica/design-system's components.html.
const tick = 'M3.5 8.5l3 3 6-7'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const withCopy = () => {
  const scope = effectScope()
  const state = scope.run(() => useClipboardCopy({ unavailableMessage: 'unavailable', failureMessage: 'failed' }))
  if (!state) throw new Error('useClipboardCopy did not run')
  return { scope, ...state }
}

describe('useClipboardCopy', () => {
  it('holds copied for 1.5s, and a repeat copy keeps the tick and restarts the wait once it settles', async () => {
    let settleRepeat = (): void => {}
    vi.spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValueOnce()
      .mockImplementationOnce(() => new Promise<void>((resolve) => { settleRepeat = resolve }))
    const { scope, copied, copy } = withCopy()
    await copy('a')
    expect(copied.value).toBe(true)
    vi.advanceTimersByTime(1000)
    const repeat = copy('a')
    // The tick stays while the repeat copy is in flight.
    expect(copied.value).toBe(true)
    settleRepeat()
    await repeat
    vi.advanceTimersByTime(1000)
    // 2s after the first copy: the first wait did not end the second.
    expect(copied.value).toBe(true)
    vi.advanceTimersByTime(500)
    expect(copied.value).toBe(false)
    scope.stop()
  })

  it('stays copied and pending through overlapping copies until 1.5s after the last one settles', async () => {
    const writes: (() => void)[] = []
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(() => new Promise<void>((resolve) => { writes.push(resolve) }))
    const { scope, copied, pending, copy } = withCopy()
    const first = copy('a')
    const second = copy('b')
    vi.advanceTimersByTime(1000)
    writes[0]?.()
    await first
    expect(copied.value).toBe(true)
    // The second copy is still in flight.
    expect(pending.value).toBe(true)
    vi.advanceTimersByTime(1000)
    writes[1]?.()
    await second
    expect(pending.value).toBe(false)
    vi.advanceTimersByTime(600)
    // The first copy's wait would have ended at 2.5s.
    expect(copied.value).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(copied.value).toBe(false)
    scope.stop()
  })

  it('clears copied at once when a copy fails during a tick', async () => {
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const { scope, copied, error, copy } = withCopy()
    await copy('a')
    write.mockRejectedValueOnce(new Error('denied'))
    await copy('a')
    expect(copied.value).toBe(false)
    expect(error.value).toBe('failed')
    // The wait is stopped, so nothing is left to fire.
    expect(vi.getTimerCount()).toBe(0)
    scope.stop()
  })

  it('stops its wait when its owner unmounts', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const { scope, copy } = withCopy()
    await copy('a')
    expect(vi.getTimerCount()).toBe(1)
    scope.stop()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('changes nothing and starts no wait when a copy settles after its owner unmounts', async () => {
    const writes: (() => void)[] = []
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(() => new Promise<void>((resolve) => { writes.push(resolve) }))
    const { scope, copied, pending, error, copy } = withCopy()
    const settling = copy('a')
    expect(pending.value).toBe(true)
    scope.stop()
    writes[0]?.()
    await settling
    expect(vi.getTimerCount()).toBe(0)
    expect([copied.value, pending.value, error.value]).toEqual([false, true, ''])
  })
})

describe('UiCodeBlock copy feedback', () => {
  it('shows a tick for 1.5s, keeps the label and name, and announces success without showing it', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const wrapper = mount(UiCodeBlock, { props: { code: 'pnpm add @filipgutica/ui', title: 'Install' } })
    const copy = wrapper.get('.fg-code-block__copy')
    expect(copy.attributes('data-copied')).toBeUndefined()
    // The copy icon and the tick share one box and stroke, so the line weight holds at the swap.
    const stroke = () => {
      const { viewBox, 'stroke-width': width, 'stroke-linecap': cap, 'stroke-linejoin': join } = copy.get('svg').attributes()
      return { viewBox, width, cap, join }
    }
    const atRest = stroke()
    expect(atRest).toEqual({ viewBox: '0 0 16 16', width: '1.5', cap: 'round', join: 'round' })
    await copy.trigger('click')
    await flushPromises()
    expect(copy.get('path').attributes('d')).toBe(tick)
    expect(stroke()).toEqual(atRest)
    expect(copy.attributes('data-copied')).toBe('')
    expect(copy.text()).toBe('Copy')
    expect(copy.attributes('aria-label')).toBe('Copy code')
    const status = wrapper.get('[role="status"]')
    expect(status.text()).toBe('Code copied to clipboard.')
    expect(status.attributes('data-state')).toBe('success')
    vi.advanceTimersByTime(1500)
    await nextTick()
    expect(copy.find('rect').exists()).toBe(true)
    expect(copy.attributes('data-copied')).toBeUndefined()
    wrapper.unmount()
  })

  it('puts the copy icon back and shows the failure when a copy fails during a tick', async () => {
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const wrapper = mount(UiCodeBlock, { props: { code: 'example' } })
    const copy = wrapper.get('.fg-code-block__copy')
    await copy.trigger('click')
    await flushPromises()
    expect(copy.get('path').attributes('d')).toBe(tick)
    write.mockRejectedValueOnce(new Error('denied'))
    await copy.trigger('click')
    await flushPromises()
    expect(copy.find('rect').exists()).toBe(true)
    expect(copy.attributes('data-copied')).toBeUndefined()
    expect(wrapper.get('[role="status"]').text()).toBe('Could not copy. Select the code to copy it.')
    expect(wrapper.get('[role="status"]').attributes('data-state')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('UiCommandList copy feedback', () => {
  it('gives each row its own tick and wait', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const wrapper = mount(UiCommandList, { props: { items: [{ command: 'wtree ui' }, { command: 'wtree clean' }] } })
    await flushPromises()
    const ticks = () => wrapper.findAll('.fg-command-list__copy').map(button => button.attributes('data-copied') === '')
    await wrapper.get('[aria-label="Copy wtree ui"]').trigger('click')
    await flushPromises()
    vi.advanceTimersByTime(1000)
    await wrapper.get('[aria-label="Copy wtree clean"]').trigger('click')
    await flushPromises()
    // A second row's copy does not end the first row's tick.
    expect(ticks()).toEqual([true, true])
    vi.advanceTimersByTime(600)
    await nextTick()
    expect(ticks()).toEqual([false, true])
    expect(wrapper.get('[role="status"]').text()).toBe('wtree clean copied to clipboard.')
    wrapper.unmount()
  })
})
