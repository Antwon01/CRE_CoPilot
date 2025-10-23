export function Button({ className = "", variant, ...props }) {
  const base = "inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium border";
  const styles = variant === "outline"
    ? "bg-white border-gray-300 hover:bg-gray-50"
    : "bg-black text-white border-black hover:opacity-90";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
