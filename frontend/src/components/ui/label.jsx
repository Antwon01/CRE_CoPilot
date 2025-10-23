export function Label({ className = "", ...props }) {
  return <label className={`block text-sm font-medium mb-1 ${className}`} {...props} />;
}
