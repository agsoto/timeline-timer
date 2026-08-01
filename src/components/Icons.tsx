import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const Icon = ({ children, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {children}
  </svg>
);

export const PlayIcon = (props: IconProps) => <Icon {...props}><path d="m8 5 11 7-11 7Z" /></Icon>;
export const PauseIcon = (props: IconProps) => <Icon {...props}><path d="M9 5v14M15 5v14" /></Icon>;
export const RestartIcon = (props: IconProps) => <Icon {...props}><path d="M4.5 9A8 8 0 1 1 4 14" /><path d="M4.5 4v5h5" /></Icon>;
export const EditIcon = (props: IconProps) => <Icon {...props}><path d="m4 16-.8 4 4-.8L18.5 7.9l-3.4-3.4Z" /><path d="m13.8 5.8 3.4 3.4" /></Icon>;
export const SettingsIcon = (props: IconProps) => <Icon {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></Icon>;
export const BellIcon = (props: IconProps) => <Icon {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></Icon>;
export const LockIcon = (props: IconProps) => <Icon {...props}><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Icon>;
export const UnlockIcon = (props: IconProps) => <Icon {...props}><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 7.4-2" /></Icon>;
export const CloseIcon = (props: IconProps) => <Icon {...props}><path d="m6 6 12 12M18 6 6 18" /></Icon>;
export const CompactIcon = (props: IconProps) => <Icon {...props}><path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5" /></Icon>;
export const ExpandIcon = (props: IconProps) => <Icon {...props}><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" /></Icon>;
export const ArrowIcon = (props: IconProps) => <Icon {...props}><path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" /></Icon>;
