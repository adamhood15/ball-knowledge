"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/lib/auth/signOutAction";
import { BackArrowIcon } from "@/components/icons/BackArrowIcon";
import { LogOutIcon } from "@/components/icons/LogOutIcon";

export function AppHeaderBar() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 grid grid-cols-3 items-center border-b border-card-border/40 bg-background px-4 py-2">
      <button
        type="button"
        aria-label="Go back"
        onClick={() => router.back()}
        className="flex h-9 w-9 items-center justify-center justify-self-start rounded-full text-body-text transition-colors hover:text-secondary-accent"
      >
        <BackArrowIcon className="h-5 w-5" />
      </button>
      <Image
        src="/logo/ball-knowledge-logo-64x64.png"
        alt="Ball Knowledge"
        width={40}
        height={40}
        className="justify-self-center"
      />
      <form action={signOutAction} className="justify-self-end">
        <button
          type="submit"
          aria-label="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-full text-body-text transition-colors hover:text-secondary-accent"
        >
          <LogOutIcon className="h-5 w-5" />
        </button>
      </form>
    </header>
  );
}
