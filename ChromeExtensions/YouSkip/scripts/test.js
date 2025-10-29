window.chrome.runtime ??= { getURL: (path) => path }
window.chrome.storage ??= {
  local: {
    set: async (obj) => {
      for (const key in obj) {
        const value = obj[key]
        localStorage.setItem(key, JSON.stringify({ value, type: typeof value }))
      }
    },
    get: async (key) => {
      const entry = JSON.parse(localStorage.getItem(key))
      if (entry?.type === 'number') {
        const value = parseFloat(entry.value)
        return isNaN(value) ? 0 : value
      }
      return { [key]: entry?.value }
    },
  },
}
