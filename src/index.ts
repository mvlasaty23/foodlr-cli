import { groupBy, groupWith } from 'ramda';
import { map } from 'rxjs/operators';
import { readFile$ } from './util';

interface MarkdownItToken {
  type: string;
  tag: string;
  attrs: [string, string];
  map: [number, number];
  nesting: -1 | 0 | 1;
  level: number;
  children: ReadonlyArray<MarkdownItToken>;
  content: string;
  markup: string;
  info: string;
  meta: Record<string, unknown>;
  block: boolean;
  hidden: boolean;
}
type MarkdownItTokens = ReadonlyArray<MarkdownItToken>;

interface Recipe {
  name: string; // h1
  // h2
  saison: string;
  kosten: string;
  zubereitungszeit: string;
  portionen: number;
  quelle: string;
  herkunftsland: string;
  kategorie: string;
  zutaten: string[];
  vorbereitung: string[];
  zubereitung: string[];
  beilagen: string[];
}
// heading_open
// inline
// heading_closed
function isHeading(last: MarkdownItToken, next: MarkdownItToken): boolean {
  return !(last.type === 'heading_close') && !(next.type === 'heading_open');
}

// heading_open
// inline
// heading_closed
// paragraph_open
// inline
// paragraph_close
//
// OR
//
// heading_open
// inline
// heading_closed
// bullet_list_open
// list_item_open
// paragraph_open
// inline
// paragraph_close
// list_item_close
// bullet_list_close
function isHeadingWithParagraph(last: MarkdownItToken, next: MarkdownItToken): boolean {
  return !(last.type === 'paragraph_close') && !(next.type === 'heading_open');
}

// TODO: test groupWithFunctions
function isSection(last: MarkdownItToken, next: MarkdownItToken): boolean {
  return isHeadingWithParagraph(last, next) || isHeading(last, next);
}
function isHeadingAndBulletList(last: MarkdownItToken, next: MarkdownItToken): boolean {
  return (!(next.type === 'bullet_list_open') && !(last.type === 'heading_open')) || isHeading(last, next);
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const md = require('markdown-it')();
function parsedMarkdown(markdown: string) {
  return md.parse(markdown) as MarkdownItTokens;
}
function sections(tokens: MarkdownItTokens) {
  return groupWith(isSection, tokens);
}

type NamedSections = { [name: string]: MarkdownItTokens[] };
function namedSections(sections: MarkdownItTokens[]): NamedSections {
  return groupBy((section: MarkdownItTokens) => {
    if (!(section[0].tag === 'h1' || section[0].tag === 'h2')) {
      throw Error(`Unknown start tag in section: ${section[0].tag} map: ${JSON.stringify(section[0].map)}`);
    }
    return section[0].tag;
  }, sections);
}

function recipe(namedSections: NamedSections) {
  const recipe: Record<string, string | string[] | undefined> = {};
  Object.entries(namedSections).forEach(([name, sections]) => {
    if (name === 'h1') {
      if (sections.length > 1) {
        throw new Error('Only one h1 section is allowed, aborting');
      }
      recipe.name = sections[0].find((token) => token.type === 'inline')?.content;
    } else if (name === 'h2') {
      sections.forEach((section) => {
        const inlineTokens = section.filter((token) => token.type === 'inline');
        if (inlineTokens.length === 2) {
          // TODO: add name validation for recipe
          recipe[inlineTokens[0].content.toLocaleLowerCase()] = inlineTokens[1].content;
        } else {
          // heading with bullet list
          const [headingTokens, bulletListTokens] = groupWith(isHeadingAndBulletList, section);
          recipe[
            headingTokens.find((token) => token.type === 'inline')?.content.toLowerCase() as string
          ] = bulletListTokens.filter((token) => token.type === 'inline').map((token) => token.content);
        }
      });
    }
  });
  return recipe as Partial<Recipe>;
}

readFile$('TEMPLATE.md', { encoding: 'utf8' })
  .pipe(map(parsedMarkdown), map(sections), map(namedSections), map(recipe))
  .subscribe(
    (mdObject) => console.log(JSON.stringify(mdObject)),
    (err) => console.log(`Failed parsing md: ${err}`)
  );
