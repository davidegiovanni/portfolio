import React, { useState, MouseEvent, useRef, useEffect } from 'react';
import { Attachment } from '~/models';
import { Attachment as AttachmentComponent } from './Attachment';
import { makeDivDraggable } from '~/utils/helpers';

type AttachmentProps = {
  attachment: Attachment;
  align?: string;
  size?: string;
  dimensions?: string;
};

function ZoomableImage(props: AttachmentProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const divRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = (e: MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (!isZoomed) {
      setIsZoomed(true);
    } else {
      setIsZoomed(false);
      setIsDragging(false);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {

    e.preventDefault();
    setIsDragging(true);
    setInitialPosition({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setPosition({ x: e.clientX - initialPosition.x, y: e.clientY - initialPosition.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`image-container ${isZoomed ? "scale-[2] lg:scale-[4]" : ""} w-full h-full relative`}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div ref={divRef} style={{
        transform: isZoomed ? `translate(${position.x}px, ${position.y}px)` : 'none',
      }} className='h-full w-full relative'>
        <AttachmentComponent attachment={{
          id: '',
          mediaType: 'image/',
          url: props.attachment.url,
          description: ''
        }}></AttachmentComponent>
      </div>
    </div>
  );
};

export default ZoomableImage;
