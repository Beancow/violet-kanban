import { deleteListServerAction } from "@/lib/firebase/listServerActions";
import { getAuthAndOrgContext } from "@/lib/serverUtils";

export async function POST(request: Request) {
  try {
    const { orgId } = await getAuthAndOrgContext(request);
    const { boardId, listId } = await request.json();
    await deleteListServerAction(orgId, boardId, listId);
    return new Response("List deleted", { status: 200 });
  } catch (error) {
    console.error("Error deleting list:", error);
    return new Response("Error deleting list", { status: 500 });
  }
}
