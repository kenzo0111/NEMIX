import React from 'react';
import { formatDisplayDate, getLocalDateString } from '@/utils/dateUtils';

// --- Interfaces ---

export interface MrItem {
  quantity?: number | string;
  unit?: string;
  description?: string;
  propertyNo?: string;
  dateAcquired?: string;
  unitValue?: number | string;
  totalValue?: number | string;
}

export interface MrData {
  appendixNumber?: string;
  entityName?: string;
  fundCluster?: string;
  mrNo?: string;
  date?: string;
  purpose?: string;

  items?: MrItem[];
  grandTotal?: number | string;

  // Signatories - Received By (End User)
  receivedByName?: string;
  receivedByPosition?: string;
  receivedByOffice?: string;
  receivedByDate?: string;

  // Signatories - Issued By (Property / Supply Officer)
  issuedByName?: string;
  issuedByPosition?: string;
  issuedByOffice?: string;
  issuedByDate?: string;
}

export interface MRFormProps {
  data: MrData;
  targetRows?: number;
}

// --- Helper Functions ---

const formatDate = (dateString?: string) => {
  if (!dateString) return '\u00A0';
  return formatDisplayDate(dateString, 'MM/DD/YYYY') || '\u00A0';
};

const formatFundCluster = (val?: string | null): string => {
  if (!val || val === '01' || val === 'General Fund' || val === 'Regular Agency Fund') {
    return '01 - Regular Agency Fund';
  }
  return val;
};

const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null || amount === '') return '\u00A0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '\u00A0';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const renderDescription = (text?: string) => {
  if (!text) return '\u00A0';
  return text.split('\n').map((str, index, array) => (
    <React.Fragment key={index}>
      {str}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ));
};

export const MRFormPaper: React.FC<MRFormProps> = ({ 
  data, 
  targetRows = 10 
}) => {
  const items = data.items || [];
  const emptyRowsCount = Math.max(0, targetRows - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  const computedTotal = items.reduce((sum, item) => {
    const val = item.totalValue ?? (Number(item.quantity || 0) * Number(item.unitValue || 0));
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const grandTotalDisplay = data.grandTotal !== undefined 
    ? formatCurrency(data.grandTotal) 
    : (computedTotal > 0 ? formatCurrency(computedTotal) : '\u00A0');

  return (
    <>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        .mr-container {
          font-family: 'Times New Roman', Times, serif;
          font-size: 8.5pt;
          background: #ffffff;
          color: #000000;
          width: 100%;
          max-width: 194mm;
          margin: 0 auto;
          box-sizing: border-box;
          line-height: 1.15;
        }
        .header-appendix {
          text-align: right;
          font-style: italic;
          font-weight: bold;
          font-size: 9pt;
          margin-bottom: 1mm;
          line-height: 1.1;
        }
        .main-title {
          text-align: center;
          font-weight: bold;
          font-size: 11.5pt;
          margin-bottom: 1.2mm;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          line-height: 1.15;
        }
        .sub-title {
          text-align: center;
          font-style: italic;
          font-size: 8.5pt;
          margin-bottom: 1.5mm;
          line-height: 1.1;
        }

        /* Purpose statement */
        .purpose-statement {
          margin-bottom: 1.5mm;
          line-height: 1.2;
          text-align: justify;
          font-size: 8.5pt;
        }

        /* Main Table Grid */
        .main-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000000;
          table-layout: fixed;
        }
        .main-table th, .main-table td {
          border: 1px solid #000000;
          padding: 0.6mm 1mm;
          font-size: 8pt;
          box-sizing: border-box;
          word-break: break-word;
          overflow-wrap: anywhere;
          vertical-align: middle;
          line-height: 1.1;
        }
        .main-table th {
          text-align: center;
          font-weight: bold;
          background-color: #ffffff;
          padding: 0.8mm 1mm;
        }
        .empty-row td {
          height: 4mm !important;
          min-height: 4mm !important;
          padding: 0 1mm !important;
          line-height: 1 !important;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }

        /* Column widths */
        .col-qty { width: 6%; }
        .col-unit { width: 7%; }
        .col-desc { width: 36%; }
        .col-prop-no { width: 21%; }
        .col-date { width: 14%; }
        .col-val { width: 16%; }

        /* Signatures Section */
        .signatures-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000000;
          border-top: none;
          table-layout: fixed;
          height: auto;
          min-height: auto;
        }
        .sig-cell {
          width: 50%;
          vertical-align: top;
          padding: 1.5mm 2.5mm;
          box-sizing: border-box;
        }
        .sig-cell:first-child {
          border-right: 1px solid #000000;
        }
        .sig-header {
          font-weight: bold;
          margin-bottom: 4.5mm;
          font-size: 8.5pt;
          line-height: 1.1;
        }

        @media print {
          body { margin: 0; padding: 0; background: #fff; }
          .mr-container { width: 100%; max-width: none; margin: 0 auto; padding: 0; }
          .main-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header-appendix, .main-title, .sub-title, .purpose-statement, .mr-top-info {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .signatures-table {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .main-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .main-table thead {
            display: table-header-group;
          }
        }
      `}</style>

      <div className="mr-container">
        {/* Header Appendix */}
        <div className="header-appendix">{data.appendixNumber || 'Appendix 59-A'}</div>

        {/* Form Title */}
        <div className="main-title">MEMORANDUM RECEIPT FOR PROPERTY</div>
        <div className="sub-title">(MEMORANDUM OF RECEIPT)</div>

        {/* Top Info Grid with explicit column widths to prevent collapse */}
        <table className="mr-top-info" style={{ width: '100%', marginBottom: '6px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '85px' }} />
            <col style={{ width: '280px' }} />
            <col style={{ width: '25px' }} />
            <col style={{ width: '85px' }} />
            <col style={{ width: '230px' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ fontWeight: 'bold', fontSize: '8.5pt', verticalAlign: 'middle', padding: '1.5px 0' }}>
                Entity Name:
              </td>
              <td style={{ borderBottom: '1px solid #000000', padding: '1.5px 4px', verticalAlign: 'middle', fontSize: '8.5pt', lineHeight: 1.1 }}>
                {data.entityName || '\u00A0'}
              </td>
              <td>&nbsp;</td>
              <td style={{ fontWeight: 'bold', fontSize: '8.5pt', verticalAlign: 'middle', padding: '1.5px 0' }}>
                MR No. :
              </td>
              <td style={{ borderBottom: '1px solid #000000', padding: '1.5px 4px', verticalAlign: 'middle', fontSize: '8.5pt', lineHeight: 1.1 }}>
                {data.mrNo || '\u00A0'}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', fontSize: '8.5pt', verticalAlign: 'middle', padding: '3px 0 1.5px 0' }}>
                Fund Cluster:
              </td>
              <td style={{ borderBottom: '1px solid #000000', padding: '3px 4px 1.5px 4px', verticalAlign: 'middle', fontSize: '8.5pt', lineHeight: 1.1 }}>
                {formatFundCluster(data.fundCluster)}
              </td>
              <td>&nbsp;</td>
              <td style={{ fontWeight: 'bold', fontSize: '8.5pt', verticalAlign: 'middle', padding: '3px 0 1.5px 0' }}>
                Date :
              </td>
              <td style={{ borderBottom: '1px solid #000000', padding: '3px 4px 1.5px 4px', verticalAlign: 'middle', fontSize: '8.5pt', lineHeight: 1.1 }}>
                {formatDisplayDate(data.date || getLocalDateString(), 'MM/DD/YYYY')}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Purpose Statement */}
        <div className="purpose-statement">
          I hereby acknowledge to have received from <strong>{data.issuedByName || 'ARSENIO GEM A. GARCILLANOSA'}</strong>, {data.issuedByPosition || 'SUPPLY OFFICER III / PROPERTY CUSTODIAN'}, the following property for which I am responsible, subject to the provisions of law, and which will be used in <strong>{data.receivedByOffice || data.purpose || 'Official Business'}</strong>:
        </div>

        {/* Main Items Table */}
        <table className="main-table">
          <thead>
            <tr>
              <th className="col-qty">Qty.</th>
              <th className="col-unit">Unit</th>
              <th className="col-desc">Description / Item Name</th>
              <th className="col-prop-no">Property No. / Serial No.</th>
              <th className="col-date">Date Acquired</th>
              <th className="col-val">Unit Value / Cost</th>
            </tr>
          </thead>
          <tbody>
            {/* Populated Items */}
            {items.map((item, index) => (
              <tr key={index}>
                <td className="text-center">{item.quantity !== undefined && item.quantity !== null && item.quantity !== '' ? item.quantity : '\u00A0'}</td>
                <td className="text-center">{item.unit || '\u00A0'}</td>
                <td className="text-left">{renderDescription(item.description)}</td>
                <td className="text-center">{item.propertyNo || '\u00A0'}</td>
                <td className="text-center">{formatDate(item.dateAcquired)}</td>
                <td className="text-right">{formatCurrency(item.unitValue)}</td>
              </tr>
            ))}

            {/* Empty Padding Rows */}
            {emptyRows.map((_, index) => (
              <tr key={`empty-${index}`} className="empty-row">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}

            {/* Total Row */}
            <tr>
              <td colSpan={5} className="text-right font-bold" style={{ padding: '0.6mm 1mm' }}>
                Grand Total Value:
              </td>
              <td className="text-right font-bold" style={{ padding: '0.6mm 1mm' }}>
                {grandTotalDisplay}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures Section with structured table rows */}
        <table className="signatures-table">
          <tbody>
            <tr>
              {/* Issued By (Property Custodian) */}
              <td className="sig-cell">
                <div className="sig-header">Issued / Released by:</div>
                <table style={{ width: '85%', margin: '0 auto 4px auto', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '0 2px 2px 2px', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', fontSize: '9pt', lineHeight: 1.15 }}>
                        {data.issuedByName || 'ARSENIO GEM A. GARCILLANOSA'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', textAlign: 'center', fontSize: '7pt', paddingTop: '2px', lineHeight: 1.1 }}>
                        Signature over Printed Name of Supply and/or<br />Property Custodian
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: '100%', marginTop: '4px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '60px' }} />
                    <col style={{ width: '220px' }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', fontWeight: 'bold', fontSize: '8pt', verticalAlign: 'middle', padding: '1.5px 0' }}>
                        Position:
                      </td>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '1.5px 4px', verticalAlign: 'middle', fontSize: '8pt', lineHeight: 1.1 }}>
                        {data.issuedByPosition || 'SUPPLY OFFICER III / ADMIN OFFICER V'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', fontWeight: 'bold', fontSize: '8pt', verticalAlign: 'middle', padding: '3px 0 1.5px 0' }}>
                        Date:
                      </td>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '3px 4px 1.5px 4px', verticalAlign: 'middle', fontSize: '8pt', lineHeight: 1.1 }}>
                        {data.issuedByDate || '\u00A0'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>

              {/* Received By (End User) */}
              <td className="sig-cell">
                <div className="sig-header">Received by:</div>
                <table style={{ width: '85%', margin: '0 auto 4px auto', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '0 2px 2px 2px', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', fontSize: '9pt', lineHeight: 1.15 }}>
                        {data.receivedByName || '\u00A0'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', textAlign: 'center', fontSize: '7pt', paddingTop: '2px', lineHeight: 1.1 }}>
                        Signature over Printed Name of End-User /<br />Accountable Officer
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: '100%', marginTop: '4px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '60px' }} />
                    <col style={{ width: '220px' }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', fontWeight: 'bold', fontSize: '8pt', verticalAlign: 'middle', padding: '1.5px 0' }}>
                        Position:
                      </td>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '1.5px 4px', verticalAlign: 'middle', fontSize: '8pt', lineHeight: 1.1 }}>
                        {data.receivedByPosition || '\u00A0'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', fontWeight: 'bold', fontSize: '8pt', verticalAlign: 'middle', padding: '3px 0 1.5px 0' }}>
                        Office:
                      </td>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '3px 4px 1.5px 4px', verticalAlign: 'middle', fontSize: '8pt', lineHeight: 1.1 }}>
                        {data.receivedByOffice || '\u00A0'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', fontWeight: 'bold', fontSize: '8pt', verticalAlign: 'middle', padding: '3px 0 1.5px 0' }}>
                        Date:
                      </td>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '3px 4px 1.5px 4px', verticalAlign: 'middle', fontSize: '8pt', lineHeight: 1.1 }}>
                        {data.receivedByDate || '\u00A0'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default MRFormPaper;
