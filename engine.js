(function (root) {
  'use strict';
  // Two views of one string: the RFC 3986 Appendix B split, and what a WHATWG URL parser (browsers, Node) makes of it.
  var RFC = /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
  var NOSCHEME = /^(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
  function rfcSplit(s) {
    var m = RFC.exec(s);
    if (m[2] !== undefined && !/^[a-zA-Z][a-zA-Z0-9+.-]*$/.test(m[2])) {
      // RFC 3986 section 3.1: not a valid scheme, so there is no scheme at all
      var k = NOSCHEME.exec(s);
      return { scheme: undefined, authority: k[2], path: k[3], query: k[5], fragment: k[7] };
    }
    return { scheme: m[2], authority: m[4], path: m[5], query: m[7], fragment: m[9] };
  }
  var DEFAULT = { 'http:': '80', 'https:': '443', 'ftp:': '21', 'ws:': '80', 'wss:': '443' };
  function notes(raw, u) {
    var n = [], t = raw.trim();
    if (/^[\u0000-\u0020]|[\u0000-\u0020]$/.test(raw)) n.push('Leading and trailing spaces and control characters are stripped before parsing.');
    if (/[\t\n\r]/.test(t)) n.push('Tabs and newlines inside the string are removed silently, even in the middle of the host.');
    var after = t.replace(/[\t\n\r]/g, '');
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(after) && DEFAULT[u.protocol] !== undefined || /^(file|http|https|ftp|ws|wss):/i.test(after)) {
      if (/\\/.test(after.split(/[?#]/)[0])) n.push('Backslashes count as forward slashes in special schemes (http, https, ftp, ws, wss, file).');
      if (/^[a-zA-Z]+:(?!\/\/)/.test(after) && /^(http|https|ftp|ws|wss):/i.test(after)) n.push('Slashes after "' + u.protocol + '" are optional for special schemes: "' + u.protocol + 'example.com" parses as a host.');
    }
    var m = /^[a-zA-Z][a-zA-Z0-9+.-]*:(?:[\/\\]{2,})?([^\/\\?#]*)/.exec(after);
    var auth = m ? m[1] : '';
    if (auth.indexOf('@') >= 0 && DEFAULT[u.protocol] !== undefined) n.push('Everything before the last @ in the authority is credentials, so the real host is "' + u.host + '". A trick used in phishing links.');
    var hostRaw = auth.slice(auth.lastIndexOf('@') + 1).replace(/:[0-9]*$/, '');
    if (u.hostname && hostRaw && hostRaw.toLowerCase() !== u.hostname && /[A-Z]/.test(hostRaw) && /^[A-Za-z0-9.-]+$/.test(hostRaw)) n.push('Host lowercased.');
    if (/[^\x00-\x7f]/.test(hostRaw) && /^xn--|\.xn--|^[a-z0-9.-]*xn--/.test(u.hostname)) n.push('Non-ASCII host converted to Punycode: ' + u.hostname + '.');
    if (/^(?:0x[0-9a-f]+|[0-9]+)(?:\.(?:0x[0-9a-f]+|[0-9]+)){0,3}$/i.test(hostRaw) && /^[0-9.]+$/.test(u.hostname) && hostRaw !== u.hostname) n.push('Number-like host rewritten as IPv4 (hex, octal-looking, and short forms count): "' + hostRaw + '" became ' + u.hostname + '.');
    var pm = /:([0-9]+)$/.exec(auth.slice(auth.lastIndexOf('@') + 1));
    if (pm && DEFAULT[u.protocol] === pm[1] && u.port === '') n.push('Default port :' + pm[1] + ' for ' + u.protocol + ' dropped.');
    if (/%[0-9a-fA-F]{2}/.test(after) === false && u.pathname !== after.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:(?:[\/\\]{2})?[^\/\\?#]*/, '').split(/[?#]/)[0] && /\/\.\.?(\/|$)/.test(u.pathname) === false && /\/\.\.?(\/|$)/.test(after.split(/[?#]/)[0])) n.push('Dot segments (. and ..) resolved in the path.');
    if (/ /.test(after.split(/[?#]/)[0]) && /%20/.test(u.pathname)) n.push('Space in the path percent-encoded as %20.');
    if (u.protocol === 'javascript:' || u.protocol === 'data:') n.push('Scheme ' + u.protocol + ' runs or embeds content, not a network location.');
    return n;
  }
  function analyze(input) {
    var raw = String(input), rfc = rfcSplit(raw.trim()), u = null, err = '', base = false;
    try { u = new URL(raw); } catch (e) {
      err = 'Invalid URL (no base)';
      try { u = new URL(raw, 'https://base.example/dir/page'); base = true; } catch (e2) { u = null; }
    }
    if (!u) return { raw: raw, ok: false, error: 'The URL parser rejects this string even against a base.', rfc: rfc, notes: [] };
    var out = { raw: raw, ok: !base, relative: base, rfc: rfc, href: u.href, parts: { protocol: u.protocol, username: u.username, password: u.password, hostname: u.hostname, port: u.port, pathname: u.pathname, search: u.search, hash: u.hash, origin: u.origin } };
    out.notes = base ? ['No scheme, so this is only a relative reference. new URL(x) throws; against the base https://base.example/dir/page it becomes ' + u.href] : notes(raw, u);
    if (base) out.error = err;
    return out;
  }
  var api = { analyze: analyze, rfcSplit: rfcSplit };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.UrlWhy = api;
})(typeof window !== 'undefined' ? window : this);
