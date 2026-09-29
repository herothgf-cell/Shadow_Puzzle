import bz2, hashlib, json, os, pathlib, subprocess
root = pathlib.Path.cwd().resolve()
expected = '376732f702688e167a360af54fc4f2087e9278104b82273d33cafb8258576761'
packed = b''.join((root / f'.ci/campaign40-{i}.bin').read_bytes() for i in range(1,7))
assert hashlib.sha256(packed).hexdigest() == expected, 'Transport digest mismatch'
manifest = json.loads(bz2.decompress(packed))
if os.environ.get('GITHUB_SHA'):
    assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip() == os.environ['GITHUB_SHA']
    assert manifest['base'] == '97565fa8d4e0ac3cccb5c46cc0ea8cb73f3ee6b6'
    subprocess.run(['git','merge-base','--is-ancestor',manifest['base'],'HEAD'],check=True)
def safe(name):
    p = pathlib.PurePosixPath(name)
    assert not p.is_absolute() and '..' not in p.parts
    assert p.parts[0] in {'src','tests','docs','tools','archive','.gitignore','README.md','build.cjs','package.json'}, name
    path = root.joinpath(*p.parts)
    assert path.resolve().is_relative_to(root), name
    return path
def gitsha(b):
    return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
files = manifest['files']
assert len({f['path'] for f in files}) == len(files) == 38
# Read and verify all preimages before changing any source file.
preimages = {}
for f in files:
    safe(f['path'])
    if 'copy' in f or 'edits' in f:
        source = f.get('copy',f['path'])
        b = safe(source).read_bytes()
        assert gitsha(b) == f['base'], 'Base blob mismatch: '+source
        preimages[f['path']] = b
for f in files:
    if f.get('generate'): continue
    if 'copy' in f: b = preimages[f['path']]
    elif 'edits' in f:
        lines = preimages[f['path']].decode('utf-8').splitlines(keepends=True)
        last = 0
        for start,end,text in f['edits']:
            assert last <= start <= end <= len(lines)
            last = end
        for start,end,text in reversed(f['edits']): lines[start:end] = text.splitlines(keepends=True)
        b = ''.join(lines).encode('utf-8')
    else: b = f['text'].encode('utf-8')
    assert hashlib.sha256(b).hexdigest() == f['sha256'], 'Output mismatch: '+f['path']
    p = safe(f['path']); p.parent.mkdir(parents=True,exist_ok=True); p.write_bytes(b)
subprocess.run(['python','tools/author_campaign.py'],check=True)
for f in files:
    assert hashlib.sha256(safe(f['path']).read_bytes()).hexdigest() == f['sha256'], 'Final mismatch: '+f['path']
pathlib.Path(os.environ.get('RUNNER_TEMP','/tmp'),'campaign40-manifest.json').write_text(json.dumps(manifest))
print('Verified all 38 release files; original plan digest is preserved.')
