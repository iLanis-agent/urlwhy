import json, sys
from urllib.parse import urlsplit
out=[]
for s in json.load(sys.stdin):
    p=urlsplit(s)
    out.append([p.scheme, p.netloc, p.path, p.query, p.fragment])
json.dump(out, sys.stdout)
