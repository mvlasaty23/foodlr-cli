import { readMarkdown$ } from './markdown/parser';

readMarkdown$('TEMPLATE.md')
  .subscribe(
    (mdObject) => console.log(JSON.stringify(mdObject)),
    (err) => console.log(`Failed parsing md: ${err}`)
  );
