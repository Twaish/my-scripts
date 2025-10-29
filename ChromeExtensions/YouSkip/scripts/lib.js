class Subject {
  observers = {}
  on(eventName, callback) {
    this.observers[eventName] ??= []
    this.observers[eventName].push(callback)
  }
  off(eventName, callback) {
    if (!this.observers[eventName]) return
    const index = this.observers[eventName].indexOf(callback)
    this.observers[eventName].splice(index, 1)
  }
  emit(eventName, ...args) {
    this.observers[eventName]?.forEach((callback) => callback(...args))
  }
}
class HotkeyManager {
  constructor() {
    this.hotkeys = {}
    window.addEventListener('keydown', this.handleKeydown)
  }
  handleKeydown = (e) => {
    const keys = []
    if (e.ctrlKey) keys.push('ctrl')
    if (e.shiftKey) keys.push('shift')
    if (e.altKey) keys.push('alt')
    keys.push(e.key.toLowerCase())
    const hotkey = keys.sort().join('+')
    const entry = this.hotkeys[hotkey]
    if (!entry) return

    const { callback, options } = entry
    if (e.repeat && !options.repeatable) return

    e.preventDefault()
    callback(e)
  }
  addHotkey(hotkey, callback, options = { repeatable: false }) {
    const keys = hotkey
      .toLowerCase()
      .split('+')
      .map((k) => k.trim())
      .sort()
      .join('+')
    if (this.hotkeys[keys]) {
      throw new Error(`Hotkey ${hotkey} already exists`)
    }
    this.hotkeys[keys] = { callback, options }
  }
}
class SkipManager extends Subject {
  constructor(skipProfiles = {}) {
    super()
    this.skipProfiles = skipProfiles
    this.buttonObserver = null
    this.attachProfileHotkeys()
  }
  attachProfileHotkeys(hotkeyManager) {
    if (!hotkeyManager) return
    for (const profileName in this.skipProfiles) {
      const profile = this.skipProfiles[profileName]
      if (!profile.hotkey) continue

      hotkeyManager.addHotkey(profile.hotkey, () => this.skip(profileName), { ...profile })
      this.emit('attachHotkey', profile)
    }
  }
  get video() {
    return document.querySelector('.video-stream.html5-main-video')
  }
  get skipButton() {
    return document.querySelector('.ytp-ad-skip-button-modern.ytp-button')
  }
  get countdownButton() {
    return document.querySelector('.ytp-ad-preview-container.ytp-ad-preview-container-detached')
  }
  skipVideo(timeToSkip = 0) {
    const { video } = this
    if (video) {
      video.currentTime += timeToSkip
    }
  }
  setVideoDuration(duration = 0) {
    const { video } = this
    if (video) {
      video.currentTime = duration
    }
  }
  clickSkipButton(profile) {
    const { skipButton } = this
    if (skipButton) {
      skipButton.click()
      this.observeSkipButton()
      return
    }

    if (this.countdownButton) {
      this.skipVideo(profile.duration)
      return
    }

    this.disconnectObserver()
  }
  observeSkipButton() {
    if (this.buttonObserver) return
    this.buttonObserver = new MutationObserver(() => this.clickSkipButton())
    this.buttonObserver.observe(document.body, {
      subtree: true,
      attributes: true,
    })
  }
  disconnectObserver() {
    this.buttonObserver?.disconnect()
    this.buttonObserver = null
  }
  skip(profileName) {
    const profile = this.skipProfiles[profileName]
    if (!profile) throw new Error(`Skip profile ${profileName} not found`)
    this.emit('skip', profile)
    if (profile.duration) {
      this.setVideoDuration(profile.duration)
    }
    if (profile.timeToSkip) {
      this.skipVideo(profile.timeToSkip)
    }
    this.clickSkipButton()
  }
}
class LogManager extends Subject {
  queue = []
  setContainer(container) {
    this.logsContainer = container
    this.queue.forEach((msg) => {
      this.log(...msg)
    })
    this.queue = []
  }

  log(message, { lifetime = 2000, animationTime = 150 } = {}) {
    const log = html('log.in', [message])
    const options = { lifetime, animationTime }
    this.emit('log', message, options)

    if (!this.logsContainer) {
      this.queue.push([message, options])
      return
    }

    this.logsContainer.prepend(log)

    setTimeout(() => {
      log.classList.add('out')
      this.emit('logExpire', message, options)

      setTimeout(() => {
        this.logsContainer.removeChild(log)
      }, animationTime)
    }, lifetime)
  }
}
class Store {
  async loadSettings(namespace, instance) {
    const data = await chrome.storage.local.get(namespace)
    if (data && typeof data === 'object') {
      Object.assign(instance, data)
    }
  }
  async set(namespace, property, value) {
    const data = (await chrome.storage.local.get(namespace)) ?? {}
    data[property] = value
    await chrome.storage.local.set({ [namespace]: data })
  }
}
class AudioManager extends Subject {
  constructor(soundProfiles, masterVolume = 1.0) {
    super()
    this.soundProfiles = soundProfiles
    this.masterVolume = masterVolume
  }
  play(sound, options = {}) {
    const { volume = 0.5 } = options
    const soundPath = this.soundProfiles[sound]
    if (!soundPath) return

    const audio = new Audio(soundPath)
    audio.volume = this.masterVolume * volume
    audio.play().catch(console.warn)
  }
  setMasterVolume(volume) {
    const clamped = Math.min(Math.max(volume, 0), 1)
    const rounded = Math.round(clamped * 10) / 10
    if (this.masterVolume === rounded) return

    this.masterVolume = rounded
    this.emit('masterVolumeChanged', rounded)
  }
}
