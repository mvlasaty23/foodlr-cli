import { groupBy, groupWith } from 'ramda';
import { Recipe } from '../model';

// section model
export interface MarkdownItToken {
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

export type MarkdownItTokens = ReadonlyArray<MarkdownItToken>;
export type GroupedSections = { [name: string]: MarkdownItTokens[] };

// end section model

// heading_open
// inline
// heading_closed
export function isHeading(last: MarkdownItToken, next: MarkdownItToken): boolean {
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
export function isHeadingWithParagraph(last: MarkdownItToken, next: MarkdownItToken): boolean {
  return !(last.type === 'paragraph_close') && !(next.type === 'heading_open');
}

// TODO: test groupWithFunctions
export function isSection(last: MarkdownItToken, next: MarkdownItToken): boolean {
  return isHeadingWithParagraph(last, next) || isHeading(last, next);
}
export function isHeadingAndBulletList(last: MarkdownItToken, next: MarkdownItToken): boolean {
  return (!(next.type === 'bullet_list_open') && !(last.type === 'heading_open')) || isHeading(last, next);
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const md = require('markdown-it')();
export function parsedMarkdown(markdown: string): MarkdownItTokens {
  return md.parse(markdown);
}

export function sections(tokens: MarkdownItTokens): MarkdownItTokens[] {
  return groupWith(isSection, tokens);
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
        } else if(isBulletlistSection(inlineTokens)) {
          // bullet list section
          const [headingTokens, bulletListTokens] = groupWith(isHeadingAndBulletList, section);
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
