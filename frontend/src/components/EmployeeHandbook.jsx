import React, { useState } from 'react';
import { X, Search, BookOpen, ChevronRight, AlertCircle } from 'lucide-react';
import { developmentHandbook } from '../data/handbooks/development';

const EmployeeHandbook = ({ isOpen, onClose }) => {
    const [activeSection, setActiveSection] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const handbook = developmentHandbook;

    // Filter sections based on search
    const filteredSections = handbook.sections.filter(section =>
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeContent = handbook.sections.find(s => s.id === activeSection);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <BookOpen className="h-8 w-8" />
                            <div>
                                <h2 className="text-2xl font-bold">{handbook.title}</h2>
                                <p className="text-blue-100 text-sm mt-1">{handbook.subtitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-blue-200">Managed by:</span>
                            <span className="ml-2 font-semibold">{handbook.managedBy}</span>
                        </div>
                        <div>
                            <span className="text-blue-200">Escalation:</span>
                            <span className="ml-2 font-semibold">{handbook.escalation}</span>
                        </div>
                        <div>
                            <span className="text-blue-200">Version:</span>
                            <span className="ml-2 font-semibold">{handbook.version}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - Table of Contents */}
                    <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
                        {/* Search */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search handbook..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Table of Contents */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Contents
                            </h3>
                            <nav className="space-y-1">
                                {filteredSections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between group ${activeSection === section.id
                                                ? 'bg-blue-100 text-blue-700 font-medium'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="flex items-center space-x-2">
                                            <span className="text-sm">{section.id}.</span>
                                            <span className="text-sm">{section.title}</span>
                                        </span>
                                        <ChevronRight className={`h-4 w-4 transition-transform ${activeSection === section.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                                            }`} />
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {activeContent ? (
                            <div className="max-w-3xl">
                                {/* Section Title */}
                                <div className="mb-6">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                                            Section {activeContent.id}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl font-bold text-gray-900">{activeContent.title}</h1>
                                </div>

                                {/* Non-Negotiable Principles (Section 1) */}
                                {activeContent.id === 1 && activeContent.principles && (
                                    <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                                        <div className="flex items-start space-x-3">
                                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h3 className="font-semibold text-amber-900 mb-2">Non-Negotiable Principles:</h3>
                                                <ul className="space-y-1">
                                                    {activeContent.principles.map((principle, idx) => (
                                                        <li key={idx} className="text-amber-800 flex items-start">
                                                            <span className="mr-2">•</span>
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
                                    <div className="prose prose-blue max-w-none">
                                        {activeContent.content.split('\n\n').map((paragraph, idx) => {
                                            // Check if it's a list
                                            if (paragraph.startsWith('•') || paragraph.match(/^\d+\./)) {
                                                const items = paragraph.split('\n');
                                                return (
                                                    <ul key={idx} className="list-none space-y-2 my-4">
                                                        {items.map((item, itemIdx) => (
                                                            <li key={itemIdx} className="flex items-start text-gray-700">
                                                                <span className="mr-3 text-blue-600 font-bold">
                                                                    {item.match(/^[•\d.]+/)?.[0] || '•'}
                                                                </span>
                                                                <span>{item.replace(/^[•\d.]+\s*/, '')}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                );
                                            }

                                            // Check if it's a heading (starts with **)
                                            if (paragraph.startsWith('**')) {
                                                const text = paragraph.replace(/\*\*/g, '');
                                                return (
                                                    <h3 key={idx} className="text-lg font-semibold text-gray-900 mt-6 mb-3">
                                                        {text}
                                                    </h3>
                                                );
                                            }

                                            // Regular paragraph
                                            return (
                                                <p key={idx} className="text-gray-700 leading-relaxed mb-4">
                                                    {paragraph}
                                                </p>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Core Principles (Section 15) */}
                                {activeContent.id === 15 && activeContent.principles && (
                                    <div className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 p-6 rounded-xl">
                                        <h3 className="font-bold text-xl text-gray-900 mb-4">Core Principles</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {activeContent.principles.map((principle, idx) => (
                                                <div key={idx} className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm">
                                                    <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                                                    <span className="text-gray-800 font-medium">{principle}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-12 pt-6 border-t border-gray-200">
                                    <button
                                        onClick={() => setActiveSection(Math.max(1, activeSection - 1))}
                                        disabled={activeSection === 1}
                                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeSection === 1
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                            }`}
                                    >
                                        ← Previous
                                    </button>
                                    <button
                                        onClick={() => setActiveSection(Math.min(15, activeSection + 1))}
                                        disabled={activeSection === 15}
                                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeSection === 15
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                            }`}
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                    <p>No sections found matching "{searchTerm}"</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeHandbook;
