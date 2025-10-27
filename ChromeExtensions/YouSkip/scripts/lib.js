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
  constructor({ hotkeyManager, skipProfiles = {} }) {
    this.hotkeyManager = hotkeyManager
    this.skipProfiles = skipProfiles
    this.buttonObserver = null
    this.observers = {}
    this.attachProfileHotkeys()
  }
  attachProfileHotkeys() {
    if (!this.hotkeyManager) return
    for (const profileName in this.skipProfiles) {
      const profile = this.skipProfiles[profileName]
      if (!profile.hotkey) continue

      this.hotkeyManager.addHotkey(profile.hotkey, () => this.skip(profileName))
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

class DragManager {
  constructor() {
    this.dragged = false
    this.offset = { x: 0, y: 0 }
    this.rect = {}
    this.borderMargin = 20

    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('mouseup', this.onMouseUp)
  }

  attach(gripElement, containerElement) {
    if (!gripElement || !containerElement) {
      throw new Error('Missing grip or container element to attach')
    }

    gripElement.addEventListener('mousedown', (e) => {
      e.preventDefault()
      this.dragged = containerElement

      const rect = containerElement.getBoundingClientRect()
      this.rect = rect
      this.offset.x = e.clientX - rect.left
      this.offset.y = e.clientY - rect.top
    })

    const rect = this.getRenderedRect(containerElement)
    const position = this.ensurePositionWithinWindow(rect)
    this.setPosition(containerElement, position)
  }

  getRenderedRect(element) {
    const clone = element.cloneNode(true)
    document.body.append(clone)
    const rect = clone.getBoundingClientRect()
    clone.remove()
    return rect
  }

  setPosition(element, { x, y }) {
    Object.assign(element.style, {
      left: `${x}px`,
      top: `${y}px`,
      transition: 'none',
    })
  }

  ensurePositionWithinWindow({ x, y, width, height }) {
    const maxLeft = window.innerWidth - width - this.borderMargin
    const maxTop = window.innerHeight - height - this.borderMargin

    x = x < this.borderMargin ? this.borderMargin : x > maxLeft ? maxLeft : x
    y = y < this.borderMargin ? this.borderMargin : y > maxTop ? maxTop : y

    return { x, y }
  }

  onMouseMove = (e) => {
    if (!this.dragged) return
    e.preventDefault()

    const position = this.ensurePositionWithinWindow({
      x: e.clientX - this.offset.x,
      y: e.clientY - this.offset.y,
      width: this.rect.width,
      height: this.rect.height,
    })
    this.setPosition(this.dragged, position)
  }

  onMouseUp = () => {
    if (this.dragged) {
      this.dragged.style.removeProperty('transition')
    }
    this.dragged = null
  }
}

class LogManager {
  queue = []
  setContainer(container) {
    this.logsContainer = container
    this.queue.forEach((msg) => {
      this.log(...msg)
      console.log('LOGGING', msg)
    })
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
