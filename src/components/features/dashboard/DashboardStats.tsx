import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStatsProps {
  documentCount: number;
  studyPackCount: number;
  quizCount: number;
}

export default function DashboardStats({ documentCount, studyPackCount, quizCount }: DashboardStatsProps) {
  const stats = [
    { label: "Documents", value: documentCount, icon: "📄" },
    { label: "Study Packs", value: studyPackCount, icon: "📚" },
    { label: "Quizzes Taken", value: quizCount, icon: "✅" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <span className="text-2xl">{stat.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
