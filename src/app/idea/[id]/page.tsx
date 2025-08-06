"use client";

import { useRouter } from "next/navigation";

export default function IdeaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-primary">
        📹 Full Idea Details (ID: {params.id})
      </h1>

      <p className="text-lg leading-relaxed text-gray-800">
        This is where the full content of the selected idea will go...
      </p>

      <div className="mt-10 flex gap-4">
        <button
          className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90"
          onClick={() => navigator.clipboard.writeText("Mock video idea title")}
        >
          📋 Copy Mock Title
        </button>

        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-primary"
        >
          ← Back to Search
        </button>
      </div>
    </main>
  );
}
