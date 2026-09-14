"""Create and verify a portable backup from tracked repository files."""
from pathlib import Path
import subprocess, zipfile, hashlib
from datetime import datetime, timezone
out = Path('backup-output')
out.mkdir(exist_ok=True)
archive = out / ('oscar-baia-site-' + datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S') + '.zip')
files = subprocess.check_output(['git', 'ls-files', '-z']).decode().split('\0')
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for name in filter(None, files):
        p = Path(name)
        if any(part in {'.wrangler', 'node_modules', 'dist', '.git'} for part in p.parts) or p.name.startswith('.env'):
            continue
        if not p.is_file():
            raise RuntimeError('Missing tracked file: ' + name)
        z.write(p, 'oscar-baia-site/' + name)
    z.writestr('RESTORE.txt', 'This backup contains the website source, assets, data and deployment configuration from GitHub. Extract oscar-baia-site onto your NAS. Install Node.js and authenticate Cloudflare before using deploy.sh. Cloudflare and GitHub secrets, subscriber data and Git history are not included. Changes kept only on a computer must be pushed to GitHub before they can appear in this backup.\n')
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for name in z.namelist():
        if name.startswith('oscar-baia-site/'):
            assert z.read(name) == Path(name.removeprefix('oscar-baia-site/')).read_bytes()
(out / (archive.name + '.sha256')).write_text(hashlib.sha256(archive.read_bytes()).hexdigest() + '  ' + archive.name + '\n')
print('Verified backup:', archive)
