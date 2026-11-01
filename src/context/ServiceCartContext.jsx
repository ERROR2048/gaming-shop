import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'service-store-cart'

function readInitialCart() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find((item) => item.service.id === action.service.id)
      if (existing) {
        return state.map((item) => item.service.id === action.service.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...state, { service: action.service, quantity: 1 }]
    }
    case 'REMOVE':
      return state.filter((item) => item.service.id !== action.id)
    case 'CHANGE':
      return state.map((item) => item.service.id === action.id
        ? { ...item, quantity: Math.max(1, Math.min(30, item.quantity + action.delta)) }
        : item)
    case 'CLEAR':
      return []
    case 'RESTORE':
      return action.items
    default:
      return state
  }
}

export function ServiceCartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, readInitialCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.service.final_price * item.quantity, 0)
  const value = useMemo(() => ({
    items,
    totalCount,
    subtotal,
    add: (service) => dispatch({ type: 'ADD', service }),
    remove: (id) => dispatch({ type: 'REMOVE', id }),
    change: (id, delta) => dispatch({ type: 'CHANGE', id, delta }),
    clear: () => dispatch({ type: 'CLEAR' }),
    restore: (nextItems) => dispatch({ type: 'RESTORE', items: nextItems }),
  }), [items, totalCount, subtotal])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart должен использоваться внутри CartProvider')
  return value
}
