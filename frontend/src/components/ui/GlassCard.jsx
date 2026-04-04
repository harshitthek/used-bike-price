import { motion } from "framer-motion";

export function GlassCard({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-8 pt-10 shadow-2xl backdrop-blur-2xl inset-0 ${className}`}
    >
      <div className="absolute inset-x-0 -top-px mx-auto h-px w-1/2 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-40 shadow-[0_0_15px_var(--color-accent)]" />
      <div className="absolute inset-x-0 -bottom-px mx-auto h-px w-1/2 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-10" />
      <div className="absolute inset-y-0 -left-px my-auto w-px h-1/2 bg-gradient-to-b from-transparent via-[var(--color-accent)] to-transparent opacity-10" />
      <div className="absolute inset-y-0 -right-px my-auto w-px h-1/2 bg-gradient-to-b from-transparent via-[var(--color-accent)] to-transparent opacity-10" />
      
      {children}
    </motion.div>
  );
}
