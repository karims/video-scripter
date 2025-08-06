"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function IdeaGenerator() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-16 space-y-6">
      <h1 className="text-3xl font-bold sm:text-4xl">Turn any topic into engaging video ideas</h1>
      <p className="text-muted-foreground max-w-xl">
        Powered by AI, built for creators. Just enter a topic — we’ll suggest engaging video titles.
      </p>

      <form className="flex flex-col space-y-4 w-full max-w-md">
        <Input
          placeholder="Enter a topic like 'fitness'"
          className="h-12"
        />
        <Button type="submit" className="h-12">Generate Ideas</Button>
      </form>
    </div>
  )
}
