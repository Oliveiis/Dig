import React from 'react';

export const WhyWorthIt: React.FC<{ text: string }> = ({ text }) => (
  <p
    className="font-sans text-[13px] text-[#555] leading-[1.7]"
    dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1a1a1a;font-weight:600">$1</strong>') }}
  />
);
