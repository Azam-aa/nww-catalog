export function Badge({ children, variant = "default" }) {
  const baseStyles = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  
  const variants = {
    default: "bg-surface-secondary dark:bg-dark-secondary text-ink-secondary dark:text-gray-300 border border-surface-border dark:border-dark-border",
    success: "bg-brand-100 text-brand-700 dark:bg-brand-700/20 dark:text-brand-500",
  };

  return (
    <span className={`${baseStyles} ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}
