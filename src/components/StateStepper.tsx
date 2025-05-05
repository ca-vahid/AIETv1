import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StateStepperProps {
  currentStep: string;
  onStepClick: (step: string) => void;
}

// Define the list of steps and their short-text labels
const steps: { key: string; label: string }[] = [
  { key: 'init', label: 'Init' },
  { key: 'lite_description', label: 'Description' },
  { key: 'lite_impact', label: 'Impact' },
  { key: 'decision', label: 'Decision' },
  { key: 'details', label: 'Details' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'summary', label: 'Summary' },
  { key: 'submit', label: 'Submit' },
];

// Colors object with light/dark mode support
const getColors = (isDarkMode: boolean) => ({
  // Line and active elements
  primary: '#4284ff', // Bright blue for active steps
  primaryLight: '#7fadff', // Lighter blue for completed steps
  primaryLighter: isDarkMode ? '#5a80c7' : '#b1ccff', // Very light blue for default circles (darker in dark mode)
  primaryGlow: 'rgba(66, 132, 255, 0.5)', // Glow effect color

  // Text colors
  text: isDarkMode ? '#f8fafc' : '#334155', // Primary text color
  textMuted: isDarkMode ? '#94a3b8' : '#64748b', // Muted text color
  numberText: isDarkMode ? '#ffffff' : '#1e293b', // Number text in inactive circles

  // Panel 
  panelBg: isDarkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.98)', // Panel background - darker in dark mode
  panelBorder: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(203, 213, 225, 0.8)', // Panel border
  panelShadow: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.06)', // Panel shadow

  // Line
  trackBg: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(203, 213, 225, 0.5)', // Background line - darker in dark mode
});

const StateStepper: React.FC<StateStepperProps> = ({ currentStep, onStepClick }) => {
  // Determine index of current step for connector logic
  const currentIndex = useMemo(
    () => steps.findIndex((s) => s.key === currentStep),
    [currentStep]
  );

  // Add proper dark mode detection that tracks changes
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Initial check
    const checkDarkMode = () => {
      // First check for CSS class on html - app-level theme setting
      const htmlEl = document.documentElement;
      if (htmlEl.classList.contains('dark')) {
        setIsDarkMode(true);
        return;
      }

      // Then check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
        return;
      }

      setIsDarkMode(false);
    };

    // Initial check
    checkDarkMode();

    // Set up listeners for changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => checkDarkMode();
    mediaQuery.addEventListener('change', handleMediaChange);

    // Also check for application-level theme changes
    const observer = new MutationObserver(() => {
      checkDarkMode();
    });
    
    const htmlEl = document.documentElement;
    observer.observe(htmlEl, { 
      attributes: true,
      attributeFilter: ['class']
    });

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      observer.disconnect();
    };
  }, []);

  // Get colors based on detected dark/light mode
  const colors = useMemo(() => getColors(isDarkMode), [isDarkMode]);

  return (
    <div className="relative h-full w-48 flex items-center justify-center px-2">
      {/* Main panel background */}
      <div 
        className="absolute inset-0 m-2 rounded-3xl transition-colors duration-200"
        style={{ 
          backgroundColor: colors.panelBg,
          boxShadow: `0 4px 20px ${colors.panelShadow}`,
          border: `1px solid ${colors.panelBorder}`
        }}
      />

      <div className="py-10 relative z-10 h-full flex flex-col justify-between items-center w-full">
        {/* Main Track Line */}
        <div 
          className="absolute left-8 w-[2px] top-7 bottom-7 rounded-full" 
          style={{ backgroundColor: colors.trackBg }}
        />

        {/* Animated Progress Line */}
        <motion.div 
          className="absolute left-8 w-[2px] top-7 rounded-full origin-top"
          initial={{ height: '0%' }}
          animate={{ 
            height: `${currentIndex === 0 ? 0 : (currentIndex / (steps.length - 1)) * 100}%`
          }}
          style={{ backgroundColor: colors.primary }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut"
          }}
        />

        {/* Step Circles and Labels */}
        <div className="flex flex-col justify-between h-full w-full px-4">
          {steps.map((step, idx) => {
            // Determine step status
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;
            const isFuture = idx > currentIndex;
            
            // Compute circle colors
            const circleColor = isActive 
              ? colors.primary 
              : isCompleted 
                ? colors.primaryLight
                : colors.primaryLighter;
                
            // Compute text colors - completed and active are more visible  
            const textColor = isActive 
              ? colors.text
              : isCompleted 
                ? colors.text
                : colors.textMuted;
            
            // Font weights
            const fontWeight = isActive ? 600 : isCompleted ? 500 : 400;
            
            // Text opacity for future items
            const textOpacity = isFuture ? 0.7 : 1;
            
            return (
              <div key={step.key} className="flex items-center w-full relative py-2">
                {/* Circle and indicator */}
                <div className="flex items-center relative">
                  {/* Glow effect for active step */}
                  {isActive && (
                    <motion.div 
                      className="absolute inset-0 rounded-full z-0"
                      initial={{ boxShadow: `0 0 0 0px ${colors.primaryGlow}` }}
                      animate={{ 
                        boxShadow: [
                          `0 0 0 0px ${colors.primaryGlow}`,
                          `0 0 0 8px ${colors.primaryGlow}`, 
                          `0 0 0 0px ${colors.primaryGlow}`
                        ]
                      }}
                      transition={{ 
                        duration: 2.5, 
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                    />
                  )}
                  
                  {/* Circle button */}
                  <motion.button
                    onClick={() => onStepClick(step.key)}
                    className="w-[36px] h-[36px] rounded-full flex items-center justify-center relative z-10 focus:outline-none transition-all"
                    style={{ 
                      backgroundColor: circleColor,
                      boxShadow: isActive 
                        ? `0 0 15px ${colors.primaryGlow}, inset 0 0 0 1px rgba(255,255,255,0.2)` 
                        : isDarkMode 
                          ? `0 2px 4px rgba(0, 0, 0, 0.3)` 
                          : `0 2px 4px rgba(0,0,0,0.1)`
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: `0 0 12px ${isActive ? colors.primaryGlow : 'rgba(99, 155, 255, 0.3)'}`
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    {/* Show checkmark for completed steps, otherwise number */}
                    {isCompleted ? (
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 16 16" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white"
                      >
                        <path 
                          d="M4 8L7 11L12 5" 
                          stroke="white" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <span 
                        className="text-sm font-semibold"
                        style={{ 
                          color: isActive ? '#ffffff' : isDarkMode ? '#ffffff' : colors.numberText
                        }}
                      >
                        {idx + 1}
                      </span>
                    )}
                  </motion.button>
                </div>
                
                {/* Step label */}
                <motion.div 
                  className="ml-4 flex-1"
                  initial={{ x: 0, opacity: 0.7 }}
                  animate={{ 
                    x: isActive ? 2 : 0,
                    opacity: isActive ? 1 : textOpacity
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <span 
                    className="whitespace-nowrap transition-all duration-300 text-base"
                    style={{ 
                      color: textColor,
                      fontWeight,
                      opacity: isFuture ? 0.7 : 1
                    }}
                  >
                    {step.label}
                  </span>
                  
                  {/* Active indicator pulse - small blue dot */}
                  {isActive && (
                    <motion.div 
                      className="inline-block ml-2 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                      animate={{ 
                        opacity: [1, 0.4, 1],
                        scale: [1, 0.8, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StateStepper; 