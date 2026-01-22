import { motion } from 'framer-motion';
import { useState } from 'react';
import { X, Check, Sparkles, Globe, Zap, Database, MessageSquare, Shield, Users, Clock } from 'lucide-react';

const ProblemsAndSolutions = () => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const features = [
        {
            icon: Globe,
            problem: "Limited Language Support",
            problemDesc: "Most AI agents only work in English",
            solution: "7 Languages Supported",
            solutionDesc: "English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi",
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: Zap,
            problem: "No Real-time Interaction",
            problemDesc: "Slow response times and delays",
            solution: "Instant Responses",
            solutionDesc: "Powered by Groq's lightning-fast AI engine",
            color: "from-purple-500 to-pink-500"
        },
        // {
        //     icon: Database,
        //     problem: "Complex Integration",
        //     problemDesc: "Difficult to connect with existing systems",
        //     solution: "Simple Setup",
        //     solutionDesc: "Connect your Supabase database in minutes",
        //     color: "from-green-500 to-emerald-500"
        // },
        {
            icon: MessageSquare,
            problem: "No CRM Integration",
            problemDesc: "Manual tracking of customer interactions",
            solution: "Built-in CRM",
            solutionDesc: "Automatic call logging and customer tracking",
            color: "from-orange-500 to-red-500"
        },
        {
            icon: Users,
            problem: "No User Management",
            problemDesc: "Can't track individual users",
            solution: "User Dashboard",
            solutionDesc: "Complete user profiles and appointment history",
            color: "from-indigo-500 to-purple-500"
        },
        {
            icon: Clock,
            problem: "Limited Availability",
            problemDesc: "Only works during business hours",
            solution: "24/7 Availability",
            solutionDesc: "AI agent works round the clock",
            color: "from-pink-500 to-rose-500"
        },
        {
            icon: Shield,
            problem: "Security Concerns",
            problemDesc: "Data privacy and security issues",
            solution: "Enterprise Security",
            solutionDesc: "End-to-end encryption and secure authentication",
            color: "from-teal-500 to-cyan-500"
        }
    ];

    return (
        <section id="features" className="py-10 px-4 bg-black relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-8"
                >
                    {/* <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 rounded-full mb-6"
                    >
                        <Sparkles size={16} className="text-white" />
                        <span className="text-sm font-bold text-white">Why Choose Callix?</span>
                    </motion.div> */}

                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Questions & Answers: Traditional AI vs <span className="text-purple-400">Callix</span>
                    </h2>
                    <p className="text-gray-400 text-base max-w-2xl mx-auto">
                        Hover over each card to see how we solve traditional limitations
                    </p>
                </motion.div>

                {/* Full Width Flex Cards */}
                <div className="flex gap-4 w-full h-[300px]">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        const isHovered = hoveredIndex === index;

                        return (
                            <motion.div
                                key={index}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                className={`relative cursor-pointer transition-all duration-500 ${isHovered ? 'flex-[3]' : 'flex-1'}`}
                                style={{
                                    minWidth: isHovered ? '350px' : '100px'
                                }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <motion.div
                                    className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-500 ${isHovered ? 'bg-gray-900 border-2 border-gray-700' : `bg-gradient-to-br ${feature.color}`
                                        }`}
                                    style={{
                                        height: '280px'
                                    }}
                                >
                                    {/* Collapsed State - Vertical Text */}
                                    {!isHovered && (
                                        <div className="h-full flex flex-col items-center justify-center p-4 text-white relative">
                                            <Icon size={36} className="mb-4" />
                                            <div className="writing-mode-vertical text-center">
                                                <p className="text-sm font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
                                                    {feature.solution}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Expanded State */}
                                    {isHovered && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="p-5 h-full flex flex-col"
                                        >
                                            {/* Problem Section - Top */}
                                            <div className="mb-4 pb-4 border-b border-gray-700">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="w-6 h-6 rounded-full bg-red-900 flex items-center justify-center">
                                                        <X size={12} className="text-red-400" />
                                                    </div>
                                                    <h4 className="font-semibold text-red-400 text-xs">Traditional AI</h4>
                                                </div>
                                                <h3 className="text-base font-bold text-white mb-1">
                                                    {feature.problem}
                                                </h3>
                                                <p className="text-xs text-gray-400 leading-relaxed">
                                                    {feature.problemDesc}
                                                </p>
                                            </div>

                                            {/* Solution Section - Bottom */}
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                                                        <Check size={12} className="text-white" />
                                                    </div>
                                                    <h4 className="font-semibold text-purple-400 text-xs">Callix Solution</h4>
                                                </div>
                                                <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color}`}>
                                                    <Icon size={28} className="mb-2 text-white" />
                                                    <h3 className="text-base font-bold text-white mb-1">
                                                        {feature.solution}
                                                    </h3>
                                                    <p className="text-xs text-white font-medium opacity-90 leading-relaxed">
                                                        {feature.solutionDesc}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mt-8"
                >
                    {/* <p className="text-xl font-bold text-white mb-4">
                        Experience all these features today
                    </p>
                    <motion.button
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Start Free Trial
                    </motion.button> */}
                </motion.div>
            </div>

            <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </section>
    );
};

export default ProblemsAndSolutions;
