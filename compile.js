import { writeFile } from 'fs/promises'
import { resolve } from 'path'
import { nanoid } from 'nanoid'
import { spawn } from 'child_process'
import os from 'os'

const tempdir = os.tmpdir()
const executable = os.platform() === 'win32' ? 'exe' : 'out'
const compiler = { c: 'gcc', cpp: 'g++' }
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

async function compileSourceFile(sourcepath, destpath, compiler) {
	return new Promise((resolve, reject) => {
		const childps = spawn(compiler, [sourcepath, '-o', destpath])
		childps.on('close', _ => resolve(true))
		childps.on('error', _ => reject(null))
	})
}

export async function compile(source, lang) {
	const step1 = await saveSourceFile(source, lang)
	const step2 = await compileSourceFile(step1[0], step1[1], compiler[lang])
	if (!step2) return null
	const exePath = step1[1]
	const sourceName = step1[3]
	return [exePath, sourceName]
}
