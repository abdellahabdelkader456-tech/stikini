import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useStore } from '../lib/store'

export function Toaster() {
  const { toasts, dismissToast } = useStore()

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-[92%] max-w-md pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon =
            toast.type === 'success'
              ? CheckCircle2
              : toast.type === 'error'
                ? XCircle
                : Info
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -22, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.95 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl"
              style={{
                background:
                  toast.type === 'success'
                    ? 'linear-gradient(135deg, rgba(0,187,127,0.16), rgba(11,23,19,0.96))'
                    : toast.type === 'error'
                      ? 'linear-gradient(135deg, rgba(239,68,68,0.16), rgba(11,23,19,0.96))'
                      : 'linear-gradient(135deg, rgba(212,175,55,0.16), rgba(11,23,19,0.96))',
                borderColor:
                  toast.type === 'success'
                    ? 'rgba(0,187,127,0.35)'
                    : toast.type === 'error'
                      ? 'rgba(239,68,68,0.35)'
                      : 'rgba(212,175,55,0.35)',
              }}
            >
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background:
                    toast.type === 'success'
                      ? 'rgba(0,187,127,0.22)'
                      : toast.type === 'error'
                        ? 'rgba(239,68,68,0.22)'
                        : 'rgba(212,175,55,0.22)',
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{
                    color:
                      toast.type === 'success'
                        ? '#34d9a4'
                        : toast.type === 'error'
                          ? '#f87171'
                          : '#f5d77f',
                  }}
                />
              </span>
              <p className="flex-1 text-cream text-[14px] font-semibold leading-relaxed">
                {toast.message}
              </p>
              <button
                onClick={() => dismissToast(toast.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-cream/45 hover:text-cream hover:bg-white/8 transition-all shrink-0"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
