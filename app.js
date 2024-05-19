import express from 'express'
import bodyParser from 'body-parser'
import os from 'os'
import pty from 'node-pty'
import open from 'open'
import { existsSync } from 'fs'
import { WebSocketServer } from 'ws'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { compile } from './compile.js'
const __dirname = resolve(dirname(fileURLToPath(import.meta.url)), './')

const log = true
const debugfnlen = 11
const defaultPort = 3000
const wssPort = 6060
const uploadLimit = '1mb'
const contentDir = 'static'

const app = express()
const port = process.env.PORT || defaultPort
const rootFilePath = resolve(__dirname, contentDir, 'index.html')
const wss = new WebSocketServer({ port: wssPort })
const iswin = os.platform() === 'win32'
const shell = iswin ? 'cmd.exe' : 'bash'
let xterm = null
let wsid = null
let clientnum = 0
const clscr = iswin ? 'cls' : 'clear'

function debug() {
	let data = Array.from(arguments)
	const fnname = `[${data.shift()}]`
	const fnpad = fnname.padEnd(debugfnlen, ' ')
	if (log) return console.log(`:: ${fnpad} ::`, ...data)
	return false
}

function createTerminal() {
	// === create a new interactive terminal ===
	xterm = pty.spawn(shell, [], {
		name: 'xterm-color',
		// cols: 100,
		// rows: 100,
		cwd: process.env.HOME || process.env.USERPROFILE,
		env: { ...process.env, LANG: 'en_US.UTF-8' },
		handleFlowControl: true
	})

	debug('xterm', 'Created a new terminal instance')

	// === change active code page for Unicode support ===
	if (iswin) {
		xterm.write('chcp 65001\r')
		debug('xterm', 'Changed active code page to display unicode characters')
	}

	// === handle terminal events ===
	xterm.on('exit', _ => debug('xterm', 'Terminal instance closed'))
	xterm.onData(output => {
		if (wsid) wsid.send(output)
		else debug('xterm', 'Cannot send output to the socket')
	})
}
createTerminal()

app.use(bodyParser.urlencoded({ extended: true, limit: uploadLimit }))
app.use(express.static(contentDir))
app.use(express.static('node_modules/codemirror'))
app.use(express.static('node_modules/@xterm'))
app.use(express.static('node_modules/@fontsource-variable'))

app.get('/', (_, res) => res.sendFile(rootFilePath))
app.post('/run', async (req, res) => {
	const sourceCode = req.body.editor
	const sourceLang = req.body.language
	const paths = await compile(sourceCode, sourceLang)
	if (wsid) {
		if (existsSync(paths[0])) {
			xterm.write(`\x03\r${clscr}\r${paths[0]}\r`)
			debug(shell, `Executing: ${paths[0]}`)
			res.send(paths[1])
		} else {
			xterm.write(`\x03\r${clscr}\r`)
			debug(shell, 'Executable file not found')
			res.send('Error')
		}
	} else {
		debug(shell, 'Socket disconnected')
		res.send('Disconnected')
	}
})

wss.on('connection', ws => {
	clientnum++
	wsid = ws
	debug('websocket', `Client ${clientnum} connected`)

	ws.on('close', _ => {
		xterm.write(`\x03\r${clscr}\r`)
		debug('websocket', 'Client disconnected')
		wsid = null
	})

	ws.on('message', cmd => xterm.write(cmd))
})

app.listen(port, async () => {
	const url = `http://localhost:${port}`
	debug('express', `Server running at ${url}`)
	await open(url)
	debug('open', `Navigating to ${url}`)
})
