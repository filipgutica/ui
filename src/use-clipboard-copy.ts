import { useTimeoutFn } from '@vueuse/core'
import { readonly, ref } from 'vue'
import type { Ref } from 'vue'

export interface ClipboardCopyOptions {
  /** Shown when the browser has no clipboard API. */
  unavailableMessage: string
  /** Shown when the browser rejects the write. */
  failureMessage: string
}

export interface ClipboardCopy {
  /** True for a short time after a successful copy. */
  copied: Readonly<Ref<boolean>>
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
  const { start: resetCopied } = useTimeoutFn(() => { copied.value = false }, 1500, { immediate: false })

  const copy = async (text: string): Promise<void> => {
    error.value = ''
    copied.value = false
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      error.value = unavailableMessage
      return
    }
    pending.value = true
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      resetCopied()
    } catch {
      error.value = failureMessage
    } finally {
      pending.value = false
    }
  }

  return { copied: readonly(copied), pending: readonly(pending), error: readonly(error), copy }
}
