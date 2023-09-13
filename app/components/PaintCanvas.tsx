import React, { useState, useRef, useEffect } from 'react';

const MSPaint = (props: { isShowingCanvas: boolean}) => {
const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [color, setColor] = useState('black');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
  }, []);

  const handleMouseDown = () => {
    setIsPainting(true);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    draw(event.clientX, event.clientY);
  };

  const handleMouseUp = () => {
    stopPainting();
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    setIsPainting(true);
    const touch = event.touches[0];
    draw(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = event.touches[0];
    draw(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    stopPainting();
  };

  const draw = (clientX: number, clientY: number) => {
    if (!isPainting) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const x = clientX - canvas.offsetLeft;
    const y = clientY - canvas.offsetTop;

    context.strokeStyle = color;
    context.lineWidth = 5;
    context.lineTo(x, y);
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const stopPainting = () => {
    setIsPainting(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.beginPath();
  };

  const setColorHandler = (newColor: string) => {
    setColor(newColor);
  };

  return (
    <div data-showing={props.isShowingCanvas} className='fixed z-30 opacity-0 pointer-events-none data-[showing=true]:opacity-100 inset-0 data-[showing=true]:pointer-events-auto'>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseOut={stopPainting}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ width: '100%', height: '100%' }}
      />
      <div data-showing={props.isShowingCanvas} className='absolute transition-all -translate-y-12 data-[showing=true]:delay-200 data-[showing=true]:duration-300 data-[showing=true]:ease-in-out data-[showing=true]:translate-y-0 left-0 top-0 z-20 inline-flex flex-wrap items-center gap-2 lg:gap-4 p-4 bg-white'>
        <button onClick={() => setColorHandler('black')} data-selected={color === "black"} className='bg-black w-4 h-4 rounded-full data-[selected=true]:ring-black data-[selected=true]:ring data-[selected=true]:ring-offset-2' aria-label="Black Paint"></button>
        <button onClick={() => setColorHandler('blue')} data-selected={color === "blue"} className='bg-blue-500 w-4 h-4 rounded-full data-[selected=true]:ring-blue-500 data-[selected=true]:ring-2 data-[selected=true]:ring-offset-2' aria-label="Red Paint"></button>
        <button onClick={() => setColorHandler('red')} data-selected={color === "red"} className='bg-red-500 w-4 h-4 rounded-full data-[selected=true]:ring-red-500 data-[selected=true]:ring-2 data-[selected=true]:ring-offset-2' aria-label="Red Paint"></button>
        <button onClick={() => setColorHandler('green')} data-selected={color === "green"} className='bg-green-500 w-4 h-4 rounded-full data-[selected=true]:ring-green-500 data-[selected=true]:ring-2 data-[selected=true]:ring-offset-2' aria-label="Red Paint"></button>
        <button onClick={() => setColorHandler('purple')} data-selected={color === "purple"} className='bg-purple-500 w-4 h-4 rounded-full data-[selected=true]:ring-purple-500 data-[selected=true]:ring-2 data-[selected=true]:ring-offset-2' aria-label="Red Paint"></button>
        <button onClick={() => setColorHandler('orange')} data-selected={color === "orange"} className='bg-orange-500 w-4 h-4 rounded-full data-[selected=true]:ring-orange-500 data-[selected=true]:ring-2 data-[selected=true]:ring-offset-2' aria-label="Red Paint"></button>
        <button onClick={() => setColorHandler('pink')} data-selected={color === "pink"} className='bg-pink-500 w-4 h-4 rounded-full data-[selected=true]:ring-pink-500 data-[selected=true]:ring-2 data-[selected=true]:ring-offset-2' aria-label="Red Paint"></button>
        <button onClick={() => setColorHandler('yellow')} data-selected={color === "yellow"} className='bg-yellow-500 w-4 h-4 rounded-full data-[selected=true]:ring-yellow-500 data-[selected=true]:ring-2 data-[selected=true]:ring-offset-2' aria-label="Red Paint"></button>
        <button onClick={() => setColorHandler('gray')} data-selected={color === "gray"} className='bg-gray-500 w-4 h-4 rounded-full data-[selected=true]:ring-gray-500 data-[selected=true]:ring-2 data-[selected=true]:ring-offset-2' aria-label="Red Paint"></button>
        <button onClick={() => setColorHandler('white')} data-selected={color === "white"} className='bg-white border w-4 h-4 rounded-full data-[selected=true]:ring-gray-200 data-[selected=true]:ring-2 data-[selected=true]:ring-offset-2' aria-label="Red Paint"></button>
        <button onClick={clearCanvas} aria-label='Clear Canvas'>
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.60913 0.0634287C4.39082 0.0088505 4.16575 0.12393 4.08218 0.332867L3.1538 2.6538L0.832866 3.58218C0.702884 3.63417 0.604504 3.7437 0.566705 3.87849C0.528906 4.01329 0.555994 4.158 0.639992 4.26999L2.01148 6.09864L1.06343 9.89085C1.00944 10.1068 1.12145 10.3298 1.32691 10.4154L4.20115 11.613L5.62557 13.7496C5.73412 13.9124 5.93545 13.9864 6.12362 13.9327L9.62362 12.9327C9.62988 12.9309 9.63611 12.929 9.64229 12.9269L12.6423 11.9269C12.7923 11.8769 12.905 11.7519 12.9393 11.5976L13.9393 7.09761C13.9776 6.92506 13.9114 6.74605 13.77 6.63999L11.95 5.27499V2.99999C11.95 2.82955 11.8537 2.67373 11.7012 2.5975L8.70124 1.0975C8.67187 1.08282 8.64098 1.07139 8.60913 1.06343L4.60913 0.0634287ZM11.4323 6.01173L12.7748 7.01858L10.2119 9.15429C10.1476 9.20786 10.0995 9.2783 10.0731 9.35769L9.25382 11.8155L7.73849 10.8684C7.52774 10.7367 7.25011 10.8007 7.11839 11.0115C6.98667 11.2222 7.05074 11.4999 7.26149 11.6316L8.40341 12.3453L6.19221 12.9771L4.87441 11.0004C4.82513 10.9265 4.75508 10.8688 4.67307 10.8346L2.03046 9.73352L2.85134 6.44999H4.99999C5.24852 6.44999 5.44999 6.24852 5.44999 5.99999C5.44999 5.75146 5.24852 5.54999 4.99999 5.54999H2.72499L1.7123 4.19974L3.51407 3.47903L6.35769 4.4269C6.53655 4.48652 6.73361 4.42832 6.85138 4.28111L8.62413 2.06518L11.05 3.27811V5.19533L8.83287 6.08218C8.70996 6.13134 8.61494 6.23212 8.57308 6.35769L8.07308 7.85769C7.99449 8.09346 8.12191 8.34831 8.35769 8.4269C8.59346 8.50549 8.84831 8.37807 8.9269 8.14229L9.3609 6.84029L11.4323 6.01173ZM7.71052 1.76648L6.34462 3.47386L4.09505 2.724L4.77192 1.03183L7.71052 1.76648ZM10.2115 11.7885L12.116 11.1537L12.7745 8.19034L10.8864 9.76374L10.2115 11.7885Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
        </button>
      </div>
    </div>
  );
};

export default MSPaint;
