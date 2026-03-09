import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Upload, Download, FileText, File } from 'lucide-react';

const ClientDocuments = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [documents, setDocuments] = useState([
        { id: 1, name: 'Project Contract.pdf', version: 'v2.1', uploadedBy: 'John Doe', category: 'Contracts', size: '2.5 MB', date: 'Jan 15, 2026' },
        { id: 2, name: 'UI Mockups.fig', version: 'v1.3', uploadedBy: 'Jane Smith', category: 'Designs', size: '15.2 MB', date: 'Jan 18, 2026' },
        { id: 3, name: 'Progress Report Q1.docx', version: 'v1.0', uploadedBy: 'Mike Johnson', category: 'Reports', size: '1.2 MB', date: 'Jan 20, 2026' },
    ]);

    const categories = ['All', 'Contracts', 'Designs', 'Reports', 'Other'];

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <h1 className="text-3xl font-black text-white">Documents</h1>
                <button className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2">
                    <Upload size={20} />
                    Upload File
                </button>
            </motion.div>

            {/* Search & Filters */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-emerald-500/50 focus:outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl font-bold transition-all ${
                                selectedCategory === cat
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Documents Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden"
            >
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left p-6 text-zinc-400 font-bold text-sm">File Name</th>
                            <th className="text-left p-6 text-zinc-400 font-bold text-sm">Version</th>
                            <th className="text-left p-6 text-zinc-400 font-bold text-sm">Uploaded By</th>
                            <th className="text-left p-6 text-zinc-400 font-bold text-sm">Category</th>
                            <th className="text-left p-6 text-zinc-400 font-bold text-sm">Size</th>
                            <th className="text-left p-6 text-zinc-400 font-bold text-sm">Date</th>
                            <th className="text-left p-6 text-zinc-400 font-bold text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDocs.map((doc, index) => (
                            <motion.tr
                                key={doc.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="border-b border-white/5 hover:bg-white/5 transition-all"
                            >
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-zinc-400" size={20} />
                                        <span className="text-white font-bold">{doc.name}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-zinc-400">{doc.version}</td>
                                <td className="p-6 text-zinc-400">{doc.uploadedBy}</td>
                                <td className="p-6">
                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold">
                                        {doc.category}
                                    </span>
                                </td>
                                <td className="p-6 text-zinc-400">{doc.size}</td>
                                <td className="p-6 text-zinc-400">{doc.date}</td>
                                <td className="p-6">
                                    <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                        <Download className="text-zinc-400" size={18} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>

            {/* Request File Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex items-center justify-between"
            >
                <div>
                    <h3 className="text-white font-bold text-lg">Need a specific document?</h3>
                    <p className="text-zinc-400 text-sm mt-1">Request files from your team</p>
                </div>
                <button className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all">
                    Request File
                </button>
            </motion.div>
        </div>
    );
};

export default ClientDocuments;