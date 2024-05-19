const editor = document.querySelector('#editor')
const output = document.querySelector('#output')
let cm = null

// === create a new Web Socket ===
const socket = new WebSocket('ws://localhost:6060')

// === close the socket before exiting ===
window.addEventListener('beforeunload', _ => socket.close())

// === create a new codemirror instance ===
function setupCodeMirror() {
	cm = CodeMirror.fromTextArea(editor, {
		keyMap: 'sublime',
		theme: 'material-ocean',
		mode: 'text/x-c++src',
		cursorBlinkRate: 400,
		matchBrackets: true,
		autoCloseBrackets: true,

		indentUnit: 4,
		indentWithTabs: true,
		lineNumbers: true,
		lineWrapping: true,
		styleActiveLine: true,
		autoClearEmptyLines: true,
		autofocus: true
	})
}

// === handle submit action ===
function setupSubmitButton() {
	const form = document.getElementById('upload')
	const termproxy = document.querySelector('#terminal-wrapper')
	const editorproxy = document.querySelector('#editor-wrapper')
	const title = document.querySelector('#tab')
	form.addEventListener('submit', async event => {
		event.preventDefault()
		socket.send('\r\n\r')
		xterm.clear()
		termproxy.setAttribute('data-state', 'none')
		editorproxy.setAttribute('data-state', 'process')
		const formData = new FormData(document.getElementById('upload'))
		const response = await fetch('/run', { method: 'POST', body: new URLSearchParams(formData) })
		const result = await response.text()

		if (result === 'Disconnected') {
			termproxy.setAttribute('data-state', 'error')
			editorproxy.setAttribute('data-state', 'none')
			title.innerText = 'Socket Disconnected'
		} else if (result === 'Error') {
			termproxy.setAttribute('data-state', 'none')
			editorproxy.setAttribute('data-state', 'error')
			title.innerText = 'Compilation Error'
		} else {
			termproxy.setAttribute('data-state', 'none')
			editorproxy.setAttribute('data-state', 'none')
			title.innerText = result
		}
	})
}

let xterm, fitAddon

// === create a new xterm instance ===
function setupXterm() {
	xterm = new window.Terminal({
		fontFamily: '"JetBrains Mono Variable", monospace',
		fontSize: 17,
		fontWeight: 500,
		fontWeightBold: 800,
		lineHeight: 1.2,

		convertEol: true,
		linkHandler: null,
		cursorBlink: true,
		cursorStyle: 'block',
		cursorInactiveStyle: 'outline',
		drawBoldTextInBrightColors: true,
		// cols: 100,
		// rows: 100,

		theme: {
			foreground: '#ebeef5',
			background: '#1d2935',
			cursor: '#e6a23c',
			black: '#000000',
			brightBlack: '#555555',
			red: '#ef4f4f',
			brightRed: '#ef4f4f',
			green: '#67c23a',
			brightGreen: '#67c23a',
			yellow: '#e6a23c',
			brightYellow: '#e6a23c',
			blue: '#409eff',
			brightBlue: '#409eff',
			magenta: '#ef4f4f',
			brightMagenta: '#ef4f4f',
			cyan: '#17c0ae',
			brightCyan: '#17c0ae',
			white: '#bbbbbb',
			brightWhite: '#ffffff'
		}
	})

	fitAddon = new FitAddon.FitAddon()
	xterm.loadAddon(fitAddon)
	xterm.open(terminal)
	fitAddon.fit()
}

// === display incoming stdout in the xterm instance ===
socket.onmessage = event => xterm.write(event.data)

// === attach a resize observer to monitor terminal geometry changes ===
const xtermResizeObserver = new ResizeObserver(_ => {
	try {
		fitAddon && fitAddon.fit()
	} catch (err) {
		console.log(err)
	}
})

xtermResizeObserver.observe(terminal)

// === initialize the terminal functionalities ===
function initXterm() {
	if (xterm._initialized) return
	xterm._initialized = true

	xterm.prompt = () => socket.send('\n')
	xterm.onKey(keyObj => socket.send(keyObj.key))
}

function setupTheme() {
	const old = document.querySelector('#themecss')
	document.head.removeChild(old)

	const current = document.querySelector('#theme').value
	const link = document.createElement('link')
	link.id = 'themecss'
	link.rel = 'stylesheet'
	link.href = `theme/${current}.css`
	link.onload = _ => {
		cm.setOption('theme', current)
		const cmBG = getComputedStyle(document.querySelector('.CodeMirror'))['backgroundColor']
		const cmEditor = document.querySelector('#editor-wrapper')
		cmEditor.style.setProperty('--background-color', cmBG)
		document.body.style.setProperty('--background-color', cmBG)
		document.querySelector('.xterm-viewport').style.backgroundColor = cmBG
	}
	document.head.appendChild(link)
}

document.querySelector('#theme').addEventListener('change', _ => setupTheme())

setupXterm()
setupCodeMirror()
setupTheme()
setupSubmitButton()
initXterm()
