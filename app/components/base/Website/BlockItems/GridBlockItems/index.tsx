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

type ItemProps = {
  item: BlockItemUI;
  block: BlockUI;
  itemIndex: number;
  blockIndex: number;
};

function GridBlockItem({ item, itemIndex, blockIndex, block }: ItemProps) {
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

    "has-item-image": hasImage,
    "is-item-video": attachmentIsVideo,
    "item-index": itemIndex,
  };
  return (
    <div ref={blockRef} className={`GridBlockItem OverrideGridBlockItem group`}>
      <Attributes applyTo={blockRef} attributes={attributes} />
      <Metadata applyTo={blockRef} metadata={block.metadata} />
      <div
        className={`GridBlockItem--container OverrideGridBlockItem--container`}
      >
        {hasImage && (
          <div
            className={`GridBlockItemContainer--first-slot OverrideGridBlockItemContainer--first-slot`}
          >
            <div
              className={`GridBlockItem--attachment OverrideGridBlockItem--attachment`}
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
            className={`GridBlockItemContainer--second-slot OverrideGridBlockItemContainer--second-slot`}
          >
            {hasTitle && (
              <Title
                size={blockIndex === 0 ? "2" : "3"}
                className={`GridBlockItem--title OverrideGridBlockItem--title`}
              >
                {item.title}
              </Title>
            )}
            {hasDescription && (
              <div className={`GridBlockItem--description OverrideGridBlockItem--description`} dangerouslySetInnerHTML={{ __html: item.description}} />
            )}
            {hasLink && (
              <WebsiteLink
                url={item.linkUrl}
                className={`GridBlockItem--link OverrideGridBlockItem--link`}
                metadata={item.linkMetadata}
              >
                {item.linkTitle}
              </WebsiteLink>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GridBlockItems({ block, index }: GridBlockItemsProps) {
  return block.items.map((item, bIndex) => (
    <GridBlockItem
      key={`${index}-${bIndex}`}
      item={item}
      itemIndex={bIndex}
      block={block}
      blockIndex={index}
    />
  ));
}

export type GridBlockItemsProps = {
  block: BlockUI;
  index: number;
};
