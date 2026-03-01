"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudyPackItem {
  id: string;
  title: string;
  status: string;
  docTitle: string;
  createdAt: string;
}

export default function StudyPackGrid({ packs }: { packs: StudyPackItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {packs.map((sp, index) => (
        <motion.div
          key={sp.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.06,
            duration: 0.4,
            ease: [0.25, 0.4, 0.25, 1],
          }}
        >
          <Link href={`/study-packs/${sp.id}`}>
            <Card className="h-full hover:shadow-lg hover:border-orange-500/10 transition-all duration-200 cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2 group-hover:text-orange-500 transition-colors">
                    {sp.title}
                  </CardTitle>
                  <Badge
                    variant={
                      sp.status === "ready"
                        ? "default"
                        : sp.status === "error"
                          ? "destructive"
                          : "secondary"
                    }
                    className="shrink-0"
                  >
                    {sp.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{sp.docTitle}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {sp.createdAt}
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
