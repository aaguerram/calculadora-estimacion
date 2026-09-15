import { DEFAULT_GREETING, type Greeting, type GreetingLanguage } from '@/entities/greeting'

/** Modelo (M de MVI): todo el estado del feature en un solo objeto inmutable. */
export interface GreetVisitorState {
  draftRecipient: string
  greeting: Greeting
  hasBeenSubmitted: boolean
}

/** Intents (I de MVI): las unicas transiciones permitidas. */
export type GreetVisitorIntent =
  | { type: 'recipientChanged'; recipient: string }
  | { type: 'languageChanged'; language: GreetingLanguage }
  | { type: 'submitted' }
  | { type: 'reset' }

export const initialGreetVisitorState: GreetVisitorState = {
  draftRecipient: '',
  greeting: DEFAULT_GREETING,
  hasBeenSubmitted: false,
}

/**
 * Reducer puro. No importa React ni toca el DOM,
 * por eso se puede testear como una funcion cualquiera.
 */
export function greetVisitorReducer(
  state: GreetVisitorState,
  intent: GreetVisitorIntent,
): GreetVisitorState {
  switch (intent.type) {
    case 'recipientChanged':
      return { ...state, draftRecipient: intent.recipient }

    case 'languageChanged':
      return {
        ...state,
        greeting: { ...state.greeting, language: intent.language },
      }

    case 'submitted':
      return {
        ...state,
        greeting: {
          ...state.greeting,
          recipient: state.draftRecipient.trim() || DEFAULT_GREETING.recipient,
        },
        hasBeenSubmitted: true,
      }

    case 'reset':
      return initialGreetVisitorState

    default:
      return state
  }
}
