import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import EmployeeHandbook from './EmployeeHandbook';

const HandbookButton = () => {
    const [showHandbook, setShowHandbook] = useState(false);

    return (
        <>
            {/* Handbook Button - Fixed to right side, below Notes button */}
            <button
                onClick={() => setShowHandbook(true)}
                className="fixed right-0 top-1/2 translate-y-16 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-l-2xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:pr-6 group"
                title="Employee Handbook"
            >
                <div className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6" />
                    <span className="text-sm font-semibold hidden group-hover:inline-block whitespace-nowrap">
                        Handbook
                    </span>
                </div>
            </button>

            {/* Handbook Modal */}
            <EmployeeHandbook
                isOpen={showHandbook}
                onClose={() => setShowHandbook(false)}
            />
        </>
    );
};

export default HandbookButton;
