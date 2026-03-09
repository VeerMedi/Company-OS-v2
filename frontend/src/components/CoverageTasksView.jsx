import React from 'react';
import { Users, Award, Target, User, Calendar, FileText } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const CoverageTasksView = ({ coverageStats, coverageTasks }) => {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Coverage Tasks</h2>
                <div className="text-sm text-gray-600">
                    Helping teammates during their leave
                </div>
            </div>

            {/* Coverage Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600">Tasks Covered</p>
                            <p className="text-3xl font-bold text-blue-900 mt-2">{coverageStats.tasksCovered}</p>
                        </div>
                        <Users className="h-12 w-12 text-blue-400" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">Coverage Points</p>
                            <p className="text-3xl font-bold text-green-900 mt-2">{coverageStats.pointsFromCoverage}</p>
                        </div>
                        <Award className="h-12 w-12 text-green-400" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600">Coverage Rate</p>
                            <p className="text-3xl font-bold text-purple-900 mt-2">{coverageStats.coverageRate}%</p>
                        </div>
                        <Target className="h-12 w-12 text-purple-400" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-amber-600">Covered For</p>
                            <p className="text-sm font-bold text-amber-900 mt-2">
                                {coverageStats.coveredFor && coverageStats.coveredFor.length > 0
                                    ? coverageStats.coveredFor.join(', ')
                                    : 'None'}
                            </p>
                        </div>
                        <User className="h-12 w-12 text-amber-400" />
                    </div>
                </div>
            </div>

            {/* Coverage Tasks List */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Tasks Completed for Others</h3>
                    <p className="text-sm text-gray-600 mt-1">Tasks you completed while covering for teammates on leave</p>
                </div>

                {coverageTasks.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No coverage tasks yet</p>
                        <p className="text-sm text-gray-500 mt-2">When you help teammates during their leave, tasks will appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {coverageTasks.map((task) => (
                            <div key={task._id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-lg font-semibold text-gray-900">{task.title}</h4>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                Coverage Task
                                            </span>
                                        </div>

                                        {task.description && (
                                            <p className="text-gray-600 mb-3">{task.description}</p>
                                        )}

                                        <div className="flex items-center gap-6 text-sm flex-wrap">
                                            {task.coveredFor && (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600">
                                                        Covered for: <span className="font-medium text-gray-900">
                                                            {task.coveredFor.firstName} {task.coveredFor.lastName}
                                                        </span>
                                                    </span>
                                                </div>
                                            )}

                                            {task.project && (
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600">{task.project.name}</span>
                                                </div>
                                            )}

                                            {task.completedAt && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600">
                                                        Completed: {formatDate(task.completedAt)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="ml-4 flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                                            <Award className="h-5 w-5" />
                                            <span className="text-lg font-bold">+{task.points} pts</span>
                                        </div>
                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                            Completed
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Points Breakdown */}
            {coverageStats.totalPoints > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Points Breakdown</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="text-gray-700">Own Tasks Points</span>
                            <span className="text-xl font-bold text-blue-900">{coverageStats.ownTasksPoints}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span className="text-gray-700">Coverage Points</span>
                            <span className="text-xl font-bold text-green-900">{coverageStats.pointsFromCoverage}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                            <span className="text-gray-900 font-semibold">Total Points</span>
                            <span className="text-2xl font-bold text-purple-900">{coverageStats.totalPoints}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoverageTasksView;
