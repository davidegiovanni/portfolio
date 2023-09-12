import React, { useState, MouseEvent, useRef, useEffect } from 'react';
import { Attachment } from '~/models';
import { Attachment as AttachmentComponent } from './Attachment';
import { makeDivDraggable } from '~/utils/helpers';
import { motion, animate } from "framer-motion"

type AttachmentProps = {
  attachment: Attachment;
  align?: string;
  size?: string;
  dimensions?: string;
  dragConstraints: React.RefObject<HTMLDivElement>
};

function ZoomableImage(props: AttachmentProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = (e: MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (!isZoomed) {
      setIsZoomed(true);
    } else {
      setIsZoomed(false);
    }
  };

  useEffect(() => {
    const imageCard = document.getElementById(`imageCard`)
    if (imageCard) {
      animate(imageCard, { scale: isZoomed ? 4 : 1 }, { duration: 0.5, delay: 0.1, stiffness: 10, bounce: 10})
    }
  }, [isZoomed])

  return (
    <div
    id="imageCard"
      className={`image-container w-full h-full relative`}
      onDoubleClick={handleDoubleClick}
    >
      <motion.div drag={isZoomed} dragSnapToOrigin dragConstraints={isZoomed ? undefined : props.dragConstraints} ref={divRef} className='h-full w-full relative'>
        <AttachmentComponent attachment={{
          mediaType: 'image/',
          url: props.attachment.url,
          description: '',
          metadata: {}
        }}></AttachmentComponent>
      </motion.div>
    </div>
  );
};

export default ZoomableImage;
