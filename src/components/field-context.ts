import type { ComputedRef, InjectionKey } from 'vue'

export interface UiFieldContext {
  controlId: ComputedRef<string>
  descriptionId: ComputedRef<string | undefined>
  errorId: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
}

export const uiFieldContextKey: InjectionKey<UiFieldContext> = Symbol('UiFieldContext')
