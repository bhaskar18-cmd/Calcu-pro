import React from "react";
import { motion } from "motion/react";
import {
  Gift,
  Cake,
  PartyPopper,
  Heart,
  Star,
  Crown,
  Smile,
  Gamepad2,
  BookOpen,
  Headphones,
  Camera,
  Rocket,
  Sparkles,
  Car,
  SmilePlus,
  Music,
  Tv,
  Coffee,
  Palette,
  Compass,
  Flame,
  Sun,
  User,
  Sparkle,
  Briefcase,
  GraduationCap,
  HeartHandshake
} from "lucide-react";

// Positions for candles to lay in a 3D elliptical curve on top of the cake
const kidCandlePositions = [
  { left: "12%", top: "4px" },
  { left: "30%", top: "8px" },
  { left: "50%", top: "10px" },
  { left: "70%", top: "8px" },
  { left: "88%", top: "4px" }
];

const adultCandlePositions = [
  { left: "8%", top: "2px" },
  { left: "21%", top: "6px" },
  { left: "34%", top: "9px" },
  { left: "50%", top: "11px" },
  { left: "66%", top: "9px" },
  { left: "79%", top: "6px" },
  { left: "92%", top: "2px" }
];

interface Sprinkle3DProps {
  top: string;
  left: string;
  color: string;
  rotate: string;
}

const Sprinkle3D: React.FC<Sprinkle3DProps> = ({ top, left, color, rotate }) => (
  <div 
    className={`absolute w-3 h-1.5 rounded-full shadow-[0_1.5px_2px_rgba(0,0,0,0.25)] ${color} ${rotate} z-20`} 
    style={{ top, left }} 
  />
);

interface BirthdayCardProps {
  age: number;
  theme: string;
}

export const BirthdayCard: React.FC<BirthdayCardProps> = ({ age, theme }) => {
  const isAdult = age >= 18;

  // Sticky notes content for Adults (18+)
  const adultStickyNotes = [
    {
      text: "May your every day be filled with joy, love, purpose and laughter!",
      color: "bg-rose-100 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-200",
      rotate: "hover:rotate-0 -rotate-2",
    },
    {
      text: "May you achieve all your professional goals and turn your grandest dreams into reality!",
      color: "bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-200",
      rotate: "hover:rotate-0 rotate-1",
    },
    {
      text: "Wishing you good health, endless energy, career prosperity and a strong, happy life!",
      color: "bg-purple-100 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/40 text-purple-800 dark:text-purple-200",
      rotate: "hover:rotate-0 -rotate-1",
    },
    {
      text: "May your adult journey ahead be filled with success, inner peace and infinite blessings!",
      color: "bg-sky-100 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/40 text-sky-800 dark:text-sky-200",
      rotate: "hover:rotate-0 rotate-2",
    },
    {
      text: "Keep shining, keep leading with wisdom, and keep being the amazing leader you are!",
      color: "bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200",
      rotate: "hover:rotate-0 -rotate-2",
    },
    {
      text: "May every step you take lead you to a brighter, happier and more satisfying, fulfilling career!",
      color: "bg-violet-100 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900/40 text-violet-800 dark:text-violet-200",
      rotate: "hover:rotate-0 rotate-1",
    },
    {
      text: "Here's to new adventures, financial freedom, wise decisions and wonderful chapters in your life!",
      color: "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200",
      rotate: "hover:rotate-0 rotate-2",
    },
    {
      text: "May this year bring you endless happiness, beautiful relationships, success and beautiful memories!",
      color: "bg-orange-100 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/40 text-orange-800 dark:text-orange-200",
      rotate: "hover:rotate-0 -rotate-1",
    },
    {
      text: "May you be surrounded by supportive friends, deep love, wisdom and amazing vibes always!",
      color: "bg-teal-100 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/40 text-teal-800 dark:text-teal-200",
      rotate: "hover:rotate-0 rotate-2",
    }
  ];

  // Kid stickers grid (Under 18)
  const kidStickers = [
    { icon: Heart, label: "Teddy Bear", color: "text-amber-500 bg-amber-500/10" },
    { icon: Car, label: "Toy Car", color: "text-sky-500 bg-sky-500/10" },
    { icon: Sun, label: "Shiny Balloon", color: "text-purple-500 bg-purple-500/10" },
    { icon: Star, label: "Magic Star", color: "text-yellow-500 bg-yellow-500/10" },
    { icon: Crown, label: "Royal Crown", color: "text-amber-500 bg-amber-500/10" },
    { icon: Sparkles, label: "Sweet Candy", color: "text-pink-500 bg-pink-500/10" },
    { icon: Music, label: "Play Game", color: "text-indigo-500 bg-indigo-500/10" },
    { icon: Gamepad2, label: "Video Game", color: "text-green-500 bg-green-500/10" },
    { icon: BookOpen, label: "Story Book", color: "text-blue-500 bg-blue-500/10" },
    { icon: Headphones, label: "Music Beat", color: "text-purple-500 bg-purple-500/10" },
    { icon: Camera, label: "Smile Photo", color: "text-cyan-500 bg-cyan-500/10" },
    { icon: SmilePlus, label: "Bright Smile", color: "text-rose-500 bg-rose-500/10" },
    { icon: Heart, label: "Happy Heart", color: "text-red-500 bg-red-500/10" },
    { icon: Rocket, label: "Space Rocket", color: "text-violet-500 bg-violet-500/10" },
    { icon: PartyPopper, label: "Party Popper", color: "text-pink-500 bg-pink-500/10" },
    { icon: Cake, label: "Yummy Cake", color: "text-orange-500 bg-orange-500/10" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`w-full rounded-3xl border overflow-hidden shadow-2xl relative select-none ${
        theme === "cosmic"
          ? "bg-slate-950/90 border-cyan-500/30 text-white"
          : theme === "neumorphic"
          ? "bg-[#121212] border-zinc-800 text-[#00E676]"
          : theme === "financial"
          ? "bg-[#EAEAEA] border-[#C5C5B2] text-[#3C3C30]"
          : "bg-amber-50/50 border-orange-200 text-gray-800"
      }`}
      id="birthday-celebration-canvas"
    >
      {/* Swinging Decorative Triangle Banner Flags */}
      <div className="absolute top-0 left-0 right-0 flex justify-between px-2 overflow-hidden h-10 pointer-events-none z-10">
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ rotate: [i % 2 === 0 ? -5 : 5, i % 2 === 0 ? 5 : -5, i % 2 === 0 ? -5 : 5] }}
            transition={{ repeat: Infinity, duration: 2.5 + (i % 3) * 0.4, ease: "easeInOut" }}
            className={`w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] origin-top ${
              i % 4 === 0
                ? "border-t-pink-500"
                : i % 4 === 1
                ? "border-t-yellow-400"
                : i % 4 === 2
                ? "border-t-sky-400"
                : "border-t-purple-500"
            }`}
          />
        ))}
      </div>

      {/* Main Card Frame */}
      <div className="p-6 md:p-8 space-y-6">
        {/* Curved Title Ribbon Header */}
        <div className="text-center relative py-4">
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="inline-block relative px-8 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-lg text-white"
          >
            <h2 className="text-2xl md:text-3xl font-black tracking-wide uppercase font-sans">
              Oh is that your day?
            </h2>
            <p className="text-sm md:text-base font-bold tracking-widest mt-1 text-yellow-200">
              Happy birthday to you!
            </p>
          </motion.div>
        </div>

        {/* Characters Illustration and Birthday Cake Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center py-4 bg-white/5 dark:bg-black/20 rounded-2xl p-6 border border-white/5">
          
          {/* Man / Boy Character Waving (Left) */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              {/* Character Avatar Box */}
              <div className="w-24 h-24 rounded-full bg-sky-500 border-4 border-white shadow-lg overflow-hidden flex items-end justify-center relative">
                
                {isAdult ? (
                  /* ADULT GENTLEMAN AVATAR (18+) */
                  <>
                    {/* Charcoal Blazer Suit and white collar shirt */}
                    <div className="w-20 h-16 rounded-t-3xl bg-slate-800 border border-slate-700 flex flex-col justify-start items-center pt-0.5 relative">
                      {/* White Shirt Collar V-neck */}
                      <div className="w-6 h-6 bg-white rotate-45 mt-[-10px] flex justify-center items-center relative overflow-hidden">
                        {/* Red Necktie */}
                        <div className="w-2 h-8 bg-red-600 rounded-sm rotate-[-45deg] mt-3" />
                      </div>
                    </div>
                    {/* Classy combed gentleman hairstyle */}
                    <div className="absolute top-1 w-16 h-12 bg-zinc-900 rounded-b-xl flex flex-wrap justify-center overflow-hidden">
                      <div className="w-16 h-6 bg-zinc-900 rounded-b-lg" />
                      <div className="w-4 h-4 bg-zinc-900 rotate-45 -mt-1.5" />
                      <div className="w-4 h-4 bg-zinc-900 rotate-45 -mt-1.5" />
                    </div>
                    {/* Face & Classy Stubble Beard */}
                    <div className="absolute bottom-5 w-12 h-10 bg-amber-100 rounded-full flex flex-col justify-center items-center">
                      {/* Eyes */}
                      <div className="flex space-x-4">
                        <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full" />
                        <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full" />
                      </div>
                      {/* Handsome Smile */}
                      <div className="w-4.5 h-2 border-b-2 border-zinc-900 rounded-b-full mt-1 bg-red-400/20" />
                      {/* Subtle Beard Shadow / Sideburns */}
                      <div className="absolute bottom-0 w-11 h-3 bg-zinc-800/25 rounded-b-full border-t border-zinc-800/10" />
                    </div>
                  </>
                ) : (
                  /* KID BOY AVATAR (<18) */
                  <>
                    {/* Hoodie */}
                    <div className="w-20 h-16 rounded-t-3xl bg-sky-600 border border-sky-400 flex justify-center items-start pt-1">
                      <div className="w-1.5 h-6 bg-white rounded-full mx-1" />
                      <div className="w-1.5 h-6 bg-white rounded-full mx-1" />
                    </div>
                    {/* Hair */}
                    <div className="absolute top-2 w-16 h-12 bg-amber-950 rounded-b-lg flex flex-wrap justify-center overflow-hidden">
                      <div className="w-4 h-4 bg-amber-950 rotate-45 m-[-2px]" />
                      <div className="w-4 h-4 bg-amber-950 rotate-45 m-[-2px]" />
                    </div>
                    {/* Face & Blushing */}
                    <div className="absolute bottom-6 w-12 h-10 bg-amber-100 rounded-full flex flex-col justify-center items-center">
                      <div className="flex space-x-4">
                        <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full" />
                        <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full" />
                      </div>
                      <div className="w-4 h-2 border-b-2 border-zinc-900 rounded-b-full mt-1.5 bg-red-400" />
                      <div className="absolute bottom-2 left-1.5 w-2 h-1 bg-pink-400 rounded-full opacity-60" />
                      <div className="absolute bottom-2 right-1.5 w-2 h-1 bg-pink-400 rounded-full opacity-60" />
                    </div>
                  </>
                )}

              </div>
              {/* Floating Hand Waving */}
              <motion.div
                animate={{ rotate: [-10, 20, -10] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="absolute top-0 -right-2 text-3xl cursor-pointer"
              >
                👋
              </motion.div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-sky-400">
                {isAdult ? "Gentleman Edition" : "Kid Boy Edition"}
              </p>
              <p className="text-[10px] opacity-60 italic">
                {isAdult ? '"To a year of success & prosperity!"' : '"Wishing you endless happiness!"'}
              </p>
            </div>
          </div>

          {/* Birthday Cake (Center) */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative flex flex-col items-center">
              {/* Glowing Candles */}
              <div className="flex space-x-2.5 mb-1 z-10">
                {[...Array(isAdult ? 8 : 5)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    {/* Flame */}
                    <motion.div
                      animate={{ scale: [1, 1.2, 0.9, 1.1, 1], y: [0, -2, 1, -1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6 + i * 0.1 }}
                      className="w-2 h-3 bg-gradient-to-t from-orange-500 via-yellow-400 to-yellow-200 rounded-full shadow-md shadow-yellow-400/50"
                    />
                    {/* Candle Body */}
                    <div className={`w-1.5 h-6 rounded-t-sm ${
                      i % 3 === 0 ? "bg-pink-400" : i % 3 === 1 ? "bg-cyan-400" : "bg-yellow-300"
                    }`} />
                  </div>
                ))}
              </div>

              {/* Multi-tier Cake */}
              <div className="flex flex-col items-center">
                {/* Top Tier */}
                <div className="w-24 h-10 bg-pink-100 dark:bg-pink-900 border-2 border-pink-200 dark:border-pink-800 rounded-t-xl flex items-center justify-center relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 left-0 right-0 h-3 bg-pink-400/30 rounded-b-md" />
                  <span className="text-[9px] font-black uppercase text-pink-500 dark:text-pink-300 z-10">AGE {age}</span>
                </div>
                {/* Bottom Tier */}
                <div className="w-36 h-12 bg-amber-100 dark:bg-amber-950 border-2 border-amber-200 dark:border-amber-900 rounded-t-xl flex items-center justify-center relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 left-0 right-0 h-4 bg-amber-400/30 rounded-b-md" />
                  {/* Decorative sprinkles */}
                  <div className="absolute bottom-2 left-4 w-2 h-1 bg-sky-400 rounded-full" />
                  <div className="absolute bottom-4 left-10 w-1.5 h-1.5 bg-pink-400 rounded-full" />
                  <div className="absolute bottom-2 right-6 w-2 h-1 bg-yellow-400 rounded-full" />
                  <div className="absolute bottom-5 right-12 w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-300 z-10">HAPPY BIRTHDAY</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] font-bold text-center px-4 py-1 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
              🎂 Make a Wish! 🎂
            </p>
          </div>

          {/* Woman / Girl Character Winking (Right) */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              {/* Character Avatar Box */}
              <div className="w-24 h-24 rounded-full bg-pink-400 border-4 border-white shadow-lg overflow-hidden flex items-end justify-center relative">
                
                {isAdult ? (
                  /* ADULT LADY AVATAR (18+) */
                  <>
                    {/* Elegant Rose-gold Blouse */}
                    <div className="w-20 h-16 rounded-t-3xl bg-rose-700 border border-rose-600 flex flex-col justify-start items-center pt-1 relative">
                      {/* Gold Necklace */}
                      <div className="w-8 h-4 border-b-2 border-yellow-400 rounded-b-full opacity-90 mt-[-2px] flex justify-center items-end">
                        <div className="w-1.5 h-1.5 bg-amber-300 rounded-full" />
                      </div>
                    </div>
                    {/* Gorgeous adult wavy hairstyle */}
                    <div className="absolute top-1 w-18 h-14 bg-stone-900 rounded-b-2xl flex flex-wrap justify-center overflow-hidden">
                      <div className="w-5 h-5 bg-stone-900 rotate-45 m-[-1px]" />
                      <div className="w-5 h-5 bg-stone-900 rotate-45 m-[-1px]" />
                    </div>
                    {/* Face, Lipstick & Pearl Earrings */}
                    <div className="absolute bottom-6 w-12 h-10 bg-amber-100 rounded-full flex flex-col justify-center items-center">
                      {/* Eyes (Winking) */}
                      <div className="flex space-x-4 items-center">
                        <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full" />
                        <div className="w-3 h-1 bg-zinc-900 rounded-full rotate-[-12deg]" />
                      </div>
                      {/* Warm Red-Lip Lipstick Smile */}
                      <div className="w-3.5 h-2 border-b-2 border-red-600 rounded-b-full mt-1.5 bg-red-500/30" />
                      {/* Blushing cheeks */}
                      <div className="absolute bottom-2 left-1 w-2 h-1 bg-rose-400 rounded-full opacity-50" />
                      <div className="absolute bottom-2 right-1 w-2 h-1 bg-rose-400 rounded-full opacity-50" />
                    </div>
                    {/* Pearl Earrings (sides) */}
                    <div className="absolute bottom-8 left-4 w-1.5 h-1.5 bg-yellow-50 rounded-full border border-yellow-200" />
                    <div className="absolute bottom-8 right-4 w-1.5 h-1.5 bg-yellow-50 rounded-full border border-yellow-200" />
                  </>
                ) : (
                  /* KID GIRL AVATAR (<18) */
                  <>
                    <div className="absolute top-1 w-8 h-4 bg-red-500 rounded-full rotate-12 flex justify-between items-center px-1 z-20">
                      <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />
                    </div>
                    <div className="w-20 h-16 rounded-t-3xl bg-pink-500 border border-pink-400 flex justify-center items-start pt-1">
                      <div className="w-6 h-4 bg-pink-600 rounded-full opacity-60" />
                    </div>
                    <div className="absolute top-2 w-18 h-14 bg-amber-900 rounded-b-xl flex flex-wrap justify-center overflow-hidden">
                      <div className="w-5 h-5 bg-amber-900 rotate-45 m-[-1px]" />
                      <div className="w-5 h-5 bg-amber-900 rotate-45 m-[-1px]" />
                    </div>
                    <div className="absolute bottom-6 w-12 h-10 bg-amber-100 rounded-full flex flex-col justify-center items-center">
                      <div className="flex space-x-4 items-center">
                        <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full" />
                        <div className="w-3 h-1 bg-zinc-900 rounded-full rotate-[-12deg]" />
                      </div>
                      <div className="w-3.5 h-2 border-b-2 border-zinc-900 rounded-b-full mt-1.5 bg-red-400" />
                      <div className="absolute bottom-2 left-1.5 w-2 h-1 bg-pink-400 rounded-full opacity-60" />
                      <div className="absolute bottom-2 right-1.5 w-2 h-1 bg-pink-400 rounded-full opacity-60" />
                    </div>
                  </>
                )}

              </div>
              {/* Floating Heart Accent */}
              <motion.div
                animate={{ scale: [1, 1.25, 1], y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute top-0 -left-1 text-2xl"
              >
                💖
              </motion.div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-pink-400">
                {isAdult ? "Lady Edition" : "Kid Girl Edition"}
              </p>
              <p className="text-[10px] opacity-60 italic">
                {isAdult ? '"May all your life plans blossom!"' : '"May all your dreams come true!"'}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Interactive Features Section based on Age */}
        {!isAdult ? (
          /* KID EDITION (<18): Grid of Cute Birthday Stickers */
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="text-sm font-black uppercase tracking-wider text-indigo-400">
                🌟 Your Magic Birthday Stickers Board 🌟
              </h4>
              <p className="text-[11px] opacity-75">
                Hover over your birthday stickers to reveal special magic blessings!
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {kidStickers.map((st, idx) => {
                const Icon = st.icon;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border border-white/5 bg-white/5 shadow-md cursor-pointer hover:bg-white/10 transition-colors text-center`}
                  >
                    <div className={`p-2 rounded-xl mb-1.5 ${st.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black tracking-wide">{st.label}</span>
                    <span className="text-[9px] text-pink-400 font-bold mt-0.5 uppercase tracking-widest">Happy Birthday!</span>
                  </motion.div>
                );
              })}
            </div>
            
            <p className="text-center text-xs italic text-indigo-400 font-bold mt-2">
              "Wishing you happiness, success and all the best today and always!"
            </p>
          </div>
        ) : (
          /* ADULT EDITION (18+): Classy Sticky Notes Bulletin Board with mature icons */
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="text-sm font-black uppercase tracking-wider text-amber-500 flex items-center justify-center gap-2">
                📌 Inspiring Birthday Wishes Bulletin Board 📌
              </h4>
              <p className="text-[11px] opacity-75">
                Here are warm, beautiful blessings pinned especially for you today:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-2">
              {adultStickyNotes.map((note, idx) => {
                // Pick a classy adult icon based on the note index
                const Icon = idx % 4 === 0 
                  ? Sparkle 
                  : idx % 4 === 1 
                  ? Briefcase 
                  : idx % 4 === 2 
                  ? GraduationCap 
                  : HeartHandshake;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.04, y: -4, rotate: 0 }}
                    className={`p-4 rounded-xl border-l-4 shadow-md transition-all cursor-pointer relative overflow-hidden ${note.color} ${note.rotate}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 opacity-75" />
                      <span className="text-[9px] uppercase font-black tracking-widest opacity-65">
                        {idx % 4 === 0 ? "Inspiration" : idx % 4 === 1 ? "Prosperity" : idx % 4 === 2 ? "Wisdom" : "Deep Love"}
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-relaxed">
                      "{note.text}"
                    </p>
                  </motion.div>
                );
              })}
            </div>

            <p className="text-center text-xs italic text-amber-500 font-bold mt-2">
              "May this year bring you endless happiness, success and beautiful memories!"
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
