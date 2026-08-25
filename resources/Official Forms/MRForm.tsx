import React from 'react';

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
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateString;
  }
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
  targetRows = 14 
}) => {
  const items = data.items || [];
  
  // Calculate empty rows needed to fill page cleanly without spilling
  const emptyRowsCount = Math.max(0, targetRows - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  // Calculate grand total if not provided
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
          margin: 12mm;
        }
        .mr-container {
          font-family: 'Times New Roman', Times, serif;
          font-size: 10pt;
          background: #ffffff;
          color: #000000;
          width: 100%;
          max-width: 190mm;
          margin: 0 auto;
          box-sizing: border-box;
          line-height: 1.25;
        }
        .header-appendix {
          text-align: right;
          font-style: italic;
          font-weight: bold;
          font-size: 11pt;
          margin-bottom: 2px;
        }
        .main-title {
          text-align: center;
          font-weight: bold;
          font-size: 13pt;
          margin-bottom: 2px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .sub-title {
          text-align: center;
          font-style: italic;
          font-size: 9.5pt;
          margin-bottom: 12px;
        }

        /* Top Meta Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          column-gap: 24px;
          margin-bottom: 8px;
        }
        .info-row {
          display: flex;
          align-items: flex-end;
          margin-bottom: 6px;
        }
        .info-label {
          font-weight: bold;
          white-space: nowrap;
          margin-right: 6px;
          font-size: 10pt;
        }
        .info-value {
          flex-grow: 1;
          border-bottom: 1px solid #000000;
          min-height: 18px;
          padding: 0 4px 2px 4px;
          font-weight: normal;
          font-size: 10pt;
          line-height: 1.25;
          word-break: break-word;
          box-sizing: border-box;
        }

        /* Purpose / Intro statement */
        .purpose-statement {
          margin-bottom: 10px;
          line-height: 1.35;
          text-align: justify;
          font-size: 9.5pt;
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
          padding: 3px 5px;
          font-size: 9pt;
          box-sizing: border-box;
          word-break: break-word;
          overflow-wrap: anywhere;
          vertical-align: middle;
          line-height: 1.2;
        }
        .main-table th {
          text-align: center;
          font-weight: bold;
          background-color: #ffffff;
        }
        .main-table td {
          height: 22px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }

        /* Column widths */
        .col-qty { width: 8%; }
        .col-unit { width: 8%; }
        .col-desc { width: 36%; }
        .col-prop-no { width: 18%; }
        .col-date { width: 12%; }
        .col-val { width: 18%; }

        /* Signatures Section */
        .signatures-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000000;
          border-top: none;
          table-layout: fixed;
        }
        .sig-cell {
          width: 50%;
          vertical-align: top;
          padding: 10px 14px;
          box-sizing: border-box;
        }
        .sig-cell:first-child {
          border-right: 1px solid #000000;
        }
        .sig-header {
          font-weight: bold;
          margin-bottom: 24px;
          font-size: 9.5pt;
        }
        .sig-line {
          border-bottom: 1px solid #000000;
          width: 90%;
          margin: 0 auto 3px auto;
          text-align: center;
          font-weight: bold;
          text-transform: uppercase;
          min-height: 18px;
          padding-bottom: 2px;
          font-size: 9pt;
          line-height: 1.2;
        }
        .sig-label {
          text-align: center;
          font-size: 8pt;
          line-height: 1.25;
          margin-bottom: 8px;
        }
        .sig-subinfo {
          margin-top: 8px;
          font-size: 9pt;
        }
        .sig-subrow {
          display: flex;
          align-items: flex-end;
          margin-top: 4px;
        }
        .sig-subrow .sub-label {
          width: 65px;
          font-weight: bold;
          font-size: 8.5pt;
          white-space: nowrap;
        }
        .sig-subrow .sub-val {
          flex-grow: 1;
          border-bottom: 1px solid #000000;
          min-height: 16px;
          padding: 0 4px 1px 4px;
          font-size: 8.5pt;
          line-height: 1.2;
          box-sizing: border-box;
        }

        @media print {
          body { margin: 0; padding: 0; background: #fff; }
          .mr-container { width: 100%; max-width: none; }
          .main-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mr-container">
        {/* Header Appendix */}
        <div className="header-appendix">Appendix 59-A</div>

        {/* Form Title */}
        <div className="main-title">MEMORANDUM RECEIPT FOR PROPERTY</div>
        <div className="sub-title">(MEMORANDUM OF RECEIPT)</div>

        {/* Top Info Grid */}
        <div className="info-grid">
          <div>
            <div className="info-row">
              <span className="info-label">Entity Name:</span>
              <div className="info-value">{data.entityName || '\u00A0'}</div>
            </div>
            <div className="info-row">
              <span className="info-label">Fund Cluster:</span>
              <div className="info-value">{data.fundCluster || 'Regular Agency Fund'}</div>
            </div>
          </div>
          <div>
            <div className="info-row">
              <span className="info-label">MR No. :</span>
              <div className="info-value">{data.mrNo || '\u00A0'}</div>
            </div>
            <div className="info-row">
              <span className="info-label">Date :</span>
              <div className="info-value">{data.date || formatDate(new Date().toISOString())}</div>
            </div>
          </div>
        </div>

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
              <tr key={`empty-${index}`}>
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
              <td colSpan={5} className="text-right font-bold">
                Grand Total Value:
              </td>
              <td className="text-right font-bold">
                {grandTotalDisplay}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures Section */}
        <table className="signatures-table">
          <tbody>
            <tr>
              {/* Issued By (Property Custodian) */}
              <td className="sig-cell">
                <div className="sig-header">Issued / Released by:</div>
                <div className="sig-line">
                  {data.issuedByName || 'ARSENIO GEM A. GARCILLANOSA'}
                </div>
                <div className="sig-label">
                  Signature over Printed Name of Supply and/or<br />Property Custodian
                </div>
                <div className="sig-subinfo">
                  <div className="sig-subrow">
                    <span className="sub-label">Position:</span>
                    <span className="sub-val">{data.issuedByPosition || 'SUPPLY OFFICER III / ADMIN OFFICER V'}</span>
                  </div>
                  <div className="sig-subrow">
                    <span className="sub-label">Date:</span>
                    <span className="sub-val">{data.issuedByDate || '\u00A0'}</span>
                  </div>
                </div>
              </td>

              {/* Received By (End User) */}
              <td className="sig-cell">
                <div className="sig-header">Received by:</div>
                <div className="sig-line">
                  {data.receivedByName || '\u00A0'}
                </div>
                <div className="sig-label">
                  Signature over Printed Name of End-User /<br />Accountable Officer
                </div>
                <div className="sig-subinfo">
                  <div className="sig-subrow">
                    <span className="sub-label">Position:</span>
                    <span className="sub-val">{data.receivedByPosition || '\u00A0'}</span>
                  </div>
                  <div className="sig-subrow">
                    <span className="sub-label">Office:</span>
                    <span className="sub-val">{data.receivedByOffice || '\u00A0'}</span>
                  </div>
                  <div className="sig-subrow">
                    <span className="sub-label">Date:</span>
                    <span className="sub-val">{data.receivedByDate || '\u00A0'}</span>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default MRFormPaper;
