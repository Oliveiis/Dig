import React from 'react';

interface SectionHeaderProps {
  label: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ label }) => (
  <div className="flex items-center gap-2 mb-[7px]">
    <span className="font-mono text-[9px] text-[#aaa] tracking-[0.08em] whitespace-nowrap">{label}</span>
    <div className="flex-1 h-[0.5px] bg-[#e8e8e8]" />
  </div>
);
