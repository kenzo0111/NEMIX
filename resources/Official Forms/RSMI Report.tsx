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
  const items = data.issuedItems || [];
  const targetRowCount = 16;
  const paddedItems = [...items, ...Array(Math.max(0, targetRowCount - items.length)).fill({})];

  const recap = data.recapitulationItems || [];
  const recapTargetCount = 5;
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
            margin-bottom: 12px;
            letter-spacing: 0.5px;
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
            padding: 4px 5px;
            font-size: 9pt;
            word-break: break-word;
            overflow-wrap: anywhere;
            box-sizing: border-box;
            vertical-align: middle;
            line-height: 1.3;
        }
        .main-table th {
            text-align: center;
            font-weight: bold;
            background-color: #ffffff;
        }
        .empty-row td {
            height: 22px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        
        .header-italic {
            font-style: italic;
            font-weight: normal !important;
            padding: 4px 6px !important;
        }

        /* Footer / Signatures */
        .footer-cell {
            vertical-align: top !important;
            padding: 8px 10px !important;
        }
        .certify-text {
            margin-bottom: 24px;
            font-size: 9pt;
        }
        .posted-text {
            margin-bottom: 18px;
            font-size: 9pt;
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

        {/* Top Info Header with snug underlines and baseline alignment */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px', fontSize: '10pt', color: '#000000' }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <strong style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Entity Name:</strong>
            <span style={{ borderBottom: '1px solid #000000', padding: '0 4px 1px 4px', fontWeight: 'bold' }}>
              {data.entityName || 'University of Camarines Norte'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <strong style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Serial No. :</strong>
            <span style={{ borderBottom: '1px solid #000000', padding: '0 4px 1px 4px', fontWeight: 'bold' }}>
              {data.serialNo || '\u00A0'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px', fontSize: '10pt', color: '#000000' }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <strong style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Fund Cluster:</strong>
            <span style={{ borderBottom: '1px solid #000000', padding: '0 4px 1px 4px', fontWeight: 'bold' }}>
              {data.fundCluster || 'General Fund'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <strong style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Date :</strong>
            <span style={{ borderBottom: '1px solid #000000', padding: '0 4px 1px 4px', fontWeight: 'bold' }}>
              {data.date || '\u00A0'}
            </span>
          </div>
        </div>

        {/* Main 9-Column Grid Table */}
        <table className="main-table">
          <colgroup>
             <col style={{width: '7%'}} />  {/* C1: RIS No. */}
             <col style={{width: '18%'}} /> {/* C2: RCC */}
             <col style={{width: '12%'}} /> {/* C3: Stock No. */}
             <col style={{width: '23%'}} /> {/* C4: Item */}
             <col style={{width: '6%'}} />  {/* C5: Unit */}
             <col style={{width: '8%'}} />  {/* C6: Qty Issued */}
             <col style={{width: '11%'}} /> {/* C7: Unit Cost */}
             <col style={{width: '8%'}} />  {/* C8: Amount */}
             <col style={{width: '7%'}} />  {/* C9: UACS */}
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
              <tr key={`item-${idx}`} className={!item.risNo && !item.itemDescription ? 'empty-row' : ''}>
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
              <tr key={`recap-${idx}`} className={!r.stockNo && !r.quantity ? 'empty-row' : ''}>
                <td colSpan={3} className="text-center">{r.stockNo || '\u00A0'}</td>
                <td colSpan={3} className="text-center">{r.quantity !== undefined && r.quantity !== null && r.quantity !== '' ? r.quantity : '\u00A0'}</td>
                <td className="text-right">{r.unitCost || '\u00A0'}</td>
                <td className="text-right">{r.totalCost || '\u00A0'}</td>
                <td className="text-center">{r.uacsObjectCode || '\u00A0'}</td>
              </tr>
            ))}

            {/* Footer / Signatures */}
            <tr>
              <td colSpan={6} className="footer-cell">
                <div className="certify-text">I hereby certify to the correctness of the above information.</div>
                <table style={{ width: '85%', margin: '0 auto', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '0 4px 4px 4px', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', fontSize: '9.5pt', lineHeight: 1.25 }}>
                        {data.supplyCustodianName || '\u00A0'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', textAlign: 'center', fontSize: '8pt', paddingTop: '4px', lineHeight: 1.2 }}>
                        Signature over Printed Name of Supply and/or<br/>Property Custodian
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td colSpan={3} className="footer-cell" style={{ borderLeft: '1.5px solid #000000' }}>
                <div className="posted-text">Posted by:</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '0 4px 4px 4px', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', fontSize: '9pt', lineHeight: 1.25, width: '65%' }}>
                        {data.accountingStaffName || '\u00A0'}
                      </td>
                      <td style={{ border: 'none', width: '8%' }}>&nbsp;</td>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '0 4px 4px 4px', textAlign: 'center', fontSize: '9pt', lineHeight: 1.25, width: '27%' }}>
                        {data.accountingDate || '\u00A0'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', textAlign: 'center', fontSize: '7.5pt', paddingTop: '4px', lineHeight: 1.15 }}>
                        Signature over Printed Name of<br/>Designated Accounting Staff
                      </td>
                      <td style={{ border: 'none' }}>&nbsp;</td>
                      <td style={{ border: 'none', textAlign: 'center', fontSize: '7.5pt', paddingTop: '4px', lineHeight: 1.15 }}>
                        Date
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

export default RSMIFormPaper;