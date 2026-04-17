import React from 'react';

// --- Interfaces ---

export interface InventoryItem {
  article?: string;
  description?: string;
  stock_no?: string;
  unit?: string;
  unit_value?: number | string;
  balance_per_card?: number | string;
  on_hand_count?: number | string;
  shortage_qty?: number | string;
  shortage_value?: number | string;
  remarks?: string;
}

export interface RpciData {
  inventory_type?: string;
  as_at_date?: string;
  fund_cluster?: string;
  accountable_officer?: string;
  designation?: string;
  entity_name?: string;
  date_assumption?: string;

  items?: InventoryItem[];

  // Signatories
  committee_chair_name?: string;
  head_of_agency_name?: string;
  coa_representative_name?: string;
}

interface ReportPhysicalCountProps {
  data: RpciData;
}

export const ReportPhysicalCount: React.FC<ReportPhysicalCountProps> = ({ data }) => {
  const items = data.items || [];
  const targetRowCount = 15; // Minimum rows to fill the page
  const emptyRowsCount = Math.max(0, targetRowCount - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <>
      <style>{`
        @page {
            size: A4 landscape;
            margin: 15px;
        }
        .rpci-container {
            font-family: 'Times New Roman', Times, serif;
            font-size: 10pt;
            background: #fff;
            color: #000;
            width: 100%;
            margin: 0 auto;
            box-sizing: border-box;
        }
        .appendix-label {
            text-align: right;
            font-style: italic;
            font-size: 14pt;
            margin-bottom: 5px;
        }
        .main-title {
            text-align: center;
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 2px;
        }
        .sub-title {
            text-align: center;
            font-size: 9pt;
            margin-bottom: 15px;
        }
        .underline-input {
            border-bottom: 1px solid #000;
            display: inline-block;
            padding: 0 5px;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .meta-table td {
            padding: 5px 0;
            vertical-align: bottom;
        }
        .main-table th, .main-table td {
            border: 1px solid #000;
            padding: 3px;
            word-wrap: break-word;
            text-align: center;
            font-size: 9.5pt;
        }
        .main-table th {
            font-weight: bold;
        }
        .main-table td {
            height: 22px;
        }
        .text-left { text-align: left !important; }
        .footer-table {
            margin-top: 10px;
            width: 100%;
        }
        .footer-table td {
            width: 33.33%;
            padding: 10px 5px;
            vertical-align: top;
        }
        .sig-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            text-align: center;
            padding-top: 3px;
            font-size: 8pt;
        }
        @media print {
            body { margin: 0; }
            .rpci-container { width: 100%; }
        }
      `}</style>

      <div className="rpci-container">
        <div className="appendix-label">Appendix 66</div>

        <div className="main-title">REPORT ON THE PHYSICAL COUNT OF INVENTORIES</div>
        <div className="sub-title">
            <span className="underline-input" style={{ minWidth: '300px' }}>{data.inventory_type}</span><br/>
            (Type of Inventory Item)<br/><br/>
            As at <span className="underline-input" style={{ minWidth: '200px' }}>{data.as_at_date}</span>
        </div>

        <table className="meta-table">
          <tbody>
            <tr>
              <td style={{ width: '50%' }}>
                <strong>Fund Cluster :</strong> <span className="underline-input" style={{ minWidth: '200px' }}>{data.fund_cluster}</span>
              </td>
              <td style={{ width: '50%' }}></td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                  <div style={{ display: 'flex', width: '65%', alignItems: 'baseline', flexWrap: 'wrap', paddingRight: '8px' }}>
                    <span style={{ marginRight: '4px' }}><strong>For which</strong></span>
                    <span className="underline-input text-center" style={{ flexGrow: 1, minWidth: '100px' }}>{data.accountable_officer || '\u00A0'.repeat(30)}</span><span style={{ marginRight: '4px' }}>,</span>
                    <span className="underline-input text-center" style={{ flexGrow: 1, minWidth: '100px' }}>{data.designation || '\u00A0'.repeat(25)}</span><span style={{ marginRight: '4px' }}>,</span>
                    <span className="underline-input text-center" style={{ flexGrow: 1, minWidth: '150px' }}>{data.entity_name || '\u00A0'.repeat(30)}</span>
                  </div>
                  <div style={{ display: 'flex', width: '35%', alignItems: 'baseline', flexWrap: 'nowrap' }}>
                    <span style={{ margin: '0 4px', whiteSpace: 'nowrap' }}><strong>is accountable, having assumed such accountability on</strong></span>
                    <span className="underline-input text-center" style={{ flexGrow: 1, minWidth: '50px' }}>{data.date_assumption || ''}</span>
                    <span>.</span>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="main-table">
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: '7%' }}>Article</th>
              <th rowSpan={2} style={{ width: '18%' }}>Description</th>
              <th rowSpan={2} style={{ width: '8%' }}>Stock Number</th>
              <th rowSpan={2} style={{ width: '6%' }}>Unit of Measure</th>
              <th rowSpan={2} style={{ width: '8%' }}>Unit Value</th>
              <th style={{ width: '9%' }}>Balance Per Card</th>
              <th style={{ width: '9%' }}>On Hand Per Count</th>
              <th colSpan={2} style={{ width: '14%' }}>Shortage/Overage</th>
              <th rowSpan={2} style={{ width: '21%' }}>Remarks</th>
            </tr>
            <tr>
              <th>(Quantity)</th>
              <th>(Quantity)</th>
              <th style={{ width: '7%' }}>Quantity</th>
              <th style={{ width: '7%' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.article}</td>
                <td className="text-left">{item.description}</td>
                <td>{item.stock_no}</td>
                <td>{item.unit}</td>
                <td>{item.unit_value}</td>
                <td>{item.balance_per_card}</td>
                <td>{item.on_hand_count}</td>
                <td>{item.shortage_qty}</td>
                <td>{item.shortage_value}</td>
                <td className="text-left">{item.remarks}</td>
              </tr>
            ))}
            {emptyRows.map((_, idx) => (
              <tr key={`empty-${idx}`}>
                <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="footer-table">
          <tbody>
            <tr>
              <td>
                Certified Correct by:
                <div className="sig-line">
                  <strong>{data.committee_chair_name || '\u00A0'}</strong><br/>
                  Signature over Printed Name of Inventory Committee Chair and Members
                </div>
              </td>
              <td>
                Approved by:
                <div className="sig-line">
                  <strong>{data.head_of_agency_name || '\u00A0'}</strong><br/>
                  Signature over Printed Name of Head of Agency/Entity or Authorized Representative
                </div>
              </td>
              <td>
                Verified by:
                <div className="sig-line">
                  <strong>{data.coa_representative_name || '\u00A0'}</strong><br/>
                  Signature over Printed Name of COA Representative
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ReportPhysicalCount;