export default async function Page({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;

  
  if (!boardId) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <h1>{boardId}</h1>
      <p>This is the user boards page content.</p>
    </div>
  );
}
