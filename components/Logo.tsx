import Image from "next/image";

interface LogoProps {
  /** Size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

/** V9 Content Lab logo — transparent background */
export default function V9Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <Image
      src="/velocity-nine-content-lab.png"
      alt="V9 Content Lab"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
