import React from 'react';

export const SharedFormHeaderStyles: React.FC = () => (
  <style>{`
    [data-paper-preview] .official-form-header {
      margin-bottom: 1.5mm;
    }
    [data-paper-preview] .official-form-appendix {
      text-align: right;
      font-weight: 600;
      font-style: italic;
      font-size: 16pt;
      line-height: 1;
    }
    [data-paper-preview] .official-form-title-row {
      min-height: 8mm;
      height: auto;
      padding: 1mm 0;
      line-height: 1.05;
      vertical-align: middle;
      text-align: center;
    }
    [data-paper-preview] .official-form-title {
      font-size: 12pt;
      font-weight: 700;
      line-height: 1.05;
      text-align: center;
      margin: 0;
      white-space: normal;
    }
    [data-paper-preview] .official-form-subtitle {
      font-size: 9pt;
      line-height: 1;
      margin-top: 0.5mm;
      text-align: center;
    }
  `}</style>
);
