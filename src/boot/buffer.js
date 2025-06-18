import { boot } from 'quasar/wrappers'
import { Buffer } from 'buffer'

export default boot(() => {
  if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer
  }
})
