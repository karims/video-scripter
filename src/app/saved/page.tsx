"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Idea {
  id: string;
  title: string;
  description?: string;
}

export default function SavedIdeasPage() {
  const [savedIdeas, setSavedIdeas] = useState<Idea[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    setUserEmail(email);

    if (email) {
      const allSaved = JSON.parse(sessionStorage.getItem("savedIdeas") || "{}");
      const userIdeas = allSaved[email] || [];
      setSavedIdeas(userIdeas);
    }
  }, []);

  const handleUnsave = (id: string) => {
    if (!userEmail) return;

    const allSaved = JSON.parse(sessionStorage.getItem("savedIdeas") || "{}");
    const userIdeas: Idea[] = allSaved[userEmail] || [];

    const updatedIdeas = userIdeas.filter((idea) => idea.id !== id);
    allSaved[userEmail] = updatedIdeas;

    sessionStorage.setItem("savedIdeas", JSON.stringify(allSaved));
    setSavedIdeas(updatedIdeas);
  };

  if (!userEmail) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10 text-center">
        <h2 className="text-xl font-semibold mb-2">You're not logged in</h2>
        <p className="text-gray-600 mb-4">Please log in to view your saved ideas.</p>
        <button
          className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90"
          onClick={() => router.push("/login")}
        >
          Go to Login
        </button>
      </main>
    );
  }

  if (savedIdeas.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10 text-center">
        <h2 className="text-xl font-semibold mb-2">No Saved Ideas Yet</h2>
        <p className="text-gray-600 mb-4">Start saving ideas to see them here!</p>
        <button
          className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90"
          onClick={() => router.push("/")}
        >
          ← Back to Search
        </button>
      </main>
    );
  }

  return (
    <main className="w-full max-w-2xl px-4 py-10 mx-auto">
      <h2 className="text-2xl font-semibold text-primary mb-6">Your Saved Ideas</h2>

      <div className="divide-y divide-gray-200">
        {savedIdeas.map((idea, idx) => (
          <div
            key={idea.id}
            className="py-5 group transition-all flex items-start justify-between"
          >
            <div
              className="cursor-pointer"
              onClick={() => router.push(`/idea/${idea.id}`)}
            >
              <h3 className="text-lg font-bold text-black group-hover:underline underline-offset-4 decoration-primary transition">
                {idx + 1}. {idea.title}
              </h3>
              {idea.description && (
                <p className="text-gray-600 mt-1 text-sm leading-relaxed group-hover:text-gray-700 transition">
                  {idea.description}
                </p>
              )}
            </div>

            <button
              title="Remove from Saved"
              onClick={() => handleUnsave(idea.id)}
              className="text-red-500 text-lg hover:scale-110 transition ml-4"
            >
              💔
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
