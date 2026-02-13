import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  /** Show full logo with text, or just the icon mark */
  variant?: 'full' | 'icon';
  /** Size in pixels (applies to width for full, both for icon) */
  size?: number;
  /** Link destination, defaults to /dashboard */
  href?: string;
  /** Additional CSS classes */
  className?: string;
}

export default function Logo({
  variant = 'full',
  size = 40,
  href = '/dashboard',
  className = '',
}: LogoProps) {
  const logo = (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src={variant === 'full' ? '/logo.svg' : '/logo.svg'}
        alt="V9 Content Lab"
        width={size}
        height={size}
        className="rounded-lg"
        priority
      />
      {variant === 'full' && (
        <div className="flex flex-col">
          <span className="text-base font-bold leading-tight">Content Lab</span>
          <span className="text-[10px] text-base-content/50 leading-tight">by V9 Labs</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{logo}</Link>;
  }

  return logo;
}
