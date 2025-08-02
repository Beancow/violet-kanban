"use server";
import { firebaseGetFirestore } from "@/lib/firebase/firebase-config";
import { Boards } from "@/types/appState.type";
import { addDoc, collection } from "firebase/firestore";
import { dataConverter } from "./dataConverter";
import * as sentry from "@sentry/nextjs";
import { hasPermission } from "./utils/hasPermission";

const db = firebaseGetFirestore();

export async function createBoardAction(data: FormData, orgId: string) {
  if (!hasPermission(orgId, "admin")) {
    return {
      success: false,
      error: new Error("User does not have permission to create boards"),
    };
  }
  const boardCollection = collection(db, `organizations/${orgId}/boards`);
  const newBoard = {
    name: data.get("name") as string,
    createdAt: new Date(),
    updatedAt: new Date(),
    orgId: orgId,
  };

  try {
    const boardDoc = await addDoc(boardCollection, newBoard);
    const boardData = boardDoc.withConverter(dataConverter<Boards>());

    return {
      success: true,
      data: {
        message: "Board created successfully, new Board ID: " + boardData.id,
        id: boardData.id,
      },
    };
  } catch (error) {
    sentry.captureException(error);
    console.error("Error creating board:", error);
    return {
      success: false,
      error: new Error("Failed to create board", { cause: error }),
    };
  }
}
