import { groupBy, groupWith } from 'ramda';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Recipe } from '../model';
import { readFile$ } from '../util';

export interface MarkdownItToken {
  type: string;
  tag: string;
  attrs: [string, string] | null;
  map: [number, number] | null;
  nesting: -1 | 0 | 1;
  level: number;
  children: ReadonlyArray<MarkdownItToken> | null;
  content: string;
  markup: string;
  info: string;
  meta: Record<string, unknown> | null;
  block: boolean;
  hidden: boolean;
}

export type MarkdownItTokens = ReadonlyArray<MarkdownItToken>;
export type GroupedSections = { [name: string]: MarkdownItTokens[] };

export function isHeading(prevType: string, nextType: string): boolean {
  return prevType !== 'heading_close' && nextType !== 'heading_open';
}

export function isHeadingWithParagraph(prevType: string, nextType: string): boolean {
  return prevType !== 'paragraph_close' && nextType !== 'heading_open';
}

export function isSection(prev: string, next: string): boolean {
  return isHeadingWithParagraph(prev, next) || isHeading(prev, next);
}
function isSectionType(last: MarkdownItToken, next: MarkdownItToken): boolean {
  return isSection(last.type, next.type);
}

export function isHeadingAndBulletList(prev: string, next: string): boolean {
  return (prev !== 'heading_open' && next !== 'bullet_list_open') || isHeading(prev, next);
}
function isHeadingAndBulletListType(last: MarkdownItToken, next: MarkdownItToken): boolean {
  return isHeadingAndBulletList(last.type, next.type);
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const md = require('markdown-it')();
function parsedMarkdown(markdown: string): MarkdownItTokens {
  return md.parse(markdown);
}

function sections(tokens: MarkdownItTokens): MarkdownItTokens[] {
  return groupWith(isSectionType, tokens);
}

export function groupedSections(sections: MarkdownItTokens[]): GroupedSections {
  return groupBy((section: MarkdownItTokens) => {
    if (!(section[0].tag === 'h1' || section[0].tag === 'h2')) {
      throw Error(`Unknown start tag in section: ${section[0].tag} map: ${JSON.stringify(section[0].map)}`);
    }
    return section[0].tag;
  }, sections);
}

function sectionNameOf(section: MarkdownItTokens): string {
  const name = section.find((token) => token.type === 'inline')?.content;
  if (!name) {
    throw Error('Could not find inline token of section');
  }
  return name;
}
function inlineTokensOf(section: MarkdownItTokens): MarkdownItTokens {
  return section.filter((token) => token.type === 'inline');
}
function isNameSection(name: string) {
  return name === 'h1';
}
function isPropertySection(name: string) {
  return name === 'h2';
}
function isParagraphSection(inlineTokens: MarkdownItTokens) {
  return inlineTokens.length === 2;
}
function isBulletlistSection(inlineTokens: MarkdownItTokens) {
  return inlineTokens.length > 2;
}
export function recipe(groupedSections: GroupedSections): Partial<Recipe> {
  const recipe: Record<string, string | string[] | undefined> = {};
  Object.entries(groupedSections).forEach(([name, sections]) => {
    if (isNameSection(name)) {
      if (sections.length > 1) {
        throw new Error('Only one name(h1) section is allowed, aborting');
      }
      recipe.name = sectionNameOf(sections[0]);
    } else if (isPropertySection(name)) {
      sections.forEach((section) => {
        const inlineTokens = inlineTokensOf(section);
        if (isParagraphSection(inlineTokens)) {
          // TODO: add name validation for recipe
          recipe[inlineTokens[0].content.toLocaleLowerCase()] = inlineTokens[1].content;
        } else if (isBulletlistSection(inlineTokens)) {
          // bullet list section
          const [headingTokens, bulletListTokens] = groupWith(isHeadingAndBulletListType, section);
          recipe[sectionNameOf(headingTokens).toLocaleLowerCase()] = inlineTokensOf(bulletListTokens).map(
            (token) => token.content
          );
        } else {
          throw Error('Unkown section type');
        }
      });
    }
  });
  return recipe;
}

export function readMarkdown$(filename: string): Observable<Partial<Recipe>> {
  return readFile$(filename, { encoding: 'utf8' }).pipe(
    map(parsedMarkdown),
    map(sections),
    map(groupedSections),
    map(recipe)
  );
}
