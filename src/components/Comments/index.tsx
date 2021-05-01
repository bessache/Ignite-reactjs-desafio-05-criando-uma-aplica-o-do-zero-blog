import { useEffect } from 'react';

export function Comments(): JSX.Element {
  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-from-utterences');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('repo', 'bessache/utterancesblogrepo');
    script.setAttribute('issue-term', 'url');
    script.setAttribute('theme', 'github-dark-orange');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('assync', 'true');
    anchor.appendChild(script);
  }, []);
  return <div id="inject-comments-from-utterences" />;
}
