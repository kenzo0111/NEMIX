import React from 'react';

export const SharedFormHeaderStyles: React.FC = () => (
  <style>{`
    .official-form-header {
      margin-bottom: 1.5mm;
    }
    .official-form-appendix {
      text-align: right;
      font-weight: 600;
      font-size: 8.5pt;
      line-height: 1;
    }
    .official-form-title-row {
      min-height: 8mm;
      height: auto;
      padding: 1mm 0;
      line-height: 1.05;
      vertical-align: middle;
      text-align: center;
    }
    .official-form-title {
      font-size: 12pt;
      font-weight: 700;
      line-height: 1.05;
      text-align: center;
      margin: 0;
      white-space: normal;
    }
    .official-form-subtitle {
      font-size: 9pt;
      line-height: 1;
      margin-top: 0.5mm;
      text-align: center;
    }
  `}</style>
);
