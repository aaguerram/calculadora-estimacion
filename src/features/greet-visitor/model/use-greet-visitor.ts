import { useReducer } from 'react'

import {
  greetVisitorReducer,
  initialGreetVisitorState,
  type GreetVisitorIntent,
  type GreetVisitorState,
} from './greet-visitor.reducer'

interface UseGreetVisitorResult {
  state: GreetVisitorState
  dispatch: (intent: GreetVisitorIntent) => void
}

/** Puente entre el modelo puro y React. Aqui vive el unico `useReducer` del feature. */
export function useGreetVisitor(): UseGreetVisitorResult {
  const [state, dispatch] = useReducer(greetVisitorReducer, initialGreetVisitorState)
  return { state, dispatch }
}
