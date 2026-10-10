// Lossless encoding only: no crops, retouching, or screenshot content changes.
import sharp from 'sharp';
import { mkdir, readdir, stat, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { homedir } from 'node:os';
const supplied = [
 ['premium-promo','16DD6C0A-6C4B-4418-B793-8A2234708DEC.PNG'],
 ['premium-card','IMG_1040 2.PNG'],['card-creator','IMG_0263.PNG'],['player-cutout','Subject 2.png'],
 ['team-tracking','Screenshot 2026-06-23 at 7.25.23 pm.png'],
 ['team-selection','Screenshot 2026-06-22 at 9.25.46 pm.png'],
 ['single-player','Screenshot 2026-06-19 at 5.35.31 pm.png'],
 ['mapping-promo','91CB599B-F3D0-4633-9237-FE8FB50BF7EA.PNG'],
 ['coaches-box','DB652DCB-1985-4BB9-B81B-E1CC0A69B866.PNG'],['team-mapping','Team Tracker.PNG'],
];
await mkdir('public/landing/images',{recursive:true});
const manifest={};
for (const [id,file] of supplied) {
 const dest=`public/landing/originals/${id}.png`;
 try { await stat(dest); } catch { await copyFile(path.join(process.argv[2] || path.join(homedir(), 'Downloads'),file),dest); }
 manifest[id]={original:`/landing/originals/${id}.png`};
}
for(const file of (await readdir('public/mockups/landing')).filter(f=>f.endsWith('.png'))){manifest[file.slice(0,-4)]={original:`/mockups/landing/${file}`};}
for (const [id,asset] of Object.entries(manifest)) {
 const source='public'+asset.original, meta=await sharp(source).metadata();
 asset.width=meta.width;asset.height=meta.height;asset.originalBytes=(await stat(source)).size;asset.variants=[];
 const widths=[...new Set([640,1280,1920,meta.width].filter(w=>w<=meta.width))].sort((a,b)=>a-b);
 for(const width of widths){const src=`/landing/images/${id}-${width}.webp`;await sharp(source).resize({width,withoutEnlargement:true}).webp({lossless:true,effort:6}).toFile('public'+src);asset.variants.push({src,width,bytes:(await stat('public'+src)).size});}
}
await writeFile('src/components/landing/landing-assets.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared',Object.keys(manifest).length,'assets');
