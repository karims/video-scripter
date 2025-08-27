"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FreeLimitModal({
  open,
  onOpenChange,
  isLoggedIn,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isLoggedIn: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Daily limit reached</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm text-[#0F172A]/80">
          {isLoggedIn ? (
            <>
              <p>You’ve used all your free ideas for today.</p>
              <p>Upgrade to continue generating ideas without limits.</p>
            </>
          ) : (
            <>
              <p>You’ve used today’s free ideas.</p>
              <p>Create an account or upgrade to keep going.</p>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Link href="/pricing" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#280A3E] text-white">See Pricing</Button>
          </Link>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
