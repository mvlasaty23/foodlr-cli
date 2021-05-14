import { expect } from 'chai';
import { groupWith } from 'ramda';
import {
  isHeading,
  isHeadingAndBulletList,
  isHeadingWithParagraph,
  isSection,
  readMarkdown$,
} from '../../src/markdown/parser';

describe('Markdown Parser', () => {
  describe('readMarkdown$', () => {
    it('should read the template markdown', (done) => {
      readMarkdown$('TEMPLATE.md').subscribe((recipe) => {
        expect(recipe).to.eql({
          name: 'Name',
          saison: 'ganz jährig',
          kosten: 'moderat',
          zubereitungszeit: '1,5h',
          portionen: '4',
          quelle: 'Buch S. 2',
          herkunftsland: 'Österreich',
          kategorie: 'Huhn / Rind / Kalb / Schwein / Fisch / Vegetarisch / Vegan / Low Carb / Schon-, Diätkost',
          zutaten: ['220 g Item', '0,250 l Item'],
          vorbereitung: ['Step', 'Step'],
          zubereitung: ['Step', 'Step'],
          beilagen: ['Beilage', 'Beilage'],
        });
        done();
      });
    });
  });
  describe('Sections', () => {
    const headingOpenType = 'heading_open';
    const headingCloseType = 'heading_close';
    const paragraphOpenType = 'paragraph_open';
    const paragraphCloseType = 'paragraph_close';
    const inlineType = 'inline';
    const bulletListOpenType = 'bullet_list_open';
    const bulletListCloseType = 'bullet_list_close';
    const listItemOpenType = 'list_item_open';
    const listItemCloseType = 'list_item_close';
    describe('isHeading', () => {
      it('should group heading section', () => {
        const tokenTypes = [
          headingOpenType,
          inlineType,
          headingCloseType,
          headingOpenType,
          inlineType,
          headingCloseType,
        ];
        const actual = groupWith(isHeading, tokenTypes);
        expect(actual.length).to.eq(2);
        expect(actual[0]).to.eqls([headingOpenType, inlineType, headingCloseType]);
        expect(actual[1]).to.eqls([headingOpenType, inlineType, headingCloseType]);
      });
    });
    describe('isHeadingWithParagraph', () => {
      it('should group heading section with paragraph', () => {
        const tokenTypes = [
          headingOpenType,
          inlineType,
          headingCloseType,
          paragraphOpenType,
          inlineType,
          paragraphCloseType,
          headingOpenType,
          inlineType,
          headingCloseType,
          paragraphOpenType,
          inlineType,
          paragraphCloseType,
        ];
        const actual = groupWith(isHeadingWithParagraph, tokenTypes);
        expect(actual.length).to.eq(2);
        expect(actual[0]).to.eqls([
          headingOpenType,
          inlineType,
          headingCloseType,
          paragraphOpenType,
          inlineType,
          paragraphCloseType,
        ]);
        expect(actual[1]).to.eqls([
          headingOpenType,
          inlineType,
          headingCloseType,
          paragraphOpenType,
          inlineType,
          paragraphCloseType,
        ]);
      });
    });
    describe('isSection', () => {
      it('should group heading section, heading section with paragraph and heading section with bulletlist', () => {
        const tokenTypes = [
          headingOpenType,
          inlineType,
          headingCloseType,
          headingOpenType,
          inlineType,
          headingCloseType,
          paragraphOpenType,
          inlineType,
          paragraphCloseType,
          headingOpenType,
          inlineType,
          headingCloseType,
          bulletListOpenType,
          listItemOpenType,
          paragraphOpenType,
          inlineType,
          paragraphCloseType,
          listItemCloseType,
          bulletListCloseType,
        ];
        const actual = groupWith(isSection, tokenTypes);
        expect(actual.length).to.eq(3);
        expect(actual[0]).to.eqls([headingOpenType, inlineType, headingCloseType]);
        expect(actual[1]).to.eqls([
          headingOpenType,
          inlineType,
          headingCloseType,
          paragraphOpenType,
          inlineType,
          paragraphCloseType,
        ]);
        expect(actual[2]).to.eqls([
          headingOpenType,
          inlineType,
          headingCloseType,
          bulletListOpenType,
          listItemOpenType,
          paragraphOpenType,
          inlineType,
          paragraphCloseType,
          listItemCloseType,
          bulletListCloseType,
        ]);
      });
    });
    describe('isHeadingAndBulletList', () => {
      it('should group heading section and bullet list section', () => {
        const tokenTypes = [
          headingOpenType,
          inlineType,
          headingCloseType,
          bulletListOpenType,
          listItemOpenType,
          paragraphOpenType,
          inlineType,
          paragraphCloseType,
          listItemCloseType,
          bulletListCloseType,
        ];
        const actual = groupWith(isHeadingAndBulletList, tokenTypes);
        expect(actual.length).to.eq(2);
        expect(actual[0]).to.eqls([headingOpenType, inlineType, headingCloseType]);
        expect(actual[1]).to.eqls([
          bulletListOpenType,
          listItemOpenType,
          paragraphOpenType,
          inlineType,
          paragraphCloseType,
          listItemCloseType,
          bulletListCloseType,
        ]);
      });
    });
  });
});
