/**
 * Builds the whole game into one HTML file that can be opened by double
 * clicking it — no server, no Node, no internet.
 *
 * Everything is inlined as a classic script rather than a module, because a
 * page opened from file:// is not allowed to load ES modules.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const out = join(root, 'dist-single')

console.log('Building…')
execFileSync('npx', ['vite', 'build', '--config', 'vite.singlefile.config.ts'], {
  cwd: root,
  stdio: 'inherit',
})

const js = readFileSync(join(out, 'game.js'), 'utf8')
const css = readFileSync(join(out, 'game.css'), 'utf8')
const favicon = readFileSync(join(root, 'public', 'favicon.svg'), 'utf8')

const html = `<!doctype html>
<html lang="en-AU">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="icon" href="data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}" />
    <title>Zelda Spelling Quest</title>
    <style>
${css}
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script>
${js}
    </script>
  </body>
</html>
`

mkdirSync(out, { recursive: true })
const file = join(out, 'zelda-spelling-quest.html')
writeFileSync(file, html)

const kb = Math.round(Buffer.byteLength(html) / 1024)
console.log(`\nWrote ${file} (${kb} KB)`)
console.log('Open it by double clicking. Nothing else needed.')
