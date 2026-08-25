import React from 'react';

// --- Interfaces ---

export interface RSMIItem {
  risNo: string;
  responsibilityCenterCode: string;
  stockNo: string;
  itemDescription: string;
  unit: string;
  quantityIssued: number | string | null;
  unitCost: number | string | null;
  amount: number | string | null;
}

export interface RSMIRecapitulation {
  stockNo: string;
  quantity: number | string | null;
  unitCost: number | string | null;
  totalCost: number | string | null;
  uacsObjectCode: string;
}

export interface RSMIFormProps {
  data: {
    entityName: string;
    fundCluster: string;
    serialNo: string;
    date: string;
    issuedItems: RSMIItem[];
    recapitulationItems: RSMIRecapitulation[];
    supplyCustodianName: string;
    accountingStaffName: string;
    accountingDate: string;
  };
}

export const RSMIFormPaper: React.FC<RSMIFormProps> = ({ data }) => {
  // Pad main table to 18 rows so it fits on one A4 portrait page
  const items = data.issuedItems || [];
  const targetRowCount = 18;
  const paddedItems = [...items, ...Array(Math.max(0, targetRowCount - items.length)).fill({})];

  // Pad recapitulation table to 6 rows
  const recap = data.recapitulationItems || [];
  const recapTargetCount = 6;
  const paddedRecap = [...recap, ...Array(Math.max(0, recapTargetCount - recap.length)).fill({})];

  return (
    <>
      <style>{`
        @page {
            size: A4 portrait;
            margin: 12mm;
        }
        .rsmi-container {
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
            font-size: 11pt;
            margin-bottom: 4px;
            font-weight: bold;
        }
        .main-title {
            text-align: center;
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 14px;
            letter-spacing: 0.5px;
        }
        
        /* Top Info Grid */
        .info-grid {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            column-gap: 30px;
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

        /* Main Table Grid */
        .main-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000000;
            table-layout: fixed;
        }
        .main-table th, .main-table td {
            border: 1px solid #000000;
            padding: 3px 4px;
            font-size: 9pt;
            word-break: break-word;
            overflow-wrap: anywhere;
            box-sizing: border-box;
            vertical-align: middle;
            line-height: 1.2;
        }
        .main-table th {
            text-align: center;
            font-weight: bold;
            background-color: #ffffff;
        }
        .main-table td {
            height: 20px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        
        .header-italic {
            font-style: italic;
            font-weight: normal !important;
        }

        /* Footer / Signatures */
        .footer-cell {
            vertical-align: top !important;
            padding: 8px !important;
            height: 105px;
        }
        .certify-text {
            margin-bottom: 24px;
            font-size: 9pt;
        }
        .signature-area {
            text-align: center;
            width: 85%;
            margin: 0 auto;
        }
        .posted-text {
            margin-bottom: 16px;
            font-size: 9pt;
        }
        .accounting-sigs {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            text-align: center;
            padding: 0 4px;
            margin-top: 10px;
        }
        .sig-main {
            flex-grow: 1;
            margin-right: 12px;
        }
        .sig-date {
            width: 100px;
        }
        .sig-line {
            border-bottom: 1px solid #000000;
            min-height: 18px;
            padding-bottom: 2px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9pt;
            line-height: 1.2;
        }
        .sig-label {
            font-size: 8pt;
            margin-top: 3px;
            line-height: 1.2;
        }

        /* Ensure borders match precisely */
        .border-bottom-bold { border-bottom: 1.5px solid #000000 !important; }

        @media print {
            body { margin: 0; padding: 0; background: #fff; }
            .rsmi-container { width: 100%; max-width: none; }
            .main-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="rsmi-container">
        <div className="header-appendix">Appendix 64</div>
        <div className="main-title">REPORT OF SUPPLIES AND MATERIALS ISSUED</div>

        {/* Top Info */}
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
                    <span className="info-label">Serial No. :</span>
                    <div className="info-value">{data.serialNo || '\u00A0'}</div>
                </div>
                <div className="info-row">
                    <span className="info-label">Date :</span>
                    <div className="info-value">{data.date || '\u00A0'}</div>
                </div>
            </div>
        </div>

        {/* Main 9-Column Grid Table */}
        <table className="main-table">
          <colgroup>
             <col style={{width: '8%'}} />  {/* C1: RIS No. */}
             <col style={{width: '13%'}} /> {/* C2: RCC */}
             <col style={{width: '10%'}} /> {/* C3: Stock No. */}
             <col style={{width: '26%'}} /> {/* C4: Item */}
             <col style={{width: '7%'}} />  {/* C5: Unit */}
             <col style={{width: '9%'}} />  {/* C6: Qty Issued */}
             <col style={{width: '10%'}} /> {/* C7: Unit Cost */}
             <col style={{width: '9%'}} />  {/* C8: Amount / Total Cost */}
             <col style={{width: '8%'}} />  {/* C9: Amount / UACS */}
          </colgroup>
          <thead>
            <tr>
              <th colSpan={6} className="header-italic">To be filled up by the Supply and/or Property Division/Unit</th>
              <th colSpan={3} className="header-italic">To be filled up by the Accounting Division/Unit</th>
            </tr>
            <tr>
              <th>RIS No.</th>
              <th>Responsibility<br/>Center Code</th>
              <th>Stock No.</th>
              <th>Item</th>
              <th>Unit</th>
              <th>Quantity<br/>Issued</th>
              <th>Unit Cost</th>
              <th colSpan={2}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* Upper Section: Main Items */}
            {paddedItems.map((item, idx) => (
              <tr key={`item-${idx}`}>
                <td className="text-center">{item.risNo || '\u00A0'}</td>
                <td className="text-center">{item.responsibilityCenterCode || '\u00A0'}</td>
                <td className="text-center">{item.stockNo || '\u00A0'}</td>
                <td className="text-left">{item.itemDescription || '\u00A0'}</td>
                <td className="text-center">{item.unit || '\u00A0'}</td>
                <td className="text-right">{item.quantityIssued !== undefined && item.quantityIssued !== null && item.quantityIssued !== '' ? item.quantityIssued : '\u00A0'}</td>
                <td className="text-right">{item.unitCost || '\u00A0'}</td>
                <td colSpan={2} className="text-right">{item.amount || '\u00A0'}</td>
              </tr>
            ))}

            {/* Lower Section: Recapitulation Headers */}
            <tr className="border-bottom-bold">
              <td colSpan={6} className="text-center font-bold">Recapitulation:</td>
              <td colSpan={3} className="text-center font-bold">Recapitulation:</td>
            </tr>
            <tr>
              <td colSpan={3} className="text-center font-bold">Stock No.</td>
              <td colSpan={3} className="text-center font-bold">Quantity</td>
              <td className="text-center font-bold">Unit Cost</td>
              <td className="text-center font-bold">Total Cost</td>
              <td className="text-center font-bold">UACS Object Code</td>
            </tr>

            {/* Lower Section: Recapitulation Rows */}
            {paddedRecap.map((r, idx) => (
              <tr key={`recap-${idx}`}>
                <td colSpan={3} className="text-center">{r.stockNo || '\u00A0'}</td>
                <td colSpan={3} className="text-center">{r.quantity !== undefined && r.quantity !== null && r.quantity !== '' ? r.quantity : '\u00A0'}</td>
                <td className="text-right">{r.unitCost || '\u00A0'}</td>
                <td className="text-right">{r.totalCost || '\u00A0'}</td>
                <td className="text-center">{r.uacsObjectCode || '\u00A0'}</td>
              </tr>
            ))}

            {/* Footer / Signatures - Integrated as a table row to maintain perfect vertical alignment */}
            <tr>
              <td colSpan={6} className="footer-cell">
                <div className="certify-text">I hereby certify to the correctness of the above information.</div>
                <div className="signature-area">
                  <div className="sig-line">{data.supplyCustodianName || '\u00A0'}</div>
                  <div className="sig-label">Signature over Printed Name of Supply and/or<br/>Property Custodian</div>
                </div>
              </td>
              <td colSpan={3} className="footer-cell" style={{ borderLeft: '1.5px solid #000000' }}>
                <div className="posted-text">Posted by:</div>
                <div className="accounting-sigs">
                  <div className="sig-main">
                    <div className="sig-line">{data.accountingStaffName || '\u00A0'}</div>
                    <div className="sig-label">Signature over Printed Name of<br/>Designated Accounting Staff</div>
                  </div>
                  <div className="sig-date">
                    <div className="sig-line">{data.accountingDate || '\u00A0'}</div>
                    <div className="sig-label">Date</div>
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

export default RSMIFormPaper;