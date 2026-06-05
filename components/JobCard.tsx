
import React, { useState, useEffect } from 'react';
import { Job, StudentProfile } from '../types';
import { IconClock, IconMapPin, IconZap, IconVerify } from './Icons';
import { calculateMatchScore } from '../services/geminiService';
import { audioService } from '../services/audioService';
import CompanyLogo from './CompanyLogo';

interface JobCardProps {
  job: Job;
  student: StudentProfile;
  onApply: (jobId: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, student, onApply }) => {
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const fetchScore = async () => {
      const score = await calculateMatchScore(job, student);
      setMatchScore(score);
    };
    fetchScore();
  }, [job, student]);

  const handleApply = () => {
    audioService.playPop();
    setIsApplying(true);
    setTimeout(() => {
      onApply(job.id);
      setIsApplying(false);
    }, 800);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 hover:shadow-md transition-shadow hover:border-gray-200 transition-all duration-300">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <CompanyLogo companyName={job.company} size="md" />
          <div>
            <h3 className="font-bold text-md text-gray-900 leading-tight">{job.title}</h3>
            <p className="text-gray-500 text-xs font-semibold">{job.company}</p>
          </div>
        </div>
        {matchScore !== null && (
          <div className="flex flex-col items-end shrink-0">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              matchScore > 80 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
              {matchScore}% Match
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-y-3 mb-4">
        <div className="flex items-center text-gray-600 text-sm">
          <IconClock className="w-4 h-4 mr-2 text-blue-500" />
          <span>{job.duration}</span>
        </div>
        <div className="flex items-center text-gray-600 text-sm">
          <IconMapPin className="w-4 h-4 mr-2 text-blue-500" />
          <span>{job.workType === 'Online' ? 'Remote' : job.city}</span>
        </div>
        <div className="flex items-center text-gray-600 text-sm">
          <IconZap className="w-4 h-4 mr-2 text-orange-500" />
          <span className="font-medium">{job.startTime}</span>
        </div>
        <div className="flex items-center">
          <span className="text-blue-600 font-bold text-lg">{job.hourlyRate} kr/h</span>
        </div>
      </div>

      {/* Employer Requirements Section */}
      {job.employerRequirements && job.employerRequirements.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Arbetsgivarens krav</p>
          <div className="flex flex-wrap gap-1.5">
            {job.employerRequirements.map((req, idx) => (
              <span key={idx} className="bg-gray-50 text-gray-600 text-[10px] font-semibold px-2 py-1 rounded-md border border-gray-100 flex items-center">
                <IconVerify className="w-2.5 h-2.5 mr-1 text-blue-400" /> {req}
              </span>
            ))}
          </div>
        </div>
      )}

      {job.workingConditions && (
        <div className="mb-5 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Arbetsförhållanden</p>
          <p className="text-xs text-blue-800 leading-relaxed italic">"{job.workingConditions}"</p>
        </div>
      )}

      <div className="flex gap-2">
        <button 
          onClick={handleApply}
          disabled={isApplying}
          className={`flex-1 font-semibold py-3 px-4 rounded-xl transition-all duration-200 ${
            isApplying 
            ? 'bg-green-500 text-white cursor-default' 
            : 'bg-blue-600 text-white active:scale-95 hover:bg-blue-700'
          }`}
        >
          {isApplying ? 'Skickat!' : 'Snabbansök'}
        </button>
      </div>
      
      {job.isQuickShift && (
        <p className="mt-3 text-[10px] uppercase tracking-wider text-orange-600 font-bold flex items-center justify-center">
          <IconZap className="w-3 h-3 mr-1" /> Snabb-pass: Boka direkt
        </p>
      )}
    </div>
  );
};

export default JobCard;
