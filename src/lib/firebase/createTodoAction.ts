"use server";

import { firebaseGetFirestore } from "@/lib/firebase/firebase-config";
import { addDoc, collection } from "firebase/firestore";
import { dataConverter } from "./dataConverter";
import * as sentry from "@sentry/nextjs";
import { hasPermission } from "./utils/hasPermission";

const db = firebaseGetFirestore();

export async function createTodoAction(
  data: FormData,
  orgId: string,
  boardId: string
) {
  if (!hasPermission(orgId, "admin")) {
    return {
      success: false,
      error: new Error("User does not have permission to create todos"),
    };
  }

  const todoDoc = collection(
    db,
    `organizations/${orgId}/boards/${boardId}/todos`
  );

  const newTodo = {
    title: data.get("title") as string,
    description: data.get("description") as string,
    createdAt: new Date(),
    updatedAt: new Date(),
    orgId: orgId,
    boardId: boardId,
  };

  try {
    const todoData = await addDoc(todoDoc, newTodo);
    const todo = todoData.withConverter(dataConverter<FormData>());
    return {
      success: true,
      data: {
        message: "Todo created successfully, new Todo ID: " + todo.id,
        id: todo.id,
      },
    };
  } catch (error) {
    sentry.captureException(error);
    console.error("Error creating todo:", error);
    return {
      success: false,
      error: new Error("Failed to create todo", { cause: error }),
    };
  }
}
