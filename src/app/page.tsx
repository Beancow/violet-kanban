import { Button } from "@radix-ui/themes";
import Link from "next/link";

export default function Home() {
 
  return (
    <main>
    <h1>Welcome to Avery's Kanban Board!</h1>
    <p>This is a simple Kanban board application built with Next.js and Firebase.</p>
    <p>To get started, please log in to see your boards.</p>

    <Button variant="solid" size="2" color="green">
        <Link href="/user">Login</Link>
    </Button>
    </main>
  );
}
