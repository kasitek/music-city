"use client";

import Link from "next/link";
import {
  ChevronDown,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Play,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navigationItems } from "@/lib/constants/navigation";
import { useAuth } from "@/hooks/use-auth";

export const SiteHeader = () => {
  const { session, connectWallet, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#03030d]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-violet-500 to-cyan-300 shadow-[0_0_22px_rgba(139,92,246,0.45)]">
            <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
          </span>
          <span className="text-xl font-bold tracking-[-0.04em]">Music City</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 transition hover:text-violet-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden text-sm text-slate-300 sm:inline">
                {session.walletAddress.slice(0, 6)}...
                {session.walletAddress.slice(-4)}
              </span>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Workspace
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 rounded-full border-white/10 bg-white/[0.04] px-3 text-white hover:bg-white/10"
                    aria-label="Open account menu"
                  >
                    {session.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.profileImageUrl}
                        alt=""
                        className="size-6 rounded-full object-cover"
                      />
                    ) : (
                      <CircleUserRound className="h-4 w-4" />
                    )}
                    <ChevronDown className="h-4 w-4 text-slate-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 border-white/10 bg-[#070718] text-white shadow-2xl shadow-violet-950/30"
                >
                  <DropdownMenuLabel className="text-slate-300">
                    {session.walletAddress.slice(0, 6)}...{session.walletAddress.slice(-4)}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 focus:text-white">
                    <Link href="/account">
                      <Settings className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-red-300 focus:bg-red-500/10 focus:text-red-200"
                    onClick={() => void logout()}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              className="rounded-full bg-white px-6 font-bold text-black hover:bg-white/90"
              onClick={() => void connectWallet()}
              disabled={isLoading}
            >
              {isLoading ? "Opening login..." : "Login"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
