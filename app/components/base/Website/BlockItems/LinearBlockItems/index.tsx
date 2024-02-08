import { useRef } from "react";

import { BlockItemProperties } from "..";
import type {
  BlockUI,
  BlockItemUI,
  Attributes as AttributesModel,
} from "~/models";

import Attributes from "~/services/template/custom-attributes";
import WebsiteLink from "~/components/core/Link";
import Metadata from "~/services/template/custom-metadata-style";
import Attachment from "~/components/core/Attachment";
import Title from "~/components/core/Title";
import { Separator } from "@radix-ui/themes";

type ItemProps = {
  item: BlockItemUI;
  block: BlockUI;
  itemIndex: number;
  blockIndex: number;
};

function LinearBlockItem({ item, itemIndex, blockIndex, block }: ItemProps) {
  const blockRef = useRef<HTMLDivElement>(null);

  const {
    hasTitle,
    hasDescription,
    hasLink,
    hasImage,
    hasText,
    attachmentIsVideo,
  } = BlockItemProperties(item);

  const attributes: AttributesModel = {
    "block-index": blockIndex,
    "block-layout": block.blockLayout,
    "block-image": block.attachmentUrl !== "",

    "has-image": hasImage,
    "is-item-video": attachmentIsVideo,
    "item-index": itemIndex,
  };
  return (
    <>
      <div
      ref={blockRef}
      className={`LinearBlockItem OverrideLinearBlockItem group`}
    >
      <Attributes applyTo={blockRef} attributes={attributes} />
      <Metadata applyTo={blockRef} metadata={block.metadata} />
      <div
        className={`LinearBlockItem--container OverrideLinearBlockItem--container`}
      >
        {hasImage && (
          <div
            className={`LinearBlockItemContainer--first-slot OverrideLinearBlockItemContainer--first-slot`}
          >
            <div
              className={`LinearBlockItem--attachment OverrideLinearBlockItem--attachment`}
            >
              <Attachment
                attachmentUrl={item.attachmentUrl}
                attachmentMediaType={item.attachmentMediaType}
                attachmentCaption={item.attachmentCaption}
                attachmentDescription={item.attachmentDescription}
                metadata={item.attachmentMetadata}
              />
            </div>
          </div>
        )}
        {hasText && (
          <div
            className={`LinearBlockItemContainer--second-slot OverrideLinearBlockItemContainer--second-slot`}
          >
            {hasTitle && (
              <Title
                size={blockIndex === 0 ? "2" : "3"}
                className={`LinearBlockItem--title OverrideLinearBlockItem--title`}
              >
                {item.title}
              </Title>
            )}
            {hasDescription && (
              <div className={`LinearBlockItem--description OverrideLinearBlockItem--description`} dangerouslySetInnerHTML={{ __html: item.description}} />
            )}
            {hasLink && (
              <WebsiteLink
                url={item.linkUrl}
                className={`TextLink__base-size OverrideTextLink__base-size`}
                metadata={item.linkMetadata}
              >
                {item.linkTitle}
                <svg className="DefaultLinkIcon__small-size OverrideDefaultLinkIcon__small-size" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </WebsiteLink>
            )}
          </div>
        )}
      </div>
    </div>
    <Separator size="4" />
    </>
  );
}

export default function LinearBlockItems({
  block,
  index,
}: LinearBlockItemsProps) {
  return block.items.map((item, bIndex) => (
    <LinearBlockItem
      key={`${index}-${bIndex}`}
      item={item}
      itemIndex={bIndex}
      block={block}
      blockIndex={index}
    />
  ));
}

export type LinearBlockItemsProps = {
  block: BlockUI;
  index: number;
};