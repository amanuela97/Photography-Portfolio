"use client";

import { Activity, Suspense, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

interface AdminTab {
  value: string;
  label: string;
  content: ReactNode;
}

interface AdminTabsProps {
  sections: AdminTab[];
  defaultValue?: string;
}

export function AdminTabs({ sections, defaultValue }: AdminTabsProps) {
  const initialValue = defaultValue ?? sections[0]?.value ?? "";
  const [activeTab, setActiveTab] = useState(initialValue);

  return (
    <Tabs className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="flex flex-wrap gap-2 bg-brand-surface p-2 shadow-soft">
        {sections.map((section) => (
          <TabsTrigger
            role="button"
            key={section.value}
            value={section.value}
            className="px-4 py-2 data-[state=active]:bg-brand-primary data-[state=active]:text-brand-contrast"
          >
            {section.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {sections.map((section) => (
        <Activity
          key={section.value}
          mode={activeTab === section.value ? "visible" : "hidden"}
        >
          <TabsContent value={section.value} forceMount className="space-y-6">
            <Suspense fallback={<SectionSkeleton />}>
              {section.content}
            </Suspense>
          </TabsContent>
        </Activity>
      ))}
    </Tabs>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-1/3 bg-brand-muted/40" />
      <Skeleton className="h-64 rounded-2xl bg-brand-muted/20" />
    </div>
  );
}
