import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, ChevronRight, AlertCircle, Book } from 'lucide-react';
import { developmentHandbook } from '../data/handbooks/development';

const CenteredHandbookModal = ({ isOpen, onClose }) => {
    const [activeSection, setActiveSection] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');



    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handbook = developmentHandbook;

    // Filter sections based on search
    const filteredSections = handbook.sections.filter(section =>
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeContent = handbook.sections.find(s => s.id === activeSection);

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-6xl h-[85vh] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-b border-white/10 p-5 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <BookOpen className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{handbook.title}</h2>
                                <p className="text-gray-400 text-sm mt-1">{handbook.subtitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs md:text-sm text-gray-400">
                        <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <span className="text-gray-500 mr-2">Managed by:</span>
                            <span className="text-blue-300 font-medium">{handbook.managedBy}</span>
                        </div>
                        <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <span className="text-gray-500 mr-2">Escalation:</span>
                            <span className="text-purple-300 font-medium">{handbook.escalation}</span>
                        </div>
                        <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <span className="text-gray-500 mr-2">Version:</span>
                            <span className="text-green-300 font-medium">{handbook.version}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - Table of Contents */}
                    <div className="w-80 border-r border-white/10 flex flex-col bg-gray-900/50">
                        {/* Search */}
                        <div className="p-4 border-b border-white/10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search handbook..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                        {/* Table of Contents */}
                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                                Contents
                            </h3>
                            <nav className="space-y-0.5">
                                {filteredSections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center justify-between group ${activeSection === section.id
                                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/20'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs w-5 h-5 flex items-center justify-center rounded ${activeSection === section.id ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-gray-500'
                                                }`}>
                                                {section.id}
                                            </span>
                                            <span className="text-sm font-medium line-clamp-1">{section.title}</span>
                                        </div>
                                        <ChevronRight className={`h-3 w-3 transition-transform ${activeSection === section.id ? 'opacity-100 text-blue-400' : 'opacity-0 group-hover:opacity-50'
                                            }`} />
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-gray-900">
                        {activeContent ? (
                            <div className="max-w-4xl mx-auto">
                                {/* Section Title */}
                                <div className="mb-8 border-b border-white/10 pb-6">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                            SECTION {activeContent.id}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl font-bold text-white">{activeContent.title}</h1>
                                </div>

                                {/* Non-Negotiable Principles (Section 1) */}
                                {activeContent.id === 1 && activeContent.principles && (
                                    <div className="mb-8 bg-amber-500/10 border-l-4 border-amber-500 p-5 rounded-r-lg">
                                        <div className="flex items-start space-x-3">
                                            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h3 className="font-bold text-amber-400 mb-2">Non-Negotiable Principles:</h3>
                                                <ul className="space-y-2">
                                                    {activeContent.principles.map((principle, idx) => (
                                                        <li key={idx} className="text-amber-200/80 flex items-start text-sm">
                                                            <span className="mr-2 text-amber-500">•</span>
                                                            <span>{principle}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Content */}
                                {activeContent.content && (
                                    <div className="space-y-6 text-gray-300 leading-relaxed">
                                        {activeContent.content.split('\n\n').map((paragraph, idx) => {
                                            // Check if it's a list
                                            if (paragraph.startsWith('•') || paragraph.match(/^\d+\./)) {
                                                const items = paragraph.split('\n');
                                                return (
                                                    <ul key={idx} className="bg-black/20 rounded-xl p-5 space-y-3 border border-white/5">
                                                        {items.map((item, itemIdx) => (
                                                            <li key={itemIdx} className="flex items-start">
                                                                <span className="mr-3 text-blue-400 font-bold mt-1">
                                                                    {item.match(/^[•\d.]+/)?.[0] || '•'}
                                                                </span>
                                                                <span className="text-gray-300">{item.replace(/^[•\d.]+\s*/, '')}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                );
                                            }

                                            // Check if it's a heading (starts with **)
                                            if (paragraph.startsWith('**')) {
                                                const text = paragraph.replace(/\*\*/g, '');
                                                return (
                                                    <h3 key={idx} className="text-xl font-bold text-white mt-8 mb-4 flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                                        {text}
                                                    </h3>
                                                );
                                            }

                                            // Regular paragraph
                                            return (
                                                <p key={idx} className="text-gray-300">
                                                    {paragraph}
                                                </p>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Core Principles (Section 15) */}
                                {activeContent.id === 15 && activeContent.principles && (
                                    <div className="mt-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-6 rounded-xl">
                                        <h3 className="font-bold text-xl text-white mb-4 flex items-center gap-2">
                                            <Book className="h-5 w-5 text-blue-400" />
                                            Core Principles
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {activeContent.principles.map((principle, idx) => (
                                                <div key={idx} className="flex items-center space-x-3 bg-black/40 p-4 rounded-lg border border-white/5">
                                                    <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                                    <span className="text-gray-200 font-medium text-sm">{principle}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-12 pt-6 border-t border-white/10">
                                    <button
                                        onClick={() => setActiveSection(Math.max(1, activeSection - 1))}
                                        disabled={activeSection === 1}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${activeSection === 1
                                            ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setActiveSection(Math.min(15, activeSection + 1))}
                                        disabled={activeSection === 15}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${activeSection === 15
                                            ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                                            }`}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <div className="bg-white/5 p-4 rounded-full inline-block mb-4">
                                        <Search className="h-8 w-8 text-gray-600" />
                                    </div>
                                    <p className="text-gray-400">No sections found matching "{searchTerm}"</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CenteredHandbookModal;
