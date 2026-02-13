import Image from "next/image";

type LogoVariant = "header" | "compact" | "square" | "large" | "banner" | "small";

const variants: Record<LogoVariant, { src: string; width: number; height: number }> = {
  header:  { src: "/v9-content-lab-website-header.png", width: 450, height: 125 },
  compact: { src: "/v9-content-lab-compact-header.png", width: 300, height: 83 },
  square:  { src: "/v9-content-lab-square.png",         width: 300, height: 300 },
  large:   { src: "/v9-content-lab-large-header.png",   width: 600, height: 167 },
  banner:  { src: "/v9-content-lab-banner.png",         width: 900, height: 250 },
  small:   { src: "/v9-content-lab-small.png",          width: 180, height: 50 },
};

interface LogoProps {
  /** Which logo variant to use */
  variant?: LogoVariant;
  /** Display width — height auto-scales to keep aspect ratio */
  width?: number;
  /** Additional CSS classes */
  className?: string;
}

export default function V9Logo({ variant = "compact", width, className = "" }: LogoProps) {
  const v = variants[variant];
  const w = width ?? v.width;
  const h = Math.round((w / v.width) * v.height);

  return (
    <Image
      src={v.src}
      alt="V9 Content Lab"
      width={w}
      height={h}
      className={className}
      priority
    />
  );
}
