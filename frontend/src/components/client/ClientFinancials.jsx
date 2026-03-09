import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Download, TrendingUp, AlertCircle, FileDown } from 'lucide-react';

const ClientFinancials = () => {
    const [invoices, setInvoices] = useState([
        { id: 'INV-001', issueDate: 'Jan 1, 2026', dueDate: 'Jan 15, 2026', amount: 50000, status: 'paid' },
        { id: 'INV-002', issueDate: 'Jan 15, 2026', dueDate: 'Jan 30, 2026', amount: 75000, status: 'pending' },
        { id: 'INV-003', issueDate: 'Dec 15, 2025', dueDate: 'Dec 30, 2025', amount: 30000, status: 'overdue' },
    ]);

    const outstandingBalance = invoices
        .filter(inv => inv.status !== 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0);

    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0);
    const percentagePaid = (totalPaid / totalBilled) * 100;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            case 'pending':
                return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
            case 'overdue':
                return 'bg-red-500/20 text-red-400 border border-red-500/30';
            default:
                return 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30';
        }
    };

    return (
        <div className="space-y-6">
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-black text-white"
            >
                Financials & Billing
            </motion.h1>

            {/* Top Cards */}
            <div className="grid grid-cols-3 gap-6">
                {/* Outstanding Balance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-red-900/20 to-zinc-900 border border-red-500/30 rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">Outstanding Balance</h3>
                        <AlertCircle className="text-red-500" size={24} />
                    </div>
                    <p className="text-4xl font-black text-white mb-4">₹{outstandingBalance.toLocaleString()}</p>
                    <button className="w-full px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all">
                        Pay Now
                    </button>
                </motion.div>

                {/* Total Billed */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-zinc-900 border border-white/10 rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">Total Billed</h3>
                        <DollarSign className="text-emerald-500" size={24} />
                    </div>
                    <p className="text-4xl font-black text-white mb-2">₹{totalBilled.toLocaleString()}</p>
                    <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-zinc-400">Paid</span>
                            <span className="text-white font-bold">{percentagePaid.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${percentagePaid}%` }} />
                        </div>
                    </div>
                </motion.div>

                {/* Billing Support */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-zinc-900 border border-blue-500/30 rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">Billing Support</h3>
                        <TrendingUp className="text-blue-500" size={24} />
                    </div>
                    <p className="text-zinc-400 text-sm mb-4">Need help with your billing?</p>
                    <p className="text-white font-bold mb-4">24/7 assistance available</p>
                    <button className="w-full px-4 py-3 bg-blue-500/20 text-blue-400 font-bold rounded-xl hover:bg-blue-500/30 transition-all">
                        Contact Support
                    </button>
                </motion.div>
            </div>

            {/* Invoice Ledger */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden"
            >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-black text-white">Invoice Ledger</h2>
                    <button className="px-4 py-2 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center gap-2">
                        <FileDown size={16} />
                        Download CSV
                    </button>
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left p-6 text-zinc-400 font-bold text-sm">Invoice #</th>
                            <th className="text-left p-6 text-zinc-400 font-bold text-sm">Issue Date</th>
                            <th className="text-left p-6 text-zinc-400 font-bold text-sm">Due Date</th>
                            <th className="text-left p-6 text-zinc-400 font-bold text-sm">Amount</th>
                            <th className="text-left p-6 text-zinc-400 font-bold text-sm">Status</th>
                            <th className="text-left p-6 text-zinc-400 font-bold text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((invoice, index) => (
                            <motion.tr
                                key={invoice.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + index * 0.05 }}
                                className="border-b border-white/5 hover:bg-white/5 transition-all"
                            >
                                <td className="p-6 text-white font-bold">{invoice.id}</td>
                                <td className="p-6 text-zinc-400">{invoice.issueDate}</td>
                                <td className="p-6 text-zinc-400">{invoice.dueDate}</td>
                                <td className="p-6 text-white font-bold">₹{invoice.amount.toLocaleString()}</td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusBadge(invoice.status)}`}>
                                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                    </span>
                                </td>
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
        </div>
    );
};

export default ClientFinancials;