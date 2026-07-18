import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

export function MagicCard({
  children,
  className,
  gradientSize = 250,
  gradientColor = "rgba(99, 102, 241, 0.15)",
  gradientOpacity = 0.8,
  ...props
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e) => {
      const { left, top } = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    },
    [mouseX, mouseY]
  );

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex size-full overflow-hidden rounded-2xl bg-zinc-950/40 border border-white/10 text-zinc-100 backdrop-blur-xl",
        className
      )}
      {...props}
    >
      <div className="relative z-10 w-full h-full">{children}</div>
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)
          `,
          opacity: gradientOpacity,
        }}
      />
    </div>
  );
}
