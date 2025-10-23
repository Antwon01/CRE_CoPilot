import React from "react";
export function Tabs({ defaultValue, children }) {
  const [value, setValue] = React.useState(defaultValue);
  return React.Children.map(children, ch => React.cloneElement(ch, { value, setValue }));
}
export function TabsList({ children, value, setValue }) {
  return <div className="inline-flex gap-2 border rounded-xl p-1">{React.Children.map(children, ch => React.cloneElement(ch, { value, setValue }))}</div>;
}
export function TabsTrigger({ value: myVal, children, value, setValue }) {
  const active = myVal === value;
  return (
    <button
      className={`px-3 py-1 rounded-lg text-sm ${active ? "bg-black text-white" : "bg-white border"}`}
      onClick={() => setValue(myVal)}
    >
      {children}
    </button>
  );
}
export function TabsContent({ value: myVal, children, value }) {
  if (value !== myVal) return null;
  return <div className="mt-3">{children}</div>;
}
