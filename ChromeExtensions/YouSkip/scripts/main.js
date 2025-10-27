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
const logManager = new LogManager()
const hotkeyManager = new HotkeyManager()
const skipManager = new SkipManager({ hotkeyManager, skipProfiles })
skipManager.on('skip', (profile) => {
  logManager.log(profile.actionText)
})

// const dragManager = new DragManager()

// const Button = ({ text = '', icon = '', ...args }) => {
//   return html('button', {
//     ...args,
//     html: icon + text,
//   })
// }

// const Container = ({ skipManager, dragManager }) => {
//   const grip = html('.grip', {
//     html: icons.GRIP,
//   })
//   const container = html('.ytskip-container', [
//     grip,
//     Button({
//       text: 'FULL',
//       icon: icons.SKIP,
//       title: `Skip full video (${skipProfiles['full'].hotkey})`,
//       onclick: () => skipManager.skip('full'),
//     }),
//     Button({
//       text: '5s',
//       icon: icons.TIMER,
//       title: `Skip 5 seconds (${skipProfiles['5s'].hotkey})`,
//       onclick: () => skipManager.skip('5s'),
//     }),
//   ])

//   dragManager.attach(grip, container)

//   const offset = 250

//   document.body.onmousemove = (e) => {
//     const isWithinOffset = e.clientY > window.screen.height - offset
//     container.classList.toggle('visible', isWithinOffset)
//   }

//   return container
// }
// document.body.append(Container({ skipManager, dragManager }))

const LogsContainer = ({ hotkeyManager, logManager, skipProfiles }) => {
  const logsContainer = html('.ytskip-logs')

  const log = (message, { lifetime = 2000, animationTime = 150 } = {}) => {
    const log = html('log.in', [message])
    logsContainer.prepend(log)

    setTimeout(() => {
      log.classList.add('out')
      setTimeout(() => {
        logsContainer.removeChild(log)
      }, animationTime)
    }, lifetime)
  }

  for (const profile of Object.values(skipProfiles)) {
    logManager.log(profile.description, { lifetime: 4000 })
  }

  function randomString(minLength = 5, maxLength = 25) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  hotkeyManager.addHotkey('ctrl+shift+c', () => {
    log(randomString(10, 50))
  })
  return logsContainer
}

const logsContainer = LogsContainer({ hotkeyManager, logManager, skipProfiles })
document.body.append(logsContainer)

logManager.setContainer(logsContainer)
