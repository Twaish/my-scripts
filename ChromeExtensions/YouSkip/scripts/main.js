const skipProfiles = {
  full: {
    duration: 9e5, // ~10.42 days
    hotkey: 'ctrl+shift+alt+s',
    get description() {
      return `Skip full video (${this.hotkey})`
    },
    get actionText() {
      return `Skipped full video`
    },
  },
  '5s': {
    timeToSkip: 5,
    hotkey: 'ctrl+shift+s',
    get description() {
      return `Skip 5 seconds (${this.hotkey})`
    },
    get actionText() {
      return `Skipped 5 seconds`
    },
  },
}
window.chrome.runtime ??= { getURL: (path) => path } // For testing
const soundProfiles = {
  pop: chrome.runtime.getURL('assets/pop.mp3'),
  whoosh: chrome.runtime.getURL('assets/whoosh.mp3'),
}

const hotkeyManager = new HotkeyManager()
const audioManager = new AudioManager(soundProfiles)
const skipManager = new SkipManager(skipProfiles)
const logManager = new LogManager()

logManager.on('log', () => {
  audioManager.play('pop')
})
logManager.on('logExpire', () => {
  audioManager.play('whoosh')
})
skipManager.on('attachHotkey', (profile) => {
  logManager.log(profile.description, { lifetime: 4000 })
})
skipManager.on('skip', (profile) => {
  logManager.log(profile.actionText)
})
skipManager.attachProfileHotkeys(hotkeyManager)
audioManager.on('masterVolumeChanged', (volume) => {
  logManager.log(`Master Volume: ${volume * 100}%`)
})

hotkeyManager.addHotkey(
  'ctrl+shift+arrowup',
  () => {
    audioManager.setMasterVolume(audioManager.masterVolume + 0.1)
  },
  { repeatable: true },
)
hotkeyManager.addHotkey(
  'ctrl+shift+arrowdown',
  () => {
    audioManager.setMasterVolume(audioManager.masterVolume - 0.1)
  },
  { repeatable: true },
)

const LogsContainer = ({ hotkeyManager, logManager }) => {
  const logsContainer = html('.ytskip-logs')

  function randomString(minLength = 5, maxLength = 25) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  hotkeyManager.addHotkey(
    'ctrl+shift+c',
    () => {
      logManager.log(randomString(10, 50))
    },
    { repeatable: true },
  )
  return logsContainer
}

const logsContainer = LogsContainer({ hotkeyManager, logManager })
document.body.append(logsContainer)
logManager.setContainer(logsContainer)
