"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface FormShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function FormShell({
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}: FormShellProps) {
  return (
    <Card className={cn("border border-brand-muted/40 shadow-soft bg-brand-surface", className)}>
      <CardHeader>
        <CardTitle className="text-brand-primary text-2xl">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-brand-muted text-base">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className={cn("space-y-6", contentClassName)}>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}

