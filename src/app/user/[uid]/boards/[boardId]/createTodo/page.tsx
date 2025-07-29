import Form from "next/form";
import { createTodo } from '@/app/actions'
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ uid: string, boardId: string }> }) {
    const { uid, boardId } = await params;

    async function handleSubmit(data: FormData) {
        "use server";
        await createTodo(data, uid, boardId);
        redirect(`/user/${uid}/boards/${boardId}/todos`);
    }
    
    return (
        <div>
            <h1>Create Todo</h1>
            <p>Fill out the form below to create a new todo item.</p>
            <Form action={handleSubmit}>
                <div>
                    <label htmlFor="title">Title:</label>
                    <input type="text" name="title" id="title" required />
                </div>
                <div>
                    <label htmlFor="description">Description:</label>
                    <textarea name="description" id="description" required></textarea>
                </div>
                <button type="submit">Create Todo</button>
            </Form>
        </div>
    );
}
