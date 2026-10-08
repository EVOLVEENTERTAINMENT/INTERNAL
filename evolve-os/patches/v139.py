import sys
s=open(sys.argv[1]).read()
R=[('''  catch(x){ return null; }        /* cannot check: fall through to the write */''',
    '''  /* V139. cannot check: hold it, as the ripple writer does. It stays queued. */
  catch(x){ return "Google did not answer the check, so nothing was written"; }'''),
   ('const BUILD="V138 2026-10-08T21:00Z";','const BUILD="V139 2026-10-08T22:00Z";')]
for a,b in R:
    assert s.count(a)==1,a[:60]; s=s.replace(a,b)
open(sys.argv[2],'w').write(s); print("ok")
