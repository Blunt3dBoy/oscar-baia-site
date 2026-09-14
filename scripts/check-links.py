"""Report external link failures without replacing blocked social profiles."""
from html.parser import HTMLParser
from pathlib import Path
import subprocess, concurrent.futures, os
class Links(HTMLParser):
    urls = set()
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if tag == 'a' and key == 'href' and value.startswith('https://'):
                self.urls.add(value)
parser = Links(); parser.feed(Path('index.html').read_text())
def check(url):
    result = subprocess.run(['curl','-sSL','--max-time','25','--retry','1','-o','/dev/null','-w','%{http_code}',url], capture_output=True, text=True)
    code = result.stdout.strip()
    status = 'OK' if code.startswith('2') else ('Blocked / requires manual verification' if code in ('401','403','429') else 'Needs review')
    return f'| {url} | {code or "Connection error"} | {status} |'
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    rows = list(pool.map(check, sorted(parser.urls)))
report = '# External link check\n\nResponses do not prove playback or account ownership. Blocked links are preserved.\n\n| Link | HTTP | Result |\n|---|---|---|\n' + '\n'.join(rows) + '\n'
Path('link-report.md').write_text(report)
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as f: f.write(report)
if any('Needs review' in row for row in rows): print('::warning::Some external links need review. See the link report.')
