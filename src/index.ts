import { map } from 'rxjs/operators';
import { groupedSections, parsedMarkdown, recipe, sections } from './markdown/parser';
import { readFile$ } from './util';

readFile$('TEMPLATE.md', { encoding: 'utf8' })
  .pipe(map(parsedMarkdown), map(sections), map(groupedSections), map(recipe))
  .subscribe(
    (mdObject) => console.log(JSON.stringify(mdObject)),
    (err) => console.log(`Failed parsing md: ${err}`)
  );
