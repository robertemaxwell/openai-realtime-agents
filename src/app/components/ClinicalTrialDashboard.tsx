import React, { useState } from 'react';

interface ClinicalTrialDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

const ClinicalTrialDashboard: React.FC<ClinicalTrialDashboardProps> = ({
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'matches' | 'saved' | 'applications'>('search');

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Clinical Trials Platform</h2>
            <p className="text-gray-600">Find and enroll in clinical trials that match your profile</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Welcome to Clinical Trials Platform</h3>
            <p className="text-gray-600 mb-6">
              Connect with clinical trials that match your medical profile. Get access to cutting-edge treatments and contribute to medical research.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-600 text-2xl mb-2">🔍</div>
                <h4 className="font-semibold">Search Trials</h4>
                <p className="text-sm text-gray-600">Find trials by condition, location, or phase</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-600 text-2xl mb-2">🎯</div>
                <h4 className="font-semibold">Smart Matching</h4>
                <p className="text-sm text-gray-600">Get personalized trial recommendations</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-purple-600 text-2xl mb-2">📋</div>
                <h4 className="font-semibold">Easy Enrollment</h4>
                <p className="text-sm text-gray-600">Streamlined application process</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-orange-600 text-2xl mb-2">🤝</div>
                <h4 className="font-semibold">Ongoing Support</h4>
                <p className="text-sm text-gray-600">Expert guidance throughout your journey</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-4">How It Works</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h5 className="font-medium">Create Your Profile</h5>
                  <p className="text-sm text-gray-600">Tell us about your medical history and preferences</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <h5 className="font-medium">Find Matching Trials</h5>
                  <p className="text-sm text-gray-600">Our AI finds trials that match your profile</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <h5 className="font-medium">Apply & Enroll</h5>
                  <p className="text-sm text-gray-600">Connect with study teams and begin your journey</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-center text-sm text-gray-600">
            <p>
              🏥 Access to over 500,000 clinical trials nationwide • 
              🔒 Your privacy is protected • 
              💬 Get support from our clinical trial specialists
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalTrialDashboard; 