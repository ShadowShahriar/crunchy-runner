import { writeFile } from 'fs/promises'
import { resolve } from 'path'
import { nanoid } from 'nanoid'
import { spawn } from 'child_process'
import os from 'os'

const tempdir = os.tmpdir()
const executable = os.platform() === 'win32' ? 'exe' : 'out'
const compiler = { c: 'gcc', cpp: 'g++', cs: 'csc', java: 'java', py: 'python', js: 'node' }
const idlength = 16

async function saveSourceFile(code, lang) {
	const fileid = nanoid(idlength)
	const sourcefilename = `${fileid}.${lang}`
	const exefilename = `${fileid}.${executable}`
	const sourcefilepath = resolve(tempdir, sourcefilename)
	const exefilepath = resolve(tempdir, exefilename)
	await writeFile(sourcefilepath, code, { encoding: 'utf8' })
	return [sourcefilepath, exefilepath, lang, sourcefilename]
}

async function compileSourceFile(sourcepath, destpath, compiler, lang) {
	return new Promise((resolve, reject) => {
		let args = []

		// compilation command is different in C# compiler
		if (lang === 'cs') args = [sourcepath, `-out:${destpath}`]
		else args = [sourcepath, '-o', destpath]

		const childps = spawn(compiler, args)
		childps.on('close', _ => resolve(true))
		childps.on('error', _ => {
			console.log(_)
			reject(null)
		})
	})
}

export async function compile(source, lang) {
	const step1 = await saveSourceFile(source, lang)
	let step2, exePath

	// these source files can be run directly without compilation
	if (lang === 'java' || lang === 'py' || lang === 'js') {
		exePath = `${compiler[lang]} "${step1[0]}"`
	} else {
		// C, C++, and C# source files require compilation
		step2 = await compileSourceFile(step1[0], step1[1], compiler[lang], lang)
		if (!step2) return null
		exePath = step1[1]
	}
	const sourceName = step1[3]
	return [exePath, sourceName]
}
