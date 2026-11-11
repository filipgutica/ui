import { tryOnScopeDispose, useTimeoutFn } from '@vueuse/core'
import { readonly, ref } from 'vue'
import type { Ref } from 'vue'

export interface ClipboardCopyOptions {
  /** Shown when the browser has no clipboard API. */
  unavailableMessage: string
  /** Shown when the browser rejects the write. */
  failureMessage: string
}

export interface ClipboardCopy {
  /** True for 1.5s after the last successful copy settles; a failure clears it at once. */
  copied: Readonly<Ref<boolean>>
  /** True while any copy is in flight. */
  pending: Readonly<Ref<boolean>>
  /** The last failure message, cleared when a new copy starts. */
  error: Readonly<Ref<string>>
  copy: (text: string) => Promise<void>
}

/** Copies text to the clipboard and reports the outcome for a live status message. */
export const useClipboardCopy = ({ unavailableMessage, failureMessage }: ClipboardCopyOptions): ClipboardCopy => {
  const copied = ref(false)
  const pending = ref(false)
  const error = ref('')
  // One timer per instance; VueUse stops it when the owning component unmounts.
  const { start: holdCopied, stop: stopHolding } = useTimeoutFn(() => { copied.value = false }, 1500, { immediate: false })
  const fail = (message: string): void => {
    copied.value = false
    stopHolding()
    error.value = message
  }
  let inFlight = 0
  let active = true
  tryOnScopeDispose(() => { active = false })

  const copy = async (text: string): Promise<void> => {
    error.value = ''
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      fail(unavailableMessage)
      return
    }
    inFlight += 1
    pending.value = true
    let ok = true
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      ok = false
    }
    // A copy that settles after its owner unmounts changes nothing and starts no timer.
    if (!active) return
    inFlight -= 1
    pending.value = inFlight > 0
    if (!ok) {
      fail(failureMessage)
      return
    }
    // A repeat or overlapping copy keeps the tick, and restarts its 1.5s once this copy settles.
    copied.value = true
    holdCopied()
  }

  return { copied: readonly(copied), pending: readonly(pending), error: readonly(error), copy }
}
