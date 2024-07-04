import React, { Context, ReactNode, createContext, useEffect, useContext, useReducer, Dispatch } from 'react'

import { ISendToGTM, ISnippetsParams } from './models/GoogleTagManager'
import { initGTM, sendToGTM } from './utils/GoogleTagManager'

declare global {
  interface Window {
    dataLayer: Object | undefined
    [key: string]: any
  }
}

/**
 * The shape of the context provider
 */
type GTMHookProviderProps = { state?: ISnippetsParams; children: ReactNode }

/**
 * The shape of the hook
 */
export type IUseGTM = {
  UseGTMHookProvider: ({ children }: GTMHookProviderProps) => JSX.Element
  GTMContext: Context<ISnippetsParams | undefined>
}

/**
 * The initial state
 */
export const initialState: ISnippetsParams = {
  dataLayer: undefined,
  dataLayerName: 'dataLayer',
  environment: undefined,
  nonce: undefined,
  id: '',
  injectScript: true
}

/**
 * The context
 */
export const GTMContext = createContext<ISnippetsParams[] | undefined>(undefined)
export const GTMContextDispatch = createContext<
  Dispatch<{ type: string; state?: ISnippetsParams; data?: ISendToGTM['data'] }> | undefined
>(undefined)

function dataReducer(
  state: ISnippetsParams[],
  action: { type: string; state?: ISnippetsParams; data?: ISendToGTM['data'] }
) {
  switch (action.type) {
    case 'ADD_STATE':
      return [...state, action.state!]
    case 'SEND_TO_GTM':
      state.forEach((s) => sendToGTM({ data: action.data!, dataLayerName: s.dataLayerName! }))
      return state
    default:
      return state
  }
}

/**
 * The Google Tag Manager Provider
 */
function GTMProvider({ state, children }: GTMHookProviderProps): JSX.Element {
  const [store, dispatch] = useReducer(dataReducer, [])

  useEffect(() => {
    if (!state || state.injectScript == false) return
    const mergedState = { ...initialState, ...state }

    initGTM(mergedState)
    dispatch({ type: 'ADD_STATE', state: mergedState })
  }, [JSON.stringify(state)])

  return (
    <GTMContext.Provider value={store}>
      <GTMContextDispatch.Provider value={dispatch}>{children}</GTMContextDispatch.Provider>
    </GTMContext.Provider>
  )
}

function useGTMDispatch() {
  const context = useContext(GTMContextDispatch)
  if (context === undefined) {
    throw new Error('dispatchGTMEvent must be used within a GTMProvider')
  }

  return (data: ISendToGTM['data']) => {
    context({ type: 'SEND_TO_GTM', data: data })
  }
}

export { GTMProvider, useGTMDispatch, sendToGTM }
