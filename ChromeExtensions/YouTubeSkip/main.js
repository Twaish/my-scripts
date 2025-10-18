const skipProfiles = {
  full: { duration: 9e5, hotkey: 'ctrl+shift+alt+s' }, // ~10.42 days
  '5s': { timeToSkip: 5, hotkey: 'ctrl+shift+s' },
}
const hotkeyManager = new HotkeyManager()
const skipManager = new SkipManager({ hotkeyManager, skipProfiles })

const Button = ({ text = '', icon = '', ...args }) => {
  return html('button', {
    ...args,
    html: icon + text,
  })
}

const Container = ({ skipManager }) => {
  const container = html('.ytskip-container', [
    Button({
      text: 'FULL',
      icon: icons.SKIP,
      title: `Skip full video (${skipProfiles['full'].hotkey})`,
      onclick: () => skipManager.skip('full'),
    }),
    Button({
      text: '5s',
      icon: icons.TIMER,
      title: `Skip 5 seconds (${skipProfiles['5s'].hotkey})`,
      onclick: () => skipManager.skip('5s'),
    }),
  ])
  const offset = 250

  document.body.onmousemove = (e) => {
    const isWithinOffset = e.clientY > window.screen.height - offset
    container.classList.toggle('visible', isWithinOffset)
  }

  return container
}
document.body.append(Container({ skipManager }))
