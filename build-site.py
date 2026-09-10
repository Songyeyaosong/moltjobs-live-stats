"""Embed reviewed static assets in a dependency-free Worker; package build output only."""
import hashlib
import io
import json
from pathlib import Path
import sys
import tarfile

root=Path(__file__).resolve().parent
types={'index.html':'text/html; charset=utf-8','styles.css':'text/css; charset=utf-8','app.mjs':'text/javascript; charset=utf-8','stats.mjs':'text/javascript; charset=utf-8'}
assets=[[f'/{name}',{'body':(root/name).read_text(encoding='utf-8'),'type':kind}] for name,kind in types.items()]
source=(root/'worker.mjs').read_text(encoding='utf-8')
marker='const assets = new Map(); // @build:static-assets'
assert source.count(marker)==1
bundle=source.replace(marker,'const assets = new Map('+json.dumps(assets,ensure_ascii=True)+');')
server=root/'dist/server'
server.mkdir(parents=True,exist_ok=True)
(server/'index.js').write_text(bundle,encoding='utf-8',newline='\n')
config=json.loads((root/'wrangler.json').read_text(encoding='utf-8'))
hosting=json.loads((root/'.openai/hosting.json').read_text(encoding='utf-8'))
assert hosting.get('project_id')
encode=lambda item: (json.dumps(item,indent=2)+'\n').encode('utf-8')
files={'.openai/hosting.json':encode(hosting),'wrangler.json':encode({**config,'main':'dist/server/index.js'}),'dist/server/wrangler.json':encode({**config,'main':'index.js'}),'dist/server/index.js':bundle.encode('utf-8')}
archive_path=Path(sys.argv[1]).resolve()
if archive_path.exists(): raise SystemExit('Refusing to overwrite an existing archive')
archive_path.parent.mkdir(parents=True,exist_ok=True)
with tarfile.open(archive_path,'w:gz') as archive:
    for name,data in files.items():
        info=tarfile.TarInfo(name); info.size=len(data); info.mode=0o644
        archive.addfile(info,io.BytesIO(data))
with tarfile.open(archive_path,'r:gz') as archive:
    assert set(archive.getnames())==set(files)
    for name,data in files.items(): assert archive.extractfile(name).read()==data
print(json.dumps({'archive':str(archive_path),'files':list(files),'bundle_bytes':len(bundle.encode()),'archive_sha256':hashlib.sha256(archive_path.read_bytes()).hexdigest()}))
