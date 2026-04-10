import {
  BanIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
  EyeIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<
  string,
  { icon: typeof CircleIcon; className: string }
> = {
  BACKLOG: { icon: CircleDashedIcon, className: "text-muted-foreground" },
  TODO: { icon: CircleIcon, className: "text-muted-foreground" },
  IN_PROGRESS: { icon: CircleDotIcon, className: "text-yellow-500" },
  IN_REVIEW: { icon: EyeIcon, className: "text-blue-500" },
  DONE: { icon: CheckCircle2Icon, className: "text-green-500" },
  CANCELLED: { icon: BanIcon, className: "text-red-500" },
}

export function StatusIcon({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.BACKLOG!
  const Icon = config.icon
  return <Icon className={cn("size-4", config.className, className)} />
}
