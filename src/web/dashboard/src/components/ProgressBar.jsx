import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader } from 'lucide-react';

const ProgressBar = ({ progress, status, message }) => {
    // status: 'preparing' | 'building' | 'success' | 'error'

    const getStatusIcon = () => {
        switch (status) {
            case 'success':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Loader className="w-5 h-5 text-discord-blurple animate-spin" />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'success':
                return 'bg-green-500';
            case 'error':
                return 'bg-red-500';
            case 'building':
                return 'bg-discord-blurple';
            default:
                return 'bg-gray-300 dark:bg-gray-600';
        }
    };

    if (!status || status === 'idle') return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4"
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
                {/* Status Icon and Message */}
                <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon()}
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {message || 'Processing...'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {progress}% complete
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full ${getStatusColor()} rounded-full relative overflow-hidden`}
                    >
                        {status === 'building' && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                animate={{
                                    x: ['-100%', '200%'],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'linear',
                                }}
                            />
                        )}
                    </motion.div>
                </div>

                {/* Steps Indicator (optional) */}
                {status === 'building' && (
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Creating channels...</span>
                        <span>{Math.floor(progress / 20)}/5 steps</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ProgressBar;
