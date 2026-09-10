import type { ComponentType, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// Domain 1: Security and Risk Management
function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

// Domain 2: Asset Security
function VaultIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 8.5v0.01M15.5 12h0.01M12 15.5v0.01M8.5 12h0.01" />
    </svg>
  )
}

// Domain 3: Security Architecture and Engineering
function BlueprintIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20V8l8-5 8 5v12" />
      <path d="M9 20v-6h6v6" />
      <path d="M4 8h16" />
    </svg>
  )
}

// Domain 4: Communication and Network Security
function NetworkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="M8 7.5L11 15.5M16 7.5L13 15.5M8.5 6H15.5" />
    </svg>
  )
}

// Domain 5: Identity and Access Management
function KeyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M17 6l2 2M14 9l2 2" />
    </svg>
  )
}

// Domain 6: Security Assessment and Testing
function ChecklistMagnifierIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="3" width="12" height="16" rx="1.5" />
      <path d="M7.5 8h5M7.5 11.5h3" />
      <circle cx="15.5" cy="15.5" r="3.5" />
      <path d="M18 18l2.5 2.5" />
    </svg>
  )
}

// Domain 7: Security Operations
function MonitorPulseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="13" rx="1.5" />
      <path d="M8 21h8M12 17v4" />
      <path d="M6 11l3-3 2 4 3-6 2 5h2" />
    </svg>
  )
}

// Domain 8: Software Development Security
function CodeBracketsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4L4 12l5 8M15 4l5 8-5 8" />
    </svg>
  )
}

// Keyed by section slug so each CISSP domain gets a consistent icon once
// it's seeded with a matching slug. Domains 2-8 aren't built out yet, but
// the keys are here now so nothing needs to change here when they are.
const ICONS_BY_SLUG: Record<string, ComponentType<IconProps>> = {
  'security-and-risk-management': ShieldIcon,
  'asset-security': VaultIcon,
  'security-architecture-and-engineering': BlueprintIcon,
  'communication-and-network-security': NetworkIcon,
  'identity-and-access-management': KeyIcon,
  'security-assessment-and-testing': ChecklistMagnifierIcon,
  'security-operations': MonitorPulseIcon,
  'software-development-security': CodeBracketsIcon,
}

export function DomainIcon({
  slug,
  ...props
}: { slug?: string | null } & IconProps) {
  const Icon = (slug && ICONS_BY_SLUG[slug]) || ShieldIcon
  return <Icon {...props} />
}