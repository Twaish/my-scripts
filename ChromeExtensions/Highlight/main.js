// Validate whether a code page
const element = document.querySelector("body > pre")
const hasText = element?.textContent !== ""
const hasNoChildren = element?.children.length === 0
const bodyIsEmpty = document.body.children.length === 1
// https://tsavo.medium.com/prismjs-highlightjs-codemirror-6-codedetectionapi-%EF%B8%8F-af99dc13d83b
const settings = {
	indentLines: true,
	lineNumbers: true,
}

function detectIndent(text) {
	const lines = text.split("\n")
		.map(line => line.match(/^( +)/)) // only spaces
		.filter(Boolean) // only indented lines
		.map(m => m[0].length);

	if (lines.length < 2) return 2; // fallback

	const diffs = {};
	for (let i = 1; i < lines.length; i++) {
		const diff = Math.abs(lines[i] - lines[i - 1]);
		if (diff > 0) {
			diffs[diff] = (diffs[diff] || 0) + 1;
		}
	}

	// Pick the most frequent diff
	const indentSize = parseInt(Object.keys(diffs).sort((a, b) => diffs[b] - diffs[a])[0]);
	return indentSize || 2;
}

if (element && hasText && bodyIsEmpty && hasNoChildren) {
	// body:has(> :only-child):has(> pre > code) { tab-size: 4; }
	document.body.style.tabSize = 2
	document.body.style.fontSize = "1rem"

	// Wrap text in a code block
	let text = element?.textContent
	element.innerHTML = ""
	element.className = "show-code"

	const indentSize = detectIndent(text)
	const elements = []

	// Create line numbers
	if (settings.lineNumbers) {
		const lineNumbers = document.createElement("numbers")
		const lines = text.split("\n")
		for (let i = 0; i < lines.length; i++) {
			const number = document.createElement("number")
			lineNumbers.append(number)
		}
		elements.push(lineNumbers)
	}
	

	let wasIndented = false
	let prevIndents = 0
	const fragment = document.createDocumentFragment()
	const highlightedText = hljs.highlightAuto(text).value
	highlightedText.split("\n").forEach(line => {
		const regex = new RegExp(" {" + indentSize + "}", "g");
		line = line.replace(regex, "\t");
		// line = line.replace(/\s+$/, '') // Remove whitespace from end of string
		// line = line.replaceAll("    ", "\t") // Replace spaces with tabs

		const isEmpty = line.trim() === ""
		const matches = line.match(/^\s+/)

		if (settings.indentLines) {
			const indents = matches ? matches[0].split("\t").length - 1 : 0

			// Check if whitespace in front of string
			const hasWhiteSpace = /^[\s\uFEFF\xA0]+/.test(line) 

			// Replace all tabs in front of the line with indentation line wrappers
			line = line.replace(/^(\t+)/, (match, group) => "<i>\t</i>".repeat(group.length))

			const inScope = hasWhiteSpace || (wasIndented && isEmpty)
			if (isEmpty) {
				line = inScope ? "<i>\t</i>".repeat(prevIndents) : "\n"
			}
			wasIndented = inScope
			prevIndents = indents
		}
		

		const wrapper = document.createElement("span")
		wrapper.innerHTML = line

		fragment.append(wrapper)
	})
	const code = document.createElement("code")
	code.append(fragment)

	element.append(...elements, code)
}