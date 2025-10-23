import React from "react";
export function Dialog({ children }) { return <>{children}</>; }
export function DialogTrigger({ asChild, children }) { return children; }
export function DialogHeader({ children }) { return <div className="mb-2">{children}</div>; }
export function DialogTitle({ children }) { return <h3 className="text-lg font-semibold">{children}</h3>; }
export function DialogContent({ className = "", children }) {
  return <div className={`border rounded-2xl p-4 bg-white ${className}`}>{children}</div>;
}
