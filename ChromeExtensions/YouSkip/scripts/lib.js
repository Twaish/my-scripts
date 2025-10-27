class HotkeyManager {
  constructor() {
    this.hotkeys = {}
    window.addEventListener('keydown', this.handleKeydown)
  }
  handleKeydown = (e) => {
    if (e.repeat) return
    const keys = []
    if (e.ctrlKey) keys.push('ctrl')
    if (e.shiftKey) keys.push('shift')
    if (e.altKey) keys.push('alt')
    keys.push(e.key.toLowerCase())
    const hotkey = keys.sort().join('+')
    const callback = this.hotkeys[hotkey]
    if (callback) {
      e.preventDefault()
      callback(e)
    }
  }
  addHotkey(hotkey, callback) {
    const keys = hotkey
      .toLowerCase()
      .split('+')
      .map((k) => k.trim())
      .sort()
      .join('+')
    if (this.hotkeys[keys]) {
      throw new Error(`Hotkey ${hotkey} already exists`)
    }
    this.hotkeys[keys] = callback
  }
}
class SkipManager {
  constructor({ skipProfiles = {} }) {
    this.skipProfiles = skipProfiles
    this.buttonObserver = null
    this.observers = {}
    this.attachProfileHotkeys()
  }
  attachProfileHotkeys(hotkeyManager) {
    if (!hotkeyManager) return
    for (const profileName in this.skipProfiles) {
      const profile = this.skipProfiles[profileName]
      if (!profile.hotkey) continue

      hotkeyManager.addHotkey(profile.hotkey, () => this.skip(profileName))
      this.emit('attachHotkey', profile)
    }
  }
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
class LogManager {
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

    if (!this.logsContainer) {
      this.queue.push([message, { lifetime, animationTime }])
      return
    }

    this.logsContainer.prepend(log)

    setTimeout(() => {
      log.classList.add('out')
      setTimeout(() => {
        this.logsContainer.removeChild(log)
      }, animationTime)
    }, lifetime)
  }
}
