// Telegram WebApp API Integration Wrapper

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          start_param?: string;
        };
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        enableClosingConfirmation?: () => void;
        BackButton?: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        MainButton?: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          setText: (text: string) => void;
        };
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
        openTelegramLink: (url: string) => void;
        openLink: (url: string) => void;
      };
    };
  }
}

export function isTelegramEnvironment(): boolean {
  return typeof window !== "undefined" && Boolean(window.Telegram?.WebApp?.initData);
}

export function initTelegram(): void {
  if (typeof window === "undefined") return;
  const tg = window.Telegram?.WebApp;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor("#0f172a");
      if (tg.setBackgroundColor) tg.setBackgroundColor("#0f172a");
      if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();
    } catch (err) {
      console.warn("Telegram WebApp init warning:", err);
    }
  }
}

export function getTelegramUserData() {
  if (typeof window === "undefined") return null;
  const tg = window.Telegram?.WebApp;
  return tg?.initDataUnsafe?.user || null;
}

export function triggerHaptic(type: "light" | "medium" | "heavy" | "success" | "error" | "selection" = "light"): void {
  if (typeof window === "undefined") return;
  const haptic = window.Telegram?.WebApp?.HapticFeedback;
  if (!haptic) {
    // Fallback vibration if supported in standard browser
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === "heavy" || type === "error") navigator.vibrate(40);
      else if (type === "medium") navigator.vibrate(20);
      else navigator.vibrate(10);
    }
    return;
  }

  try {
    if (type === "selection") {
      haptic.selectionChanged();
    } else if (type === "success" || type === "error") {
      haptic.notificationOccurred(type);
    } else {
      haptic.impactOccurred(type);
    }
  } catch (err) {
    console.debug("Haptic feedback error:", err);
  }
}

export function shareGameInvite(roomCode: string, gameTitle: string): void {
  const currentUrl = window.location.origin + window.location.pathname;
  const inviteUrl = `${currentUrl}?room=${roomCode}&game=${gameTitle.toLowerCase().replace(/\s+/g, "")}`;
  const shareText = encodeURIComponent(`🎮 Play ${gameTitle} with me on Telegram Arena!\nRoom Code: ${roomCode}\nTap link to join:`);
  
  const tg = window.Telegram?.WebApp;
  const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${shareText}`;

  if (tg?.openTelegramLink) {
    tg.openTelegramLink(tgShareUrl);
  } else {
    // Fallback: Copy to clipboard or open share window
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText}\n${inviteUrl}`);
    }
    window.open(tgShareUrl, "_blank");
  }
}
