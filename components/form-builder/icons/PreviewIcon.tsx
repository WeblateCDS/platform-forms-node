import React from "react";
export const PreviewIcon = ({ className, title }: { className?: string; title?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24"
    width="24"
    className={className}
    viewBox="0 0 24 24"
    focusable="false"
    aria-hidden={title ? false : true}
    role={title ? "img" : "presentation"}
  >
    {title && <title>{title}</title>}
    <path d="M4.5 21c-.418 0-.77-.145-1.063-.438A1.442 1.442 0 0 1 3 19.5v-15c0-.418.145-.77.438-1.063A1.442 1.442 0 0 1 4.5 3h15c.418 0 .77.145 1.063.438.292.292.437.644.437 1.062v15c0 .418-.145.77-.438 1.063A1.442 1.442 0 0 1 19.5 21Zm0-1.5h15v-13h-15Zm7.5-2.625c-1.332 0-2.523-.36-3.574-1.074A6.297 6.297 0 0 1 6.125 13a6.297 6.297 0 0 1 2.3-2.8C9.478 9.483 10.669 9.124 12 9.124c1.332 0 2.523.36 3.574 1.074A6.297 6.297 0 0 1 17.875 13a6.297 6.297 0 0 1-2.3 2.8c-1.052.716-2.243 1.075-3.575 1.075Zm0-1.25c.95 0 1.824-.234 2.625-.7A4.963 4.963 0 0 0 16.5 13a4.963 4.963 0 0 0-1.875-1.926c-.8-.465-1.676-.699-2.625-.699-.95 0-1.824.234-2.625.7A4.963 4.963 0 0 0 7.5 13a4.963 4.963 0 0 0 1.875 1.926c.8.465 1.676.699 2.625.699Zm0-1.375c-.352 0-.645-.121-.887-.363A1.202 1.202 0 0 1 10.75 13c0-.352.121-.645.363-.887s.535-.363.887-.363.645.121.887.363.363.535.363.887-.121.645-.363.887a1.202 1.202 0 0 1-.887.363Zm0 0" />
  </svg>
);