import React from "react";
import { Gamepad2, Trophy, Swords, User } from "lucide-react";
import { soundManager } from "../services/sound";
import { triggerHaptic } from "../services/telegram";

export type NavTab = "lobby" | "leaderboards" | "tournaments" | "profile";

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navigation: React.FC<Props> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: "lobby" as const, label: "Lobby", icon: Gamepad2 },
    { id: "leaderboards" as const, label: "Ranks", icon: Trophy },
    { id: "tournaments" as const, label: "Tournaments", icon: Swords },
    { id: "profile" as const, label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#161920]/90 backdrop-blur-lg border-t border-white/5 px-6 pt-2 pb-1 max-w-md mx-auto flex flex-col">
      <div className="flex items-center justify-around w-full py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playClick();
                triggerHaptic("selection");
                onSelectTab(tab.id);
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 active:scale-95 ${
                isActive ? "text-indigo-400 font-bold" : "text-gray-500 hover:text-gray-300 font-medium"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  isActive ? "bg-indigo-400 shadow-sm shadow-indigo-400 scale-100" : "bg-transparent scale-50"
                }`}
              />
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Home Bar Indicator */}
      <div className="w-full h-4 flex justify-center items-center pb-1">
        <div className="w-28 h-1 bg-white/20 rounded-full"></div>
      </div>
    </nav>
  );
};
