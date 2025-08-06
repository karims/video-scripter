"use client";
import { useEffect, useState } from "react";
import HeaderBlock from "@/components/blocks/HeaderBlock";
import HeroBlock from "@/components/blocks/HeroBlock";
import TopicInputBlock from "@/components/blocks/TopicInputBlock";
import IdeasBlock from "@/components/blocks/IdeasBlock";

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

const STORAGE_KEY = "last_video_ideas";

type Idea = { title: string; description?: string };

export default function Page() {
  const [ideas, setIdeas] = useState<{ title: string; description?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  
    // Load last ideas on page load
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIdeas(parsed);
      } catch {}
    }
  }, []);

  const handleGenerate = () => {
    if (!topic.trim()) return;

    setLoading(true);
    setIdeas([]);

    setTimeout(() => {
      const newIdeas = mockIdeas; // mock data for now
      setIdeas(newIdeas);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newIdeas));
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen items-center">
      <main className="flex-1 flex flex-col items-center w-full">
        <HeroBlock />
        <div className="w-full max-w-xl px-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            className="w-full"
          >
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border text-base mt-4 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter a topic like 'fitness'"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button
              type="submit"
              className={`mt-4 w-full py-3 rounded-xl text-white font-medium transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90"
              }`}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Ideas"}
            </button>
          </form>

        </div>

        <IdeasBlock ideas={ideas} />
      </main>
    </div>
  );
}
