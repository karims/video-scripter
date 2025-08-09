"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mockIdeas = [
  {
    title: "10-Minute Fitness Routine for Busy Creators",
    description: "Quick & effective workout without equipment.",
  },
  {
    title: "Day in the Life: Fitness Influencer Edition",
    description: "From smoothies to squats, a full vlog idea.",
  },
  {
    title: "Beginner Home Workout That Actually Works",
    description: "Easy, safe and results-driven exercises.",
  },
  {
    title: "My 30-Day Body Transformation Story",
    description: "Personal and relatable content for engagement.",
  },
  {
    title: "5 Fitness Myths That Are Wasting Your Time",
    description: "Bust myths and build trust with your audience.",
  },
];

export default function IdeaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const idea = mockIdeas[+params.id];
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    setUserEmail(email);

    if (email && idea) {
      const allSaved = JSON.parse(sessionStorage.getItem("savedIdeas") || "{}");
      const savedByUser = allSaved[email] || [];
      const alreadySaved = savedByUser.some((i: any) => i.title === idea.title);
      setIsSaved(alreadySaved);
    }
  }, [idea]);

  const handleSaveToggle = () => {
    if (!userEmail || !idea) {
      setShowLoginModal(true);
      return;
    }

    const allSaved = JSON.parse(sessionStorage.getItem("savedIdeas") || "{}");
    const savedByUser = allSaved[userEmail] || [];

    if (isSaved) {
      const updated = savedByUser.filter((i: any) => i.title !== idea.title);
      allSaved[userEmail] = updated;
      setIsSaved(false);
    } else {
      const updated = [...savedByUser, { ...idea, id: params.id }];
      allSaved[userEmail] = updated;
      setIsSaved(true);
    }

    sessionStorage.setItem("savedIdeas", JSON.stringify(allSaved));
  };

  if (!idea) return <p className="p-6">Invalid idea.</p>;

  return (
    <main className="max-w-3xl mx-auto p-6">
      {/* Title and Save Icon Inline */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary flex-1">
          📹 {idea.title}
        </h1>

        <button
          onClick={handleSaveToggle}
          title={userEmail ? (isSaved ? "Unsave Idea" : "Save Idea") : "Login to Save"}
          className={cn(
            "text-3xl transition ml-4",
            isSaved ? "text-red-500" : "text-black/60 hover:text-black"
          )}
        >
          {isSaved ? "❤️" : "🖤"}
        </button>
      </div>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 text-sm">
            Please log in to save ideas to your account.
          </p>
          <DialogFooter>
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Idea Description */}
      <p className="text-lg leading-relaxed text-gray-800 mb-10">{idea.description}</p>

      <div className="flex gap-4 flex-wrap">
        <Button
          onClick={() => navigator.clipboard.writeText(idea.title)}
          className="bg-primary text-white"
        >
          📋 Copy Title
        </Button>

        <Button variant="secondary" onClick={() => router.push("/")}>
          ← Back to Search
        </Button>
      </div>
    </main>
  );
}
