// Renders every clip to ../media/<id>.webm and .mp4 plus a poster jpg. Run: npm run render
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const out = path.resolve('../media');
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['link', 'security', 'files', 'ai', 'history'];
for (const id of ids) {
  const composition = await selectComposition({serveUrl, id});
  await renderStill({composition, serveUrl, output: `${out}/${id}.jpg`, frame: 150, imageFormat: 'jpeg', jpegQuality: 78});
  await renderMedia({composition, serveUrl, codec: 'vp9', outputLocation: `${out}/${id}.webm`, crf: 40, concurrency: 2});
  await renderMedia({composition, serveUrl, codec: 'h264', outputLocation: `${out}/${id}.mp4`, crf: 30, concurrency: 2, pixelFormat: 'yuv420p'});
  console.log('rendered', id);
}
