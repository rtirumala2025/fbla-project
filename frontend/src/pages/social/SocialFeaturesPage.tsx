import React, { useState } from 'react';
import { FriendsList, Leaderboard, PublicProfiles } from '../../features/social';
import { Users, Trophy, Search } from 'lucide-react';

type Tab = 'friends' | 'leaderboard' | 'profiles';

export function SocialFeaturesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'friends', label: 'Friends', icon: <Users className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { id: 'profiles', label: 'Browse Profiles', icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Social Hub</h1>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'friends' && <FriendsList />}
          {activeTab === 'leaderboard' && <Leaderboard />}
          {activeTab === 'profiles' && <PublicProfiles />}
        </div>
      </div>
    </div>
  );
}
