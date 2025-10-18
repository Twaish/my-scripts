
const icons = {
	skip: `<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M112 111v290c0 17.44 17 28.52 31 20.16l247.9-148.37c12.12-7.25 12.12-26.33 0-33.58L143 90.84c-14-8.36-31 2.72-31 20.16z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M400 80v352"/></svg>`,
}

const container = document.createElement("div")
container.className = "ytskip-container"
document.body.append(container)

function addButton(args) {
	const { icon, onclick, tooltip } = args
	const button = document.createElement("div")
	button.className = "ytskip-icon"
	button.innerHTML = icon
	button.title = tooltip
	button.onclick = onclick
	container.append(button)
}

let buttonObserver
function clickSkipButton() {
	// If skip button is available click and observe whenever it is available
	const skipButton = document.querySelector(".ytp-ad-skip-button-modern.ytp-button")
	if (skipButton) {
		skipButton.click()
		if (!buttonObserver) {
			buttonObserver = new MutationObserver(clickSkipButton)
			buttonObserver.observe(document.body, { subtree: true, attributes: true })
		}
		return
	}

	// If theres a countdown before the skip button is available skip the video
	// Return which allows observer to capture the skip button on next iteration
	const countdownButton = document.querySelector(".ytp-ad-preview-container.ytp-ad-preview-container-detached")
	if (countdownButton) {
		skipVideo()
		return
	}

	// If neither a skip button or a countdown button disconnection observer
	buttonObserver?.disconnect()
	buttonObserver = null
}
function skipVideo() {
	// Get the video element and set the current time progression to a high number
	const video = document.querySelector(".video-stream.html5-main-video")
	if (video) {
		video.currentTime = 9e5 // ~10.41 days
	}
}
function skip() {
	skipVideo()
	clickSkipButton()
}

addButton({
	icon: icons.skip,
	onclick: skip,
	tooltip: "Skip"
})

window.addEventListener("keydown", e => {
	if (e.repeat) return
	if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        skip()
    }
})
/*


function handleAd() {
	const video = document.querySelector("video")
	const adElement = document.querySelector(".video-ads.ytp-ad-module")
	const adExists = video && adElement && adElement.children.length > 0
	if (adExists) {
		video.currentTime = 9e5
	}

}

function init() {
	handleAd()

	const observer = new MutationObserver(handleAd)
	observer.observe(document.body, { childList: true, subtree: true })
}
init()
*/