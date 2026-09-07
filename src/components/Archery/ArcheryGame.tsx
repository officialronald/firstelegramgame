import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RotateCcw, Wind, Target, Trophy, Volume2, VolumeX, Sparkles, ChevronRight, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { PlayerProfile, ServerRoom } from "../../types";
import { soundManager } from "../../services/sound";
import { triggerHaptic } from "../../services/telegram";
import { savePlayerProfile, addMatchHistory } from "../../services/storage";
import { achievementManager } from "../../services/achievements";

interface Props {
  profile: PlayerProfile;
  onUpdateProfile: (p: PlayerProfile) => void;
  onBackToLobby: () => void;
  initialRoom?: ServerRoom | null;
}

interface ShotResult {
  round: number;
  shotNumber: number;
  score: number;
  ring: string;
  isBullseye: boolean;
  xOffset: number;
  yOffset: number;
  wind: number;
  distance: number;
}

export const ArcheryGame: React.FC<Props> = ({
  profile,
  onUpdateProfile,
  onBackToLobby,
  initialRoom = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Match State
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = 3;
  const shotsPerRound = 3;
  const [currentShot, setCurrentShot] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([0, 0, 0]);
  const [shotHistory, setShotHistory] = useState<ShotResult[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundOn, setSoundOn] = useState(soundManager.isEnabled());

  // Environmental Parameters
  const [distance, setDistance] = useState(30); // 30m, 50m, 70m
  const [wind, setWind] = useState(0); // -8 m/s to +8 m/s (negative = left, positive = right)

  // Interactive Bow State
  const [isAiming, setIsAiming] = useState(false);
  const [aimAngle, setAimAngle] = useState(0); // degrees (-30 to +30)
  const [pullPower, setPullPower] = useState(0); // 0 to 1
  const [lastShotResult, setLastShotResult] = useState<ShotResult | null>(null);

  // Setup round distance and wind
  const setupRound = useCallback((roundNum: number) => {
    // Round 1: 30m, low wind. Round 2: 50m, medium wind. Round 3: 70m, strong wind.
    const dists = [30, 50, 70];
    const newDist = dists[roundNum - 1] || 50;
    setDistance(newDist);

    const windIntensity = roundNum === 1 ? 2.5 : roundNum === 2 ? 4.5 : 7.0;
    const newWind = parseFloat(((Math.random() * 2 - 1) * windIntensity).toFixed(1));
    setWind(newWind);
  }, []);

  // Initialize first round
  useEffect(() => {
    setupRound(1);
  }, [setupRound]);

  // Arrow In Flight Physics Animation Ref
  const flightRef = useRef<{
    active: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    z: number; // progress towards target 0 -> 100
    vz: number;
    trail: { x: number; y: number }[];
  } | null>(null);

  // Moving target offset for high rounds
  const targetAnimRef = useRef({ offset: 0, direction: 1 });

  // Canvas Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas with rich gradient sky/field background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, "#090d16");
      skyGrad.addColorStop(0.55, "#172554");
      skyGrad.addColorStop(0.56, "#1e3a5f");
      skyGrad.addColorStop(1, "#0f2027");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant mountains / trees silhouette
      ctx.fillStyle = "#0c1524";
      ctx.beginPath();
      ctx.moveTo(0, height * 0.56);
      ctx.lineTo(width * 0.25, height * 0.50);
      ctx.lineTo(width * 0.5, height * 0.54);
      ctx.lineTo(width * 0.75, height * 0.48);
      ctx.lineTo(width, height * 0.55);
      ctx.lineTo(width, height * 0.56);
      ctx.closePath();
      ctx.fill();

      // Archery Range Ground / Lawn perspective lines
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(0, height * 0.56, width, height * 0.44);

      // Distance markers on the lawn
      ctx.strokeStyle = "rgba(52, 211, 153, 0.25)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const yPos = height * (0.56 + i * 0.08);
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(width, yPos);
        ctx.stroke();
      }

      // Wind particle streaks
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1.5;
      const windSpeed = wind;
      const time = Date.now() * 0.003;
      for (let i = 0; i < 6; i++) {
        const px = ((time * (windSpeed * 40) + i * (width / 5)) % (width + 60)) - 30;
        const py = height * 0.2 + (i * 27) % (height * 0.35);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + windSpeed * 7, py + 1.5);
        ctx.stroke();
      }

      // Calculate Target Position & Scale (smaller when farther away)
      const targetBaseY = height * 0.52;
      // Distance scaling factor: 30m -> 1.0, 50m -> 0.75, 70m -> 0.55
      const targetScale = Math.max(0.48, 1 - (distance - 30) * 0.012);
      const targetRadius = 60 * targetScale;

      // Moving target logic in round 3
      let targetCenterX = width * 0.5;
      if (currentRound >= 3) {
        targetAnimRef.current.offset += 0.8 * targetAnimRef.current.direction;
        if (Math.abs(targetAnimRef.current.offset) > 35) {
          targetAnimRef.current.direction *= -1;
        }
        targetCenterX += targetAnimRef.current.offset;
      }
      const targetCenterY = targetBaseY - targetRadius * 0.8;

      // Draw Target Stand (wooden tripod)
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 4 * targetScale;
      ctx.beginPath();
      ctx.moveTo(targetCenterX, targetCenterY + targetRadius);
      ctx.lineTo(targetCenterX - targetRadius * 0.8, height * 0.65);
      ctx.moveTo(targetCenterX, targetCenterY + targetRadius);
      ctx.lineTo(targetCenterX + targetRadius * 0.8, height * 0.65);
      ctx.moveTo(targetCenterX, targetCenterY + targetRadius);
      ctx.lineTo(targetCenterX, height * 0.67);
      ctx.stroke();

      // Draw Archery Target Rings (Standard Olympic/World Archery colors)
      const rings = [
        { r: targetRadius, color: "#f8fafc" }, // 1-2 White
        { r: targetRadius * 0.8, color: "#1e293b" }, // 3-4 Black
        { r: targetRadius * 0.6, color: "#0284c7" }, // 5-6 Blue
        { r: targetRadius * 0.4, color: "#dc2626" }, // 7-8 Red
        { r: targetRadius * 0.2, color: "#eab308" }, // 9-10 Gold / Bullseye
        { r: targetRadius * 0.08, color: "#f59e0b" }, // X inner bullseye
      ];

      // Target shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(targetCenterX, height * 0.65, targetRadius * 0.9, targetRadius * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw concentric rings
      rings.forEach((ring) => {
        ctx.fillStyle = ring.color;
        ctx.beginPath();
        ctx.arc(targetCenterX, targetCenterY, ring.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Target Crosshair center
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(targetCenterX - 4, targetCenterY);
      ctx.lineTo(targetCenterX + 4, targetCenterY);
      ctx.moveTo(targetCenterX, targetCenterY - 4);
      ctx.lineTo(targetCenterX, targetCenterY + 4);
      ctx.stroke();

      // Draw Previous Arrows stuck in target for current round
      shotHistory
        .filter((s) => s.round === currentRound)
        .forEach((s) => {
          const arrowX = targetCenterX + s.xOffset * targetScale;
          const arrowY = targetCenterY + s.yOffset * targetScale;

          // Arrow nock & fletching
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(arrowX, arrowY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1;
          ctx.stroke();
        });

      // Arrow in flight animation
      const flight = flightRef.current;
      if (flight && flight.active) {
        flight.z += flight.vz;
        flight.x += flight.vx;
        flight.y += flight.vy;

        // Wind drift during flight
        flight.vx += wind * 0.007;
        // Gravity effect
        flight.vy += 0.09;

        // Add to trail
        flight.trail.push({ x: flight.x, y: flight.y });
        if (flight.trail.length > 8) flight.trail.shift();

        // Render arrow flight trail
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        flight.trail.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Render Arrow Head & Shaft
        const arrowScale = Math.max(0.3, 1 - (flight.z / 100) * 0.6);
        ctx.save();
        ctx.translate(flight.x, flight.y);
        const flightAngle = Math.atan2(flight.vy, flight.vx);
        ctx.rotate(flightAngle);

        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 3 * arrowScale;
        ctx.beginPath();
        ctx.moveTo(-18 * arrowScale, 0);
        ctx.lineTo(12 * arrowScale, 0);
        ctx.stroke();

        // Fletching feathers
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(-18 * arrowScale, 0);
        ctx.lineTo(-24 * arrowScale, -4 * arrowScale);
        ctx.lineTo(-20 * arrowScale, 0);
        ctx.lineTo(-24 * arrowScale, 4 * arrowScale);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // When arrow reaches target distance (z >= 100)
        if (flight.z >= 100) {
          flight.active = false;
          // Calculate score based on distance from target center
          const hitDx = (flight.x - targetCenterX) / targetScale;
          const hitDy = (flight.y - targetCenterY) / targetScale;
          const hitDist = Math.hypot(hitDx, hitDy);

          let score = 0;
          let ring = "Miss";
          let isBullseye = false;

          if (hitDist <= targetRadius * 0.08) {
            score = 10;
            ring = "X - Bullseye!";
            isBullseye = true;
          } else if (hitDist <= targetRadius * 0.2) {
            score = 10;
            ring = "10 - Gold";
            isBullseye = true;
          } else if (hitDist <= targetRadius * 0.4) {
            score = 9;
            ring = "9 - Gold";
          } else if (hitDist <= targetRadius * 0.6) {
            score = 8;
            ring = "8 - Red";
          } else if (hitDist <= targetRadius * 0.8) {
            score = 6;
            ring = "6 - Blue";
          } else if (hitDist <= targetRadius) {
            score = 4;
            ring = "4 - Black";
          } else if (hitDist <= targetRadius * 1.2) {
            score = 1;
            ring = "1 - White";
          } else {
            score = 0;
            ring = "Miss";
          }

          onArrowLanded(score, ring, isBullseye, hitDx, hitDy);
        }
      }

      // Draw Bow and Player at Bottom Center if not in flight
      if (!flight?.active && !isGameOver) {
        const bowBaseX = width * 0.5;
        const bowBaseY = height * 0.88;
        const bowAngleRad = (aimAngle * Math.PI) / 180;

        ctx.save();
        ctx.translate(bowBaseX, bowBaseY);
        ctx.rotate(bowAngleRad);

        // Aim guide reticle / trajectory preview line
        if (isAiming && pullPower > 0.1) {
          ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -40);
          ctx.lineTo(0, -180 * pullPower);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw Bow Limbs (Recurve bow curve)
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-45, 0);
        ctx.quadraticCurveTo(-35, -45, 0, -50);
        ctx.quadraticCurveTo(35, -45, 45, 0);
        ctx.stroke();

        // Draw Bow Handle
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(-10, -48);
        ctx.lineTo(10, -48);
        ctx.stroke();

        // Draw Bowstring (pulled back based on pullPower)
        const stringPullY = -48 + pullPower * 35;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-45, 0);
        ctx.lineTo(0, stringPullY);
        ctx.lineTo(45, 0);
        ctx.stroke();

        // Draw Loaded Arrow on the string
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, stringPullY);
        ctx.lineTo(0, stringPullY - 55);
        ctx.stroke();

        // Arrow tip
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(0, stringPullY - 60);
        ctx.lineTo(-4, stringPullY - 54);
        ctx.lineTo(4, stringPullY - 54);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [distance, wind, isAiming, aimAngle, pullPower, currentRound, isGameOver, shotHistory]);

  // Touch / Pointer controls for Aiming and Power Pull
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isGameOver || flightRef.current?.active) return;
    setIsAiming(true);
    soundManager.playBowPull(0.2);
    triggerHaptic("selection");
    updateAim(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isAiming || isGameOver || flightRef.current?.active) return;
    updateAim(e);
  };

  const updateAim = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const bowBaseX = rect.width * 0.5;
    const bowBaseY = rect.height * 0.88;

    // Angle calculation
    const dx = touchX - bowBaseX;
    const dy = bowBaseY - touchY;

    // Constrain angle between -35 and +35 degrees
    const deg = Math.max(-35, Math.min(35, (Math.atan2(dx, dy) * 180) / Math.PI));
    setAimAngle(deg);

    // Power calculation based on drag distance down/up
    const dragDist = Math.hypot(dx, Math.max(0, touchY - (bowBaseY - 60)));
    const power = Math.max(0.25, Math.min(1.0, dragDist / 90));
    setPullPower(power);
  };

  const handlePointerUp = () => {
    if (!isAiming || isGameOver || flightRef.current?.active) return;
    setIsAiming(false);
    shootArrow();
  };

  // Shoot Arrow Action
  const shootArrow = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    soundManager.playBowRelease();
    triggerHaptic("heavy");

    const startX = canvas.width * 0.5;
    const startY = canvas.height * 0.88;

    // Calculate initial trajectory velocity
    const angleRad = (aimAngle * Math.PI) / 180;
    const speed = 12 * pullPower;
    const vx = Math.sin(angleRad) * speed;
    const vy = -Math.cos(angleRad) * speed;

    flightRef.current = {
      active: true,
      x: startX,
      y: startY,
      vx,
      vy,
      z: 0,
      vz: 4.2 * pullPower, // flight speed towards target
      trail: [],
    };
  };

  // Called when arrow lands on target plane
  const onArrowLanded = (
    score: number,
    ring: string,
    isBullseye: boolean,
    xOffset: number,
    yOffset: number
  ) => {
    soundManager.playArrowHit(isBullseye);
    if (isBullseye) {
      triggerHaptic("success");
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
      });
    } else {
      triggerHaptic("medium");
    }

    const result: ShotResult = {
      round: currentRound,
      shotNumber: currentShot,
      score,
      ring,
      isBullseye,
      xOffset,
      yOffset,
      wind,
      distance,
    };

    setLastShotResult(result);
    setShotHistory((prev) => [...prev, result]);
    setTotalScore((prev) => prev + score);

    // Track archery shot achievement
    achievementManager.recordArcheryShot({
      score,
      isBullseye,
      wind,
      distance,
      round: currentRound,
      shotNumber: currentShot,
    });

    // Update round scores
    setRoundScores((prev) => {
      const next = [...prev];
      next[currentRound - 1] = (next[currentRound - 1] || 0) + score;
      return next;
    });

    // Advance shot or round
    if (currentShot < shotsPerRound) {
      setCurrentShot((s) => s + 1);
      // slight wind variation between shots
      setWind((w) => parseFloat((w + (Math.random() * 1.2 - 0.6)).toFixed(1)));
    } else {
      // Round completed
      if (currentRound < totalRounds) {
        setTimeout(() => {
          const nextRound = currentRound + 1;
          setCurrentRound(nextRound);
          setCurrentShot(1);
          setupRound(nextRound);
          triggerHaptic("success");
        }, 1200);
      } else {
        // Game Complete!
        setTimeout(() => {
          finishGame();
        }, 1200);
      }
    }
  };

  // Finish Match & update stats
  const finishGame = () => {
    setIsGameOver(true);
    soundManager.playWin();
    triggerHaptic("success");
    confetti({
      particleCount: 90,
      spread: 90,
      origin: { y: 0.5 },
    });

    const finalScore = totalScore;
    const bullseyesCount = shotHistory.filter((s) => s.isBullseye).length;

    // Update profile
    const updated = { ...profile };
    const archStats = updated.stats.archery;
    archStats.played += 1;
    archStats.totalScore += finalScore;
    archStats.bullseyes += bullseyesCount;
    if (finalScore > archStats.highScore) {
      archStats.highScore = finalScore;
    }
    archStats.avgAccuracy = Math.round((archStats.totalScore / (archStats.played * 90)) * 100);

    updated.xp += 50 + Math.floor(finalScore * 1.5);
    updated.coins += 40 + Math.floor(finalScore * 1.2);
    updated.rating += Math.floor(finalScore * 0.4);

    savePlayerProfile(updated);
    onUpdateProfile(updated);

    // Track archery match achievements
    achievementManager.recordArcheryGame({
      finalScore,
      bullseyesCount,
      roundScores,
      totalPlayed: archStats.played,
      careerBullseyes: archStats.bullseyes,
    });

    // Save match log
    addMatchHistory({
      gameType: "archery",
      gameName: "2D Archery",
      opponent: "Target Range",
      mode: "single_ai",
      result: "completed",
      scoreText: `${finalScore} pts (${bullseyesCount} 🎯)`,
    });
  };

  // Restart match
  const handleRestart = () => {
    soundManager.playClick();
    setCurrentRound(1);
    setCurrentShot(1);
    setTotalScore(0);
    setRoundScores([0, 0, 0]);
    setShotHistory([]);
    setIsGameOver(false);
    setLastShotResult(null);
    setupRound(1);
  };

  return (
    <div className="w-full flex flex-col min-h-full px-5 py-3 relative select-none pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            soundManager.playClick();
            onBackToLobby();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10 transition active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Lobby</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundOn(soundManager.toggleSound())}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition active:scale-95"
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5 text-gray-500" />}
          </button>

          <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-indigo-400" />
            <span>Score: {totalScore}</span>
          </div>
        </div>
      </div>

      {/* Conditions Bar: Wind, Distance, Round & Arrows */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Round & Arrow Progress */}
        <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Round</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-sm font-black text-indigo-400 font-mono">
              {currentRound}/{totalRounds}
            </span>
          </div>
          {/* Arrow Dots */}
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: shotsPerRound }).map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < currentShot - 1
                    ? "bg-white/20"
                    : i === currentShot - 1
                    ? "bg-indigo-400 ring-2 ring-indigo-400/40 animate-pulse"
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Distance Indicator */}
        <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Distance</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Target className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-sm font-black text-white font-mono">{distance}m</span>
          </div>
          <span className="text-[9px] text-gray-400">
            {currentRound === 3 ? "Moving Target" : "Static Target"}
          </span>
        </div>

        {/* Dynamic Wind Indicator */}
        <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Wind</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Wind className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-sm font-black text-white font-mono">
              {wind > 0 ? `→ ${Math.abs(wind)}` : wind < 0 ? `← ${Math.abs(wind)}` : "0.0"} m/s
            </span>
          </div>
          <span
            className={`text-[9px] font-bold ${
              Math.abs(wind) > 4 ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {Math.abs(wind) > 5 ? "Crosswind" : Math.abs(wind) > 2 ? "Moderate" : "Calm"}
          </span>
        </div>
      </div>

      {/* Main Archery 2D Canvas */}
      <div className="relative w-full aspect-[4/5] max-h-[440px] rounded-[28px] overflow-hidden border border-white/10 shadow-2xl bg-[#05060A]">
        <canvas
          ref={canvasRef}
          width={400}
          height={500}
          className="w-full h-full touch-none cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* Floating Shot Result Toast */}
        {lastShotResult && (
          <div
            key={`${lastShotResult.round}-${lastShotResult.shotNumber}`}
            className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-20 animate-in fade-in zoom-in-75 duration-200"
          >
            <div
              className={`px-4 py-1.5 rounded-full border shadow-xl flex items-center gap-2 backdrop-blur-md ${
                lastShotResult.isBullseye
                  ? "bg-amber-500/30 border-amber-400 text-amber-300"
                  : lastShotResult.score >= 8
                  ? "bg-rose-500/30 border-rose-400 text-rose-300"
                  : lastShotResult.score > 0
                  ? "bg-indigo-500/30 border-indigo-400 text-indigo-300"
                  : "bg-white/10 border-white/20 text-gray-300"
              }`}
            >
              {lastShotResult.isBullseye ? (
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span className="text-sm font-black font-mono">+{lastShotResult.score} PTS</span>
              <span className="text-xs font-semibold">{lastShotResult.ring}</span>
            </div>
          </div>
        )}

        {/* Aim & Power Guidance overlay when pulling */}
        {isAiming && (
          <div className="absolute bottom-6 left-4 right-4 pointer-events-none flex flex-col items-center gap-1 z-10">
            <div className="flex items-center justify-between w-full px-4 text-xs text-indigo-300 font-bold drop-shadow">
              <span>Aim: {aimAngle > 0 ? `+${aimAngle}°` : `${aimAngle}°`}</span>
              <span>Power: {Math.round(pullPower * 100)}%</span>
            </div>
            {/* Power Bar */}
            <div className="w-full h-2 rounded-full bg-[#0E1117] border border-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 transition-all duration-75"
                style={{ width: `${pullPower * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-300 drop-shadow mt-0.5">
              Drag to aim & adjust power, release to shoot!
            </span>
          </div>
        )}

        {/* Idle Instructions Prompt */}
        {!isAiming && !flightRef.current?.active && !isGameOver && (
          <div className="absolute bottom-4 left-0 right-0 pointer-events-none flex justify-center z-10">
            <div className="px-3 py-1 rounded-full bg-[#0E1117]/80 border border-white/10 text-gray-300 text-xs font-medium backdrop-blur-sm animate-pulse">
              Touch & pull down to aim the bow
            </div>
          </div>
        )}

        {/* Game Over Summary Modal */}
        {isGameOver && (
          <div className="absolute inset-0 bg-[#05060A]/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-indigo-500/30">
              🎯
            </div>
            <h3 className="text-xl font-black text-white">Match Complete!</h3>
            <p className="text-xs text-gray-400 mt-1">3 Rounds Completed</p>

            {/* Score Showcase */}
            <div className="my-4 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
              <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Final Score</span>
              <span className="text-4xl font-black text-white font-mono mt-1">
                {totalScore} / 90
              </span>
              <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-gray-300">
                <span>R1: {roundScores[0]}</span>
                <span>•</span>
                <span>R2: {roundScores[1]}</span>
                <span>•</span>
                <span>R3: {roundScores[2]}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-indigo-300">
              <span>+{(totalScore * 1.5).toFixed(0)} XP</span>
              <span>•</span>
              <span>+{(totalScore * 1.2).toFixed(0)} Coins</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
              <button
                onClick={onBackToLobby}
                className="py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs border border-white/10 transition active:scale-95"
              >
                Lobby
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Round Breakdown Cards */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[1, 2, 3].map((rNum) => {
          const rScore = roundScores[rNum - 1];
          const isCurrent = currentRound === rNum && !isGameOver;
          return (
            <div
              key={rNum}
              className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                isCurrent
                  ? "bg-indigo-500/20 border-indigo-500/60 shadow-sm shadow-indigo-500/20"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <span className="text-[10px] text-gray-400 font-medium">Round {rNum}</span>
              <span className="text-sm font-black text-white font-mono mt-0.5">{rScore} pts</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
