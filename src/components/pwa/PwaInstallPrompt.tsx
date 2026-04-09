"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const DISMISS_UNTIL_KEY = "pwa-install-dismiss-until";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(navigatorWithStandalone.standalone) ||
    document.referrer.includes("android-app://")
  );
}

function getPlatformInfo() {
  if (typeof navigator === "undefined") {
    return {
      isIosSafari: false,
      instructions:
        "Open your browser menu and choose Install app or Add to Home screen.",
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isSafari =
    /safari/.test(userAgent) && !/crios|fxios|edgios|chrome/.test(userAgent);

  return {
    isIosSafari: isIos && isSafari,
    instructions: isIos && isSafari
      ? "Tap Share, then choose Add to Home Screen."
      : "Open your browser menu and choose Install app or Add to Home screen.",
  };
}

function canShowBanner() {
  if (typeof window === "undefined") {
    return false;
  }

  const hideUntil = Number(window.localStorage.getItem(DISMISS_UNTIL_KEY) ?? 0);
  return !hideUntil || hideUntil < Date.now();
}

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const platform = useMemo(getPlatformInfo, []);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showManualHelp, setShowManualHelp] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      setIsVisible(false);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const revealBanner = () => {
      if (!isStandaloneMode() && canShowBanner()) {
        setIsVisible(true);
      }
    };

    if (isStandaloneMode()) {
      setIsInstalled(true);
      return;
    }

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Registration failure should not block the app.
      });
    }

    const initialTimer = window.setTimeout(revealBanner, 1800);

    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      event.preventDefault();
      setDeferredPrompt(installEvent);
      revealBanner();
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowManualHelp(false);
      setIsVisible(false);
    };

    const displayModeMedia = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (mediaEvent: MediaQueryListEvent) => {
      if (mediaEvent.matches) {
        handleInstalled();
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    displayModeMedia.addEventListener?.("change", handleDisplayModeChange);

    return () => {
      window.clearTimeout(initialTimer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
      displayModeMedia.removeEventListener?.("change", handleDisplayModeChange);
    };
  }, [pathname]);

  if (pathname?.startsWith("/admin") || isInstalled || !isVisible) {
    return null;
  }

  const dismissBanner = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        DISMISS_UNTIL_KEY,
        String(Date.now() + DISMISS_COOLDOWN_MS),
      );
    }

    setShowManualHelp(false);
    setIsVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowManualHelp(true);
      return;
    }

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setIsVisible(false);
      } else {
        setShowManualHelp(true);
      }
    } finally {
      setDeferredPrompt(null);
      setIsInstalling(false);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-6">
      <div className="pointer-events-auto mx-auto max-w-xl overflow-hidden rounded-2xl border border-amber-500/20 bg-zinc-950/95 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.22),_transparent_55%)]" />
        <div className="relative flex items-start gap-3 p-4 sm:p-5">
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
            <Smartphone className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold sm:text-base">
              Install Dhan Kamao for faster access
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-300 sm:text-sm">
              Add this app to your home screen so users can open it like a real
              application with a full-screen experience.
            </p>

            {showManualHelp ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-zinc-200">
                <div className="flex items-center gap-2 font-medium text-white">
                  {platform.isIosSafari ? (
                    <Share className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Download className="h-4 w-4 text-amber-400" />
                  )}
                  Install steps
                </div>
                <p className="mt-1">{platform.instructions}</p>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
                onClick={() => void handleInstall()}
                disabled={isInstalling}
              >
                <Download className="h-4 w-4" />
                {deferredPrompt ? "Install app" : "Show install steps"}
              </Button>
              <Button
                variant="ghost"
                className="text-zinc-300 hover:bg-white/10 hover:text-white"
                onClick={dismissBanner}
              >
                Maybe later
              </Button>
            </div>
          </div>

          <button
            type="button"
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            onClick={dismissBanner}
            aria-label="Dismiss install banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
