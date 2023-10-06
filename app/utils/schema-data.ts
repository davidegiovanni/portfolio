import { useEffect } from "react";

export const StructuredData = ({ schema }: { schema: Record<string, any>}) => {
    useEffect(() => {
      // Create a new script element
      const script = document.createElement('script');
      script.type = 'application/ld+json';
  
      // Serialize your Schema.org data to JSON and set it as innerHTML
      script.innerHTML = JSON.stringify(schema);
  
      // Append the script element to the document head
      document.head.appendChild(script);
  
      // Clean up by removing the script element when the component unmounts
      return () => {
        document.head.removeChild(script);
      };
    }, [schema]);
  
    return null; // This component doesn't render anything visible in the UI
  };