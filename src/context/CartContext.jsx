import { createContext, useContext, useEffect, useReducer } from 'react'















const CartContext = createContext(null)



function init(initialItems) {
  try {
    const saved = JSON.parse(localStorage.getItem('gamedeck-cart'))
    return { items: Array.isArray(saved) ? saved : initialItems }
  } catch {
    return { items: initialItems }
  }
}





function cartReducer(state, action) {
  switch (action.type) {
    
    case 'ADD_ITEM': {
      const product = action.payload
      const exists = state.items.find((item) => item.id === product.id)

      if (exists) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
          ),
        }
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            qty: 1,
          },
        ],
      }
    }

    
    case 'DECREASE_ITEM': {
      const next = state.items
        .map((item) => (item.id === action.payload ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)

      return { ...state, items: next }
    }

    
    case 'INCREASE_ITEM': {
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload ? { ...item, qty: item.qty + 1 } : item,
        ),
      }
    }

    
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((item) => item.id !== action.payload) }

    
    case 'CLEAR_CART':
      return { ...state, items: [] }

    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, [], init)

  
  useEffect(() => {
    localStorage.setItem('gamedeck-cart', JSON.stringify(state.items))
  }, [state.items])

  
  const totalCount = state.items.reduce((sum, item) => sum + item.qty, 0)
  const totalSum = state.items.reduce((sum, item) => sum + item.price * item.qty, 0)

  
  const value = {
    items: state.items,
    totalCount,
    totalSum,
    addItem: (product) => dispatch({ type: 'ADD_ITEM', payload: product }),
    removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
    increaseItem: (id) => dispatch({ type: 'INCREASE_ITEM', payload: id }),
    decreaseItem: (id) => dispatch({ type: 'DECREASE_ITEM', payload: id }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}


export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart() нужно вызывать внутри <CartProvider>')
  }
  return context
}
