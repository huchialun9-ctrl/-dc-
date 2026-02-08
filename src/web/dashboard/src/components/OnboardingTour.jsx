import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const OnboardingTour = () => {
    const { t } = useTranslation();
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            target: '.sidebar',
            title: t('onboarding.step1.title'),
            content: t('onboarding.step1.content'),
            position: 'right',
        },
        {
            target: '.ai-chat-section',
            title: t('onboarding.step2.title'),
            content: t('onboarding.step2.content'),
            position: 'left',
        },
        {
            target: '.preview-panel',
            title: t('onboarding.step3.title'),
            content: t('onboarding.step3.content'),
            position: 'left',
        },
        {
            target: '.apply-button',
            title: t('onboarding.step4.title'),
            content: t('onboarding.step4.content'),
            position: 'top',
        },
    ];

    useEffect(() => {
        // Check if user has completed onboarding
        const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
        if (!hasCompletedOnboarding) {
            // Start onboarding after a short delay
            setTimeout(() => {
                setIsActive(true);
            }, 1000);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        localStorage.setItem('onboardingCompleted', 'true');
        setIsActive(false);
    };

    const handleComplete = () => {
        localStorage.setItem('onboardingCompleted', 'true');
        setIsActive(false);
    };

    const getTooltipPosition = () => {
        const step = steps[currentStep];
        const targetElement = document.querySelector(step.target);

        if (!targetElement) return { top: '50%', left: '50%' };

        const rect = targetElement.getBoundingClientRect();
        const position = step.position;

        switch (position) {
            case 'right':
                return {
                    top: rect.top + rect.height / 2 - 100,
                    left: rect.right + 20,
                };
            case 'left':
                return {
                    top: rect.top + rect.height / 2 - 100,
                    right: window.innerWidth - rect.left + 20,
                };
            case 'top':
                return {
                    bottom: window.innerHeight - rect.top + 20,
                    left: rect.left + rect.width / 2 - 150,
                };
            case 'bottom':
                return {
                    top: rect.bottom + 20,
                    left: rect.left + rect.width / 2 - 150,
                };
            default:
                return { top: '50%', left: '50%' };
        }
    };

    const getSpotlightStyle = () => {
        const step = steps[currentStep];
        const targetElement = document.querySelector(step.target);

        if (!targetElement) return {};

        const rect = targetElement.getBoundingClientRect();

        return {
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
        };
    };

    if (!isActive) return null;

    const currentStepData = steps[currentStep];
    const tooltipStyle = getTooltipPosition();
    const spotlightStyle = getSpotlightStyle();

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                {/* Spotlight */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute rounded-lg border-4 border-discord-blurple shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none"
                    style={spotlightStyle}
                />

                {/* Tooltip */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6"
                    style={tooltipStyle}
                >
                    {/* Close Button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-3 right-3 w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>

                    {/* Content */}
                    <div className="pr-8">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-discord-blurple/10 dark:bg-discord-blurple/20 flex items-center justify-center">
                                <span className="text-sm font-bold text-discord-blurple">
                                    {currentStep + 1}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {currentStepData.title}
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                            {currentStepData.content}
                        </p>

                        {/* Progress Dots */}
                        <div className="flex items-center gap-1.5 mb-4">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all ${idx === currentStep
                                            ? 'w-8 bg-discord-blurple'
                                            : idx < currentStep
                                                ? 'w-1.5 bg-discord-blurple/50'
                                                : 'w-1.5 bg-gray-300 dark:bg-gray-600'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleSkip}
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                {t('onboarding.skip')}
                            </button>
                            <div className="flex items-center gap-2">
                                {currentStep > 0 && (
                                    <button
                                        onClick={handlePrevious}
                                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        {t('onboarding.previous')}
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="px-4 py-2 rounded-lg bg-discord-blurple text-white text-sm font-medium hover:bg-discord-blurple/90 transition-colors flex items-center gap-1"
                                >
                                    {currentStep < steps.length - 1
                                        ? t('onboarding.next')
                                        : t('onboarding.finish')}
                                    {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OnboardingTour;
