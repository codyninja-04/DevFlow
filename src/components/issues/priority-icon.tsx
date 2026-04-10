import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  MinusIcon,
  SignalHighIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

const PRIORITY_CONFIG: Record<
  string,
  { icon: typeof MinusIcon; className: string }
> = {
  NO_PRIORITY: { icon: MinusIcon, className: "text-muted-foreground" },
  URGENT: { icon: AlertTriangleIcon, className: "text-red-500" },
  HIGH: { icon: SignalHighIcon, className: "text-orange-500" },
  MEDIUM: { icon: ArrowUpIcon, className: "text-yellow-500" },
  LOW: { icon: ArrowDownIcon, className: "text-blue-500" },
}

export function PriorityIcon({
  priority,
  className,
}: {
  priority: string
  className?: string
}) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.NO_PRIORITY!
  const Icon = config.icon
  return <Icon className={cn("size-4", config.className, className)} />
}
