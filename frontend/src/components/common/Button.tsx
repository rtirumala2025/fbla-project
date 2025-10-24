import React, { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';

function cn(
  ...classes: Array<
    | string
    | undefined
    | null
    | false
    | Record<string, boolean>
    | (string | undefined | null | false | Record<string, boolean>)[]
  >
): string {
  const result: string[] = [];
  const push = (c: any) => {
    if (!c) return;
    if (typeof c === 'string') result.push(c);
    else if (Array.isArray(c)) c.forEach(push);
    else if (typeof c === 'object')
      Object.entries(c).forEach(([k, v]) => v && result.push(k));
  };
  classes.forEach(push);
  return result.join(' ');
}

type ButtonBaseProps = {
  variant?: 'primary' | 'secondary' | 'white';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  motionProps?: MotionProps;
};

type AnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
  href: string;
  to?: never;
};

type LinkProps = Omit<RouterLinkProps, keyof ButtonBaseProps> & {
  to: string;
  href?: never;
};

type ButtonElementProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
  to?: never;
  href?: never;
};

type ButtonProps = ButtonBaseProps & (AnchorProps | LinkProps | ButtonElementProps);

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      children,
      className,
      asChild = false,
      motionProps,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none';

    const variantClasses = {
      primary:
        'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700',
      secondary:
        'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700',
      white: 'bg-white text-slate-900 hover:bg-slate-100',
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-2.5 text-base',
      lg: 'px-8 py-3 text-lg',
    };

    const buttonClasses = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    // Safely handle motionProps (may be undefined and may have various shapes)
    const mp = motionProps ?? ({} as MotionProps);
    // Use `any` for destructuring to avoid TS shape errors for whileHover/whileTap
    const { whileHover, whileTap, ...restMotionProps } = mp as any;

    // Ensure we have a default whileTap while keeping user's passed value if provided
    const motionConfig = {
      ...(restMotionProps || {}),
      whileHover,
      whileTap: whileTap ?? { scale: 0.98 },
    } as MotionProps;

    if (asChild) {
      return (
        <motion.span className={buttonClasses} {...(motionConfig as any)}>
          {children}
        </motion.span>
      );
    }

    // React Router Link
    if ('to' in props && (props as LinkProps).to) {
      const { to, ...restProps } = props as LinkProps;
      return (
        <motion.span className="inline-flex" {...(motionConfig as any)}>
          <RouterLink
            to={to}
            className={buttonClasses}
            ref={ref as React.Ref<HTMLAnchorElement>}
            {...(restProps as Omit<LinkProps, 'to'>)}
          >
            {children}
          </RouterLink>
        </motion.span>
      );
    }

    // Regular <a> tag
    if ('href' in props && (props as AnchorProps).href) {
      const { href, ...restProps } = props as AnchorProps;
      const isExternal = href.startsWith('http');
      return (
        <motion.a
          className={buttonClasses}
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...(motionConfig as any)}
          {...(restProps as Omit<AnchorProps, 'href'>)}
        >
          {children}
        </motion.a>
      );
    }

    // Default <button>
    const buttonProps = props as ButtonElementProps;
    return (
      <motion.button
        className={buttonClasses}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...(motionConfig as any)}
        {...buttonProps}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };