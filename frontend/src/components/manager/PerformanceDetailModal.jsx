import React from 'react';
import {
    X,
    CheckCircle,
    Clock,
    AlertTriangle,
    TrendingUp,
    Calendar,
    Target,
    Award,
    FileText,
    Download
} from 'lucide-react';

const PerformanceDetailModal = ({ isOpen, onClose, employee, data }) => {
    if (!isOpen || !employee || !data) return null;

    const { summary, employeeDetails } = data;
    const { tasks, evaluations, attendance, leaves } = employeeDetails;

    // Safety fallback for numeric values
    const safeNum = (val) => (typeof val === 'number' && !isNaN(val)) ? val : 0;

    // Generate Report Function
    const handleGenerateReport = () => {
        // Create print-friendly HTML
        const printWindow = window.open('', '', 'width=800,height=600');
        const reportHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Performance Report - ${employee.name}</title>
    <style>
        @page {
            size: A4;
            margin: 1.5cm;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            background: #fff;
            padding: 20px;
        }
        h1 {
            font-size: 24pt;
            color: #1e40af;
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 3px solid #3b82f6;
        }
        h2 {
            font-size: 16pt;
            color: #1e40af;
            margin: 25px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #ddd;
        }
        .subtitle {
            text-align: center;
            color: #666;
            font-size: 10pt;
            margin-bottom: 30px;
        }
        .info-box {
            background-color: #f0f7ff;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
            page-break-inside: avoid;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            page-break-inside: avoid;
        }
        table th {
            background-color: #f5f5f5;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #ccc;
        }
        table td {
            padding: 10px;
            border: 1px solid #ccc;
        }
        .metric-row td {
            text-align: center;
            background-color: #f9f9f9;
            font-weight: bold;
            vertical-align: middle;
        }
        .metric-label {
            font-size: 9pt;
            color: #666;
            text-transform: uppercase;
            display: block;
            margin-bottom: 5px;
        }
        .metric-value {
            font-size: 20pt;
            color: #1e40af;
            display: block;
        }
        .status-completed { background-color: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 4px; display: inline-block; }
        .status-in-progress { background-color: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 4px; display: inline-block; }
        .status-not-started { background-color: #f3f4f6; color: #374151; padding: 4px 10px; border-radius: 4px; display: inline-block; }
        .status-overdue { background-color: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 4px; display: inline-block; }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            font-size: 9pt;
            color: #666;
        }
        .no-data {
            text-align: center;
            padding: 30px;
            color: #999;
            font-style: italic;
        }
        .info-label {
            font-weight: bold;
            color: #333;
        }
        .print-button {
            display: block;
            margin: 20px auto;
            padding: 12px 30px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14pt;
            cursor: pointer;
            font-weight: bold;
        }
        .print-button:hover {
            background: #2563eb;
        }
        @media print {
            .print-button {
                display: none;
            }
            body {
                padding: 0;
            }
            .info-box, table th, .status-completed, .status-in-progress, .status-not-started, .status-overdue {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">📥 Save as PDF (Press Ctrl+P or Cmd+P)</button>
    
    <h1>Performance Report</h1>
    <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}</div>

    <!-- Employee Information -->
    <div class="info-box">
        <h2>Employee Information</h2>
        <table>
            <tr>
                <td style="width:25%;" class="info-label">Name:</td>
                <td style="width:25%;">${employee.name}</td>
                <td style="width:25%;" class="info-label">Employee ID:</td>
                <td style="width:25%;">${employee.employeeId || employee.id || 'N/A'}</td>
            </tr>
            <tr>
                <td class="info-label">Email:</td>
                <td>${employee.email || 'N/A'}</td>
                <td class="info-label">Join Date:</td>
                <td>${new Date(employee.createdAt || Date.now()).toLocaleDateString()}</td>
            </tr>
        </table>
    </div>

    <!-- Core Performance Metrics -->
    <h2>Core Performance Metrics</h2>
    <table>
        <tr class="metric-row">
            <td>
                <span class="metric-label">Total Points</span>
                <span class="metric-value">${safeNum(summary.totalPoints)}</span>
            </td>
            <td>
                <span class="metric-label">Completion Rate</span>
                <span class="metric-value">${safeNum(summary.completionRate)}%</span>
            </td>
            <td>
                <span class="metric-label">Active Tasks</span>
                <span class="metric-value">${safeNum(summary.inProgressTasks) + safeNum(summary.notStartedTasks)}</span>
            </td>
        </tr>
    </table>

    <!-- Attendance Tracking -->
    <h2>Attendance Tracking</h2>
    <table>
        <tr>
            <td style="width:25%;" class="info-label">Attendance Rate:</td>
            <td style="width:25%;">${attendance?.attendancePercentage || 0}%</td>
            <td style="width:25%;" class="info-label">Punctuality Rate:</td>
            <td style="width:25%;">${attendance?.punctualityPercentage || 0}%</td>
        </tr>
        <tr>
            <td class="info-label">Days Present:</td>
            <td>${attendance?.totalAttendedDays || 0}</td>
            <td class="info-label">Late Count:</td>
            <td>${attendance?.lateDays || 0}</td>
        </tr>
    </table>

    <!-- Leave Summary -->
    <h2>Leave Summary</h2>
    <table>
        <tr>
            <td style="width:25%;" class="info-label">Total Applied:</td>
            <td style="width:25%;">${leaves?.totalAppliedDays || 0} days</td>
            <td style="width:25%;" class="info-label">Total Approved:</td>
            <td style="width:25%;">${leaves?.totalApprovedDays || 0} days</td>
        </tr>
    </table>

    <!-- Performance Task Logs -->
    <h2>Performance Task Logs</h2>
    ${tasks && tasks.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th style="width:35%;">Task Title</th>
                    <th style="width:20%;">Project</th>
                    <th style="width:15%;">Status</th>
                    <th style="width:20%;">Deadline</th>
                    <th style="width:10%;">Points</th>
                </tr>
            </thead>
            <tbody>
                ${tasks.map(task => `
                    <tr>
                        <td>${task.title || 'N/A'}</td>
                        <td>${task.project || 'Internal'}</td>
                        <td><span class="status-${task.status?.toLowerCase().replace(/\s+/g, '-')}">${task.status || 'N/A'}</span></td>
                        <td>${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</td>
                        <td style="font-weight:bold; text-align:center;">${task.points || 0}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    ` : '<div class="no-data">No task records available</div>'}

    <!-- Formal Evaluations -->
    <h2>Formal Evaluation History</h2>
    ${evaluations && evaluations.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th style="width:30%;">Evaluation Period</th>
                    <th style="width:25%;">Status</th>
                    <th style="width:25%;">Total Score</th>
                    <th style="width:20%;">Date</th>
                </tr>
            </thead>
            <tbody>
                ${evaluations.map(evalItem => `
                    <tr>
                        <td>${evalItem.evaluationPeriod || 'N/A'}</td>
                        <td><span class="status-${evalItem.status?.toLowerCase()}">${evalItem.status || 'N/A'}</span></td>
                        <td style="font-weight:bold; text-align:center;">${evalItem.derivedFields?.totalScore || 0}</td>
                        <td>${evalItem.createdAt ? new Date(evalItem.createdAt).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    ` : '<div class="no-data">No formal evaluations recorded yet</div>'}

    <div class="footer">
        <p><strong>THE HUSTLE SYSTEM</strong> - Performance Management Report</p>
        <p>This is an automatically generated document. For any queries, please contact HR department.</p>
    </div>
    
    <script>
        // Auto-trigger print dialog after page loads
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>
        `;

        printWindow.document.write(reportHTML);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header - Ultra Compact */}
                <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 leading-tight">{employee.name}</h2>
                            <span className="text-[9px] font-bold text-gray-500 flex items-center gap-1">
                                <Clock className="h-2 w-2" />
                                Joined {new Date(employee.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/30">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        {/* Sidebar - Stats & Attendance */}
                        <div className="space-y-3">
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    Core Performance
                                </h3>
                                <div className="grid grid-cols-1 gap-1.5">
                                    <div className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Total Points</p>
                                        <p className="text-xl font-black text-purple-600">{safeNum(summary.totalPoints)}</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Completion</p>
                                        <p className="text-xl font-black text-blue-600">{safeNum(summary.completionRate)}%</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm relative overflow-hidden group">
                                        <div className="relative z-10">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Active Tasks</p>
                                            <p className="text-xl font-black text-orange-600">
                                                {safeNum(summary.inProgressTasks) + safeNum(summary.notStartedTasks)}
                                            </p>
                                        </div>
                                        <AlertTriangle className="absolute -right-1 -bottom-1 h-8 w-8 text-orange-50/50" />
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Section */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Attendance Tracking
                                </h3>
                                <div className="space-y-1.5">
                                    <div className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm relative overflow-hidden">
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Attendance %</p>
                                                <p className="text-xl font-black text-gray-900">{attendance?.attendancePercentage || 0}%</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Punctuality</p>
                                                <p className="text-xl font-black text-green-600">{attendance?.punctualityPercentage || 0}%</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div
                                                className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${attendance?.attendancePercentage || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2.5 bg-white rounded-xl border border-gray-100 text-center">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Present Count</p>
                                            <p className="text-lg font-black text-gray-900">{attendance?.totalAttendedDays || 0}</p>
                                        </div>
                                        <div className="p-2.5 bg-white rounded-xl border border-gray-100 text-center">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Late Count</p>
                                            <p className="text-lg font-black text-red-500">{attendance?.lateDays || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Leave Section - Applied vs Approved */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5" />
                                    Leave Summary
                                </h3>
                                <div className="space-y-1.5">
                                    <div className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm relative overflow-hidden">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Total Applied</p>
                                                <p className="text-xl font-black text-gray-900">{leaves?.totalAppliedDays || 0} D</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Approved</p>
                                                <p className="text-xl font-black text-green-600">{leaves?.totalApprovedDays || 0} D</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div
                                                className="bg-green-500 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${leaves?.totalAppliedDays > 0 ? (leaves?.totalApprovedDays / leaves?.totalAppliedDays) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    {leaves?.details?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase ml-1">Recent Approved</p>
                                            {leaves.details.slice(0, 2).map((l, i) => (
                                                <div key={i} className="flex justify-between text-[10px] font-medium p-2 bg-gray-50 border border-gray-100 rounded-lg">
                                                    <span className="text-gray-600 capitalize">{l.type}</span>
                                                    <span className="text-gray-900 font-bold">{l.days} days</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-3 space-y-4">
                            {/* Task Breakdown */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                                        <Target className="h-4 w-4 text-blue-600" />
                                        Performance Task Logs
                                    </h3>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {tasks?.length || 0} Total Tasks
                                    </span>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-md z-10">
                                                <tr>
                                                    <th className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Task Details</th>
                                                    <th className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Project</th>
                                                    <th className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                                    <th className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Points</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {tasks?.length > 0 ? tasks.map((task, idx) => (
                                                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                                        <td className="px-3 py-2">
                                                            <p className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{task.title}</p>
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <Calendar className="h-2.5 w-2.5 text-gray-400" />
                                                                <span className="text-[9px] font-bold text-gray-500 uppercase">
                                                                    {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <span className="text-[9px] font-black text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                                                {task.project || 'Internal'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                                                    task.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                                                        'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {task.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <span className="text-base font-black text-purple-600 font-mono tracking-tighter">
                                                                {safeNum(task.points)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">No tasks found for this period</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Evaluation Grid */}
                            <div>
                                <h3 className="text-sm font-black text-gray-900 mb-2 flex items-center gap-1.5">
                                    <Award className="h-4 w-4 text-yellow-500" />
                                    Formal Evaluation History
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {evaluations?.length > 0 ? evaluations.map((evalItem, idx) => (
                                        <div key={idx} className="p-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm">
                                                    {evalItem.derivedFields?.grade || 'N/A'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 capitalize">
                                                        {new Date(evalItem.evaluationPeriod.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">By {evalItem.manager?.firstName}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{evalItem.status}</p>
                                                <p className="text-[10px] font-bold text-gray-400">{evalItem.derivedFields?.totalScore || 0} Points</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-full py-10 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center">
                                            <Award className="h-10 w-10 text-gray-200 mb-2" />
                                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest text-center px-4">
                                                No formal evaluations recorded for this employee yet.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Ultra Compact */}
                <div className="px-3 py-2 border-t border-gray-100 bg-white flex justify-end gap-2">
                    <button
                        onClick={handleGenerateReport}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 flex items-center gap-1.5"
                    >
                        <Download className="h-3 w-3" />
                        Generate Report
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-all font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PerformanceDetailModal;
