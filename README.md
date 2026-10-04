# UrlWhy
Paste a URL: RFC 3986 Appendix B split next to the browser (WHATWG) parse, with the silent rewrites explained.
Static client-side app. Open `app.html`.
Sources: RFC 3986 Appendix B regex (recalled, not re-fetched this cycle), WHATWG URL behaviour via Node 22 / browser `URL`.
Tests: `node test-engine.js` compares the RFC split with Python urllib.parse.urlsplit (`oracle.py`) on 4000+ strings, checks the WHATWG view equals native `URL`, and checks 7 explanation notes. Deviation: urlsplit in Python 3.10 accepts a scheme starting with a digit (e.g. 127.0.0.1:80); RFC 3986 requires a letter, so the app follows the RFC and those cases are skipped. The WHATWG side is the same engine as the oracle, so it is not independent.
