export default async function StudyPackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Study Pack</h1>
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          Study pack view for <span className="font-mono text-sm">{id}</span> will be available when AI generation is implemented.
        </p>
      </div>
    </div>
  );
}
