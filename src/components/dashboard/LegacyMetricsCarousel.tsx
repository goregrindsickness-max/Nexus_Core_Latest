import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, DollarSign, Package } from 'lucide-react';

export function LegacyMetricsCarousel({ todayRevenue, topSellerName, totalItemsSold, totalInventoryValue }: any) {
  const [currentMetricIndex, setCurrentMetricIndex] = useState(0);
  const [isMetricCarouselPaused, setIsMetricCarouselPaused] = useState(false);

  const metrics = [
    {
      id: "revenue",
      title: "Today's Revenue",
      value: `$${todayRevenue.toFixed(2)}`,
      color: "#00d195",
      textColor: "text-[#00ffcc]",
      bgClass: "from-emerald-950/15 via-zinc-900/10 to-emerald-900/15",
      borderClass: "border-[#00d195]/40 hover:border-[#00d195]",
      dotClass: "bg-[#00ffcc]",
      icon: <DollarSign className="w-3.5 h-3.5 text-[#00d195]" />
    },
    {
      id: "topseller",
      title: "Top Seller",
      value: topSellerName.length > 22 ? topSellerName.substring(0, 20) + "..." : topSellerName,
      color: "#a3e635",
      textColor: "text-[#a3e635]",
      bgClass: "from-lime-950/15 via-zinc-900/10 to-lime-950/15",
      borderClass: "border-[#a3e635]/40 hover:border-[#a3e635]",
      dotClass: "bg-[#a3e635]",
      icon: <TrendingUp className="w-3.5 h-3.5 text-[#a3e635]" />
    },
    {
      id: "itemsold",
      title: "Items Sold",
      value: totalItemsSold.toString(),
      color: "#2dd4bf",
      textColor: "text-[#2dd4bf]",
      bgClass: "from-teal-950/15 via-zinc-900/10 to-teal-950/15",
      borderClass: "border-[#2dd4bf]/40 hover:border-[#2dd4bf]",
      dotClass: "bg-[#2dd4bf]",
      icon: <Package className="w-3.5 h-3.5 text-[#2dd4bf]" />
    },
    {
      id: "totalvalue",
      title: "Inventory Value",
      value: `$${totalInventoryValue.toFixed(2)}`,
      color: "#f59e0b",
      textColor: "text-[#f59e0b]",
      bgClass: "from-amber-950/15 via-zinc-900/10 to-amber-950/15",
      borderClass: "border-[#f59e0b]/40 hover:border-[#f59e0b]",
      dotClass: "bg-[#f59e0b]",
      icon: <TrendingUp className="w-3.5 h-3.5 text-[#f59e0b]" />
    }
  ];

  // Assuming an effect in parent handles auto-play, or we can just render the logic:
  React.useEffect(() => {
    if (isMetricCarouselPaused) return;
    const interval = setInterval(() => {
      setCurrentMetricIndex((prev) => (prev + 1) % metrics.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isMetricCarouselPaused, metrics.length]);

  return (
      <div 
        onMouseEnter={() => setIsMetricCarouselPaused(true)}
        onMouseLeave={() => setIsMetricCarouselPaused(false)}
        onClick={() => setCurrentMetricIndex(prev => (prev + 1) % metrics.length)}
        className={`w-full bg-gradient-to-r ${metrics[currentMetricIndex].bgClass} border-2 ${metrics[currentMetricIndex].borderClass.replace('border-', 'border-[') || 'border-[#252830]'} rounded-xl flex flex-col items-center justify-center relative cursor-pointer select-none group transition-all duration-300 overflow-hidden`}
        style={{ height: '83.626px' }}
      >
        {/* Carousel Item with sliding and scaling animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMetricIndex}
            initial={{ opacity: 1, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 1, y: -10, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="w-full flex flex-col items-center justify-center px-4"
          >
            <span className="text-[10px] uppercase font-mono tracking-widest flex items-center justify-center gap-1.5 font-bold" style={{ color: metrics[currentMetricIndex].color }}>
              {metrics[currentMetricIndex].icon}
              {metrics[currentMetricIndex].title}
            </span>
            
            <span className={`${
              metrics[currentMetricIndex].id === 'topseller' ? 'text-[19px]' : 'text-2xl'
            } font-display font-extrabold ${metrics[currentMetricIndex].textColor} tracking-tight py-1.5 transition-all duration-300 whitespace-nowrap`}>
              {metrics[currentMetricIndex].value}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Pagination dots container */}
        <div className="absolute bottom-1.5 flex gap-1.5 z-10 justify-center w-full">
          {metrics.map((m, idx) => (
            <button
              key={`${m.id}-${idx}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentMetricIndex(idx);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                currentMetricIndex === idx 
                  ? `${m.dotClass} scale-125 shadow-[0_0_6px_var(--tw-shadow-color)]` 
                  : "bg-zinc-700/80 hover:bg-zinc-500"
              }`}
            />
          ))}
        </div>
      </div>
  );
}
