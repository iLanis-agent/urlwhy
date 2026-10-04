const U=require('./engine.js'),cp=require('child_process');
let seed=777;const rnd=n=>{seed=(seed*1103515245+12345)&0x7fffffff;return (seed>>8)%n};const pick=a=>a[rnd(a.length)];
const gen=()=>{let s='';if(rnd(5))s+=pick(['http','https','ftp','mailto','file','custom+x'])+':';if(rnd(4))s+='//';
 if(rnd(3))s+=pick(['user@','u:p@','','a@b@'])+pick(['example.com','EXAMPLE.org','127.0.0.1','localhost','0x7f.1','[::1]'])+pick(['',':8080',':80',':443']);
 s+=pick(['','/','/a/b','/a/../b','/a b','/%41','/.']);if(rnd(2))s+='?'+pick(['q=1','a=b&c','']);if(rnd(2))s+='#'+pick(['f','','x/y']);return s};
const fixed=['http://example.com/a?b#c','mailto:a@b.c','//host/path','/rel/path?x','a:b','http:example.com','HTTP://EX.com:80/','file:///C:/x','x','','?q','#h','http://a.com?x?y#z#w'];
const cases=fixed.slice();for(let i=0;i<4000;i++)cases.push(gen());
const o=JSON.parse(cp.execFileSync('python3',['oracle.py'],{input:JSON.stringify(cases),maxBuffer:1e8}));
let bad=0,badN=0,nn=0,dev=0;
cases.forEach((s,i)=>{const r=U.rfcSplit(s),p=o[i];if(p[0]&&!/^[a-z]/.test(p[0])){dev++;return}
 const mine=[r.scheme||'',r.authority||'',r.path||'',r.query||'',r.fragment||''];
 // urlsplit lowercases scheme; Appendix B keeps case
 mine[0]=mine[0].toLowerCase();
 if(JSON.stringify(mine)!==JSON.stringify(p)){bad++;if(bad<10)console.log('RFC MISMATCH',JSON.stringify(s),JSON.stringify(mine),JSON.stringify(p))}
 // WHATWG side: href must equal native URL
 let n=null;try{n=new URL(s).href}catch(e){}
 const a=U.analyze(s);
 if(n!==null){nn++;if(!(a.ok&&a.href===n)){badN++;console.log('WHATWG MISMATCH',s)}}
 else if(a.ok){badN++;console.log('should be not ok',s)}
});
console.log('checks',cases.length,'rfc mismatches',bad,'whatwg mismatches',badN,'valid absolute',nn,'skipped (Python 3.10 urlsplit accepts a scheme starting with a digit, RFC 3986 does not)',dev);
const must=[['http://user:pw@evil.com@good.com/','real host'],['http://0x7f.1/','IPv4'],['http://EX.com:80/','Default port'],['http:\\\\a.com\\b','Backslashes'],['http://a.com/x/../y','Dot segments'],['ht\ttp://a.com','removed'],['http://b\u00fccher.de/','Punycode']];
let nb=0;must.forEach(([s,k])=>{const a=U.analyze(s);if(!a.notes.some(x=>x.includes(k))){nb++;console.log('MISSING NOTE',k,JSON.stringify(s),JSON.stringify(a.notes))}});
console.log('note checks',must.length,'missing',nb);process.exit(bad||badN||nb?1:0);
