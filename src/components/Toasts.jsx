import { useToast } from '../context/ToastContext.jsx'


export default function Toasts() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="toasts">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.kind}`}>
          {toast.kind === 'success' ? '✅' : '⚠️'} {toast.message}
        </div>
      ))}
    </div>
  )
}
