import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface StudyPackCardProps {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export default function StudyPackCard({ id, title, status, createdAt }: StudyPackCardProps) {
  return (
    <Link href={`/study-packs/${id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium line-clamp-1">{title}</CardTitle>
            <Badge variant={status === "ready" ? "default" : "secondary"}>
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Created {new Date(createdAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
