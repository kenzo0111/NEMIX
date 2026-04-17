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
  // Pad main table to 20 rows
  const items = data.issuedItems || [];
  const targetRowCount = 20;
  const paddedItems = [...items, ...Array(Math.max(0, targetRowCount - items.length)).fill({})];

  // Pad recapitulation table to 8 rows
  const recap = data.recapitulationItems || [];
  const recapTargetCount = 8;
  const paddedRecap = [...recap, ...Array(Math.max(0, recapTargetCount - recap.length)).fill({})];

  return (
    <>
      <style>{`
        @page {
            size: A4 portrait;
            margin: 20px;
        }
        .rsmi-container {
            font-family: 'Times New Roman', Times, serif;
            font-size: 10pt;
            background: #fff;
            color: #000;
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            box-sizing: border-box;
        }
        .header-appendix {
            text-align: right;
            font-style: italic;
            font-size: 14pt;
            margin-bottom: 10px;
        }
        .main-title {
            text-align: center;
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 25px;
            letter-spacing: 0.5px;
        }
        
        /* Top Info Grid */
        .info-grid {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            column-gap: 40px;
            margin-bottom: 5px;
        }
        .info-row {
            display: flex;
            align-items: flex-end;
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            white-space: nowrap;
            margin-right: 5px;
        }
        .info-value {
            flex-grow: 1;
            border-bottom: 1px solid #000;
            min-height: 14pt;
            padding-left: 5px;
            font-weight: normal;
        }

        /* Main Table Grid */
        .main-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
        }
        .main-table th, .main-table td {
            border: 1px solid #000;
            padding: 4px;
            font-size: 9.5pt;
        }
        .main-table th {
            text-align: center;
            font-weight: bold;
        }
        .main-table td {
            height: 22px; /* Fixed height for rows */
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        
        .header-italic {
            font-style: italic;
            font-weight: normal !important;
        }

        /* Footer / Signatures */
        .footer-cell {
            vertical-align: top;
            padding: 10px !important;
            height: 120px;
        }
        .certify-text {
            margin-bottom: 30px;
        }
        .signature-area {
            text-align: center;
            width: 85%;
            margin: 0 auto;
        }
        .posted-text {
            margin-bottom: 20px;
        }
        .accounting-sigs {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            text-align: center;
            padding: 0 10px;
            margin-top: 15px; /* Pushes the signatures down slightly */
        }
        .sig-main {
            flex-grow: 1;
            margin-right: 20px; /* Space between name and date */
        }
        .sig-date {
            width: 120px; /* Fixed width for the date line */
        }
        .sig-line {
            border-bottom: 1px solid #000;
            min-height: 18px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .sig-label {
            font-size: 8.5pt;
            margin-top: 3px;
            line-height: 1.2;
        }

        /* Ensure borders match precisely */
        .border-bottom-bold { border-bottom: 2px solid #000 !important; }

        @media print {
            body { margin: 0; }
            .rsmi-container { width: 100%; max-width: none; }
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
                    <div className="info-value">{data.entityName}</div>
                </div>
                <div className="info-row">
                    <span className="info-label">Fund Cluster:</span>
                    <div className="info-value">{data.fundCluster}</div>
                </div>
            </div>
            <div>
                <div className="info-row">
                    <span className="info-label">Serial No. :</span>
                    <div className="info-value">{data.serialNo}</div>
                </div>
                <div className="info-row">
                    <span className="info-label">Date :</span>
                    <div className="info-value">{data.date}</div>
                </div>
            </div>
        </div>

        {/* Main 9-Column Grid Table */}
        <table className="main-table">
          <colgroup>
             <col style={{width: '7%'}} />  {/* C1: RIS No. */}
             <col style={{width: '13%'}} /> {/* C2: RCC */}
             <col style={{width: '10%'}} /> {/* C3: Stock No. */}
             <col style={{width: '26%'}} /> {/* C4: Item */}
             <col style={{width: '7%'}} />  {/* C5: Unit */}
             <col style={{width: '9%'}} />  {/* C6: Qty Issued */}
             <col style={{width: '10%'}} /> {/* C7: Unit Cost */}
             <col style={{width: '9%'}} />  {/* C8: Amount / Total Cost */}
             <col style={{width: '9%'}} />  {/* C9: Amount / UACS */}
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
                <td className="text-center">{item.risNo}</td>
                <td className="text-center">{item.responsibilityCenterCode}</td>
                <td className="text-center">{item.stockNo}</td>
                <td>{item.itemDescription}</td>
                <td className="text-center">{item.unit}</td>
                <td className="text-right">{item.quantityIssued}</td>
                <td className="text-right">{item.unitCost}</td>
                <td colSpan={2} className="text-right">{item.amount}</td>
              </tr>
            ))}

            {/* Lower Section: Recapitulation Headers */}
            <tr className="border-bottom-bold">
              <td rowSpan={recapTargetCount + 2}></td> {/* C1 Empty column spanning down */}
              <td colSpan={2} className="text-center font-bold">Recapitulation:</td> {/* C2 and C3 for left Recapitulation */}
              <td rowSpan={recapTargetCount + 2}></td> {/* C4 Empty column spanning down */}
              <td rowSpan={recapTargetCount + 2}></td> {/* C5 Empty column spanning down */}
              <td colSpan={4} className="text-center font-bold">Recapitulation:</td> {/* C6 to C9 for right Recapitulation */}
            </tr>
            <tr>
              <td className="text-center font-bold">Stock No.</td>
              <td className="text-center font-bold">Quantity</td>
              <td className="text-center font-bold">Unit Cost</td>
              <td className="text-center font-bold">Total Cost</td>
              <td colSpan={2} className="text-center font-bold">UACS Object Code</td>
            </tr>

            {/* Lower Section: Recapitulation Rows */}
            {paddedRecap.map((r, idx) => (
              <tr key={`recap-${idx}`}>
                <td className="text-center">{r.stockNo}</td>
                <td className="text-center">{r.quantity}</td>
                <td className="text-right">{r.unitCost}</td>
                <td className="text-right">{r.totalCost}</td>
                <td colSpan={2} className="text-center">{r.uacsObjectCode}</td>
              </tr>
            ))}

            {/* Footer / Signatures - Integrated as a table row to maintain perfect vertical alignment */}
            <tr>
              <td colSpan={5} className="footer-cell">
                <div className="certify-text">I hereby certify to the correctness of the above information.</div>
                <div className="signature-area">
                  <div className="sig-line">{data.supplyCustodianName}</div>
                  <div className="sig-label">Signature over Printed Name of Supply and/or<br/>Property Custodian</div>
                </div>
              </td>
              <td colSpan={4} className="footer-cell" style={{ borderLeft: '2px solid #000' }}>
                <div className="posted-text">Posted by:</div>
                <div className="accounting-sigs">
                  <div className="sig-main">
                    <div className="sig-line">{data.accountingStaffName}</div>
                    <div className="sig-label">Signature over Printed Name of<br/>Designated Accounting Staff</div>
                  </div>
                  <div className="sig-date">
                    <div className="sig-line">{data.accountingDate}</div>
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