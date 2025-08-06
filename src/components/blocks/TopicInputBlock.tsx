"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TopicInputBlock() {
  const [topic, setTopic] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Generating ideas for:", topic);
    // Later: Trigger API call or update state for results
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center space-y-4 w-full max-w-md mt-8"
    >
      <Input
        placeholder="Enter a topic like 'fitness'"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="h-12"
      />
      <Button type="submit" className="h-12 w-full">
        Generate Ideas
      </Button>
    </form>
  );
}
