import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StateStepperProps {
  currentStep: string;
  onStepClick: (step: string) => void;
}

// Define the list of steps and their icons
const steps: { key: string; label: string; icon: React.ReactNode }[] = [
  { 
    key: 'init', 
    label: 'Welcome',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 9.3V4.7C14 3.7 13.3 3 12.3 3C11.4 3 10.6 3.7 10.6 4.6V9.3C9.6 10 9 11.1 9 12.3C9 14.3 10.7 16 12.7 16C14.7 16 16.4 14.3 16.4 12.3C16.4 11.1 15.7 10 14.7 9.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12.5 16V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.1 20C9.1 20.5 9.5 21 10.1 21H14.9C15.4 21 15.9 20.6 15.9 20V19H9.1V20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.30001 12C5.30001 8.1 8.50001 5 12.3 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18.7 12.4C18.7 8.5 15.6 5.4 11.7 5.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    key: 'description', 
    label: 'Description',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 9H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 4H5C3.895 4 3 4.895 3 6V19C3 20.105 3.895 21 5 21H19C20.105 21 21 20.105 21 19V6C21 4.895 20.105 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 17H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    key: 'details', 
    label: 'Details',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    key: 'attachments', 
    label: 'Attachments',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.4383 11.6622L12.2483 20.8522C11.1225 21.9781 9.59552 22.6106 8.00334 22.6106C6.41115 22.6106 4.88418 21.9781 3.75834 20.8522C2.63249 19.7264 2 18.1994 2 16.6072C2 15.015 2.63249 13.488 3.75834 12.3622L12.9483 3.17222C13.6989 2.42165 14.7169 2 15.7783 2C16.8398 2 17.8578 2.42165 18.6083 3.17222C19.3589 3.9228 19.7806 4.94079 19.7806 6.00222C19.7806 7.06366 19.3589 8.08165 18.6083 8.83222L9.41834 18.0222C9.04306 18.3975 8.53406 18.6083 8.00334 18.6083C7.47261 18.6083 6.96362 18.3975 6.58834 18.0222C6.21306 17.6469 6.00229 17.1379 6.00229 16.6072C6.00229 16.0765 6.21306 15.5675 6.58834 15.1922L15.0683 6.71222" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    key: 'summary', 
    label: 'Summary',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 6H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 12H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 18H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    key: 'submit', 
    label: 'Submit',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
];

// Colors object with light/dark mode support
const getColors = (isDarkMode: boolean) => ({
  // Line and active elements
  primary: '#4284ff', // Bright blue for active steps
  primaryLight: '#7fadff', // Lighter blue for completed steps
  primaryLighter: isDarkMode ? 'rgba(90, 128, 199, 0.6)' : 'rgba(177, 204, 255, 0.6)', // More transparent default circles
  primaryGlow: 'rgba(66, 132, 255, 0.5)', // Glow effect color
  primaryGradient: 'linear-gradient(180deg, #4284ff, #3b6fe9)', // Gradient for active elements

  // Text colors (kept for potential future use, but text is hidden)
  text: isDarkMode ? '#f8fafc' : '#334155', // Primary text color
  textMuted: isDarkMode ? '#94a3b8' : '#64748b', // Muted text color

  // Icon Color (Muted state icon color - more muted)
  iconMuted: isDarkMode ? 'rgba(148, 163, 184, 0.7)' : 'rgba(100, 116, 139, 0.7)', 

  // Panel (Glassmorphism)
  panelBg: isDarkMode ? 'rgba(17, 24, 39, 0.45)' : 'rgba(255, 255, 255, 0.5)', // More transparent background
  panelBorder: isDarkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(255, 255, 255, 0.4)', // More subtle border
  panelShadow: isDarkMode ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.05)', // Softer shadow
  panelInnerGlow: isDarkMode ? 'rgba(66, 132, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)', // Inner glow

  // Special icon highlights
  submitIcon: '#10b981',      // emerald-500 for submit (brighter)
  submitGlow: 'rgba(16, 185, 129, 0.5)',   // Glow for submit icon

  // Line
  trackBg: isDarkMode ? 'rgba(75, 85, 99, 0.25)' : 'rgba(203, 213, 225, 0.25)', // More transparent background line
  trackProgress: isDarkMode ? 'linear-gradient(180deg, #4284ff, #3b6fe9)' : 'linear-gradient(180deg, #4284ff, #3b6fe9)', // Gradient progress
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
  const { primary, primaryLight, primaryLighter, submitIcon, iconMuted, submitGlow } = colors;

  return (
    <div className="relative h-full w-full flex items-center justify-center px-2">
      {/* Main panel background - Enhanced glassmorphism */}
      <div 
        className="absolute inset-0 m-2 rounded-3xl transition-colors duration-200 backdrop-blur-xl"
        style={{ 
          backgroundColor: colors.panelBg,
          boxShadow: `0 4px 20px ${colors.panelShadow}, inset 0 1px 1px ${colors.panelInnerGlow}`,
          border: `1px solid ${colors.panelBorder}`,
          borderTop: `1px solid rgba(255, 255, 255, ${isDarkMode ? 0.15 : 0.6})`,
          WebkitBackdropFilter: 'blur(12px)', // For Safari compatibility
        }}
      />

      <div className="py-10 relative z-10 h-full flex flex-col justify-between items-center w-full">
        {/* Main Track Line */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 w-[2px] top-7 bottom-7 rounded-full" 
          style={{ backgroundColor: colors.trackBg }}
        />

        {/* Animated Progress Line - now with gradient and blur */}
        <motion.div 
          className="absolute left-1/2 -translate-x-1/2 w-[3px] top-7 rounded-full origin-top"
          initial={{ height: '0%' }}
          animate={{ 
            height: currentIndex === 0 
              ? '0%' 
              : currentIndex === steps.length - 1
                ? 'calc(100% - 72px)' // Subtract height of last circle + padding
                : `${(currentIndex / (steps.length - 1)) * 100}%`
          }}
          style={{ 
            background: colors.trackProgress,
            boxShadow: '0 0 4px rgba(66, 132, 255, 0.3)'
          }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut"
          }}
        />

        {/* Step Circles and Icons - Centered */}
        <div className="flex flex-col justify-between h-full w-full items-center">
          {steps.map((step, idx) => {
            // Determine step status
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;
            const isFuture = idx > currentIndex;
            
            // Special flags
            const isSubmit = step.key === 'submit';
            
            // Compute circle colors - add subtle gradient for active and completed
            const circleColor = isActive 
              ? colors.primaryGradient
              : isCompleted 
                ? primaryLight
                : primaryLighter;
            
            // Special glow for active step
            const glowEffect = isActive 
              ? `0 0 15px ${colors.primaryGlow}, 0 0 5px ${colors.primaryGlow}`
              : isSubmit
                ? `0 0 8px ${submitGlow}`
                : 'none';
                
            // Icon color with special highlights
            let iconColor: string;
            // Check for special submit icon
            if (isSubmit) {
              iconColor = submitIcon;
            } else if (isActive || isCompleted) {
              // other completed or active steps stay white
              iconColor = '#ffffff';
            } else {
              iconColor = iconMuted;
            }
            
            // Calculate responsive circle sizes
            const circleSize = isActive 
              ? 'w-[clamp(42px,3vw,52px)] h-[clamp(42px,3vw,52px)]' 
              : 'w-[clamp(36px,2.5vw,46px)] h-[clamp(36px,2.5vw,46px)]';
            
            // Calculate responsive icon sizes  
            const iconSize = isActive ? 'scale-[1.15]' : 'scale-[1]';
            
            return (
              <div key={step.key} className="flex items-center justify-center w-full relative py-2 group" title={step.label} data-step={step.key}>
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
                          `0 0 0 12px ${colors.primaryGlow}`, 
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
                    className={`${circleSize} rounded-full flex items-center justify-center relative z-10 focus:outline-none transition-all`}
                    style={{ 
                      background: typeof circleColor === 'string' ? circleColor : circleColor,
                      boxShadow: isActive 
                        ? `${glowEffect}, inset 0 0 0 1px rgba(255,255,255,0.3)` 
                        : isDarkMode 
                          ? `0 2px 4px rgba(0, 0, 0, 0.3)` 
                          : `0 2px 4px rgba(0,0,0,0.1)`
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: glowEffect || `0 0 12px ${isActive ? colors.primaryGlow : 'rgba(99, 155, 255, 0.3)'}`
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    {/* Show checkmark for completed steps, step icon for active/future steps */}
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
                      <div 
                        style={{ 
                          color: iconColor,
                          transform: iconSize,
                          transition: 'transform 0.2s ease-out'
                        }}
                      >
                        <motion.div
                          animate={isActive ? {
                            scale: [1, 1.1, 1],
                          } : {}}
                          transition={{
                            duration: 2,
                            repeat: isActive ? Infinity : 0,
                            repeatType: "loop"
                          }}
                        >
                          {step.icon}
                        </motion.div>
                      </div>
                    )}
                  </motion.button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StateStepper; 