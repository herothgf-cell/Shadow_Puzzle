/* Preserve the original 19-room UI regression suite, using the ACTIVE engine. */
const fs=require('node:fs'),path=require('node:path'),root=path.join(__dirname,'..');
let html=fs.readFileSync(path.join(root,'archive/v7/src/shell.html'),'utf8');
for(const [token,file] of [['STYLES','archive/v7/src/style.css'],['LEVELS','archive/v7/src/levels.js'],['CORE','src/core.js'],['UI','archive/v7/src/ui.js']])html=html.replace(`/* ${token} */`,()=>fs.readFileSync(path.join(root,file),'utf8'));
fs.mkdirSync(path.join(root,'qa/legacy-v7'),{recursive:true});fs.writeFileSync(path.join(root,'qa/legacy-v7/index.html'),html);
