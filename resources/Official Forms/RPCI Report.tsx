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
  const targetRowCount = 14; // Target rows to fit cleanly on A4 landscape page
  const emptyRowsCount = Math.max(0, targetRowCount - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <>
      <style>{`
        @page {
            size: A4 landscape;
            margin: 10mm;
        }
        .rpci-container {
            font-family: 'Times New Roman', Times, serif;
            font-size: 9.5pt;
            background: #ffffff;
            color: #000000;
            width: 100%;
            max-width: 277mm;
            margin: 0 auto;
            box-sizing: border-box;
            line-height: 1.25;
        }
        .appendix-label {
            text-align: right;
            font-style: italic;
            font-size: 11pt;
            margin-bottom: 2px;
            font-weight: bold;
        }
        .main-title {
            text-align: center;
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 2px;
            letter-spacing: 0.5px;
        }
        .sub-title {
            text-align: center;
            font-size: 9pt;
            margin-bottom: 10px;
            line-height: 1.3;
        }
        .underline-input {
            border-bottom: 1px solid #000000;
            display: inline-block;
            padding: 0 4px 2px 4px;
            font-weight: bold;
            min-height: 17px;
            line-height: 1.2;
            box-sizing: border-box;
            vertical-align: bottom;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .meta-table td {
            padding: 3px 0;
            vertical-align: bottom;
            font-size: 9pt;
        }
        .main-table {
            border: 1.5px solid #000000;
        }
        .main-table th, .main-table td {
            border: 1px solid #000000;
            padding: 2px 4px;
            word-break: break-word;
            overflow-wrap: anywhere;
            text-align: center;
            font-size: 9pt;
            box-sizing: border-box;
            vertical-align: middle;
            line-height: 1.2;
        }
        .main-table th {
            font-weight: bold;
            background-color: #ffffff;
        }
        .main-table td {
            height: 20px;
        }
        .text-left { text-align: left !important; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        
        .footer-table {
            margin-top: 10px;
            width: 100%;
        }
        .footer-table td {
            width: 33.33%;
            padding: 6px 12px;
            vertical-align: top;
            font-size: 8.5pt;
        }
        .sig-line {
            border-top: 1px solid #000000;
            margin-top: 32px;
            text-align: center;
            padding-top: 3px;
            font-size: 8pt;
            line-height: 1.2;
        }
        @media print {
            body { margin: 0; padding: 0; background: #fff; }
            .rpci-container { width: 100%; max-width: none; }
            .main-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="rpci-container">
        <div className="appendix-label">Appendix 66</div>

        <div className="main-title">REPORT ON THE PHYSICAL COUNT OF INVENTORIES</div>
        <div className="sub-title">
            <span className="underline-input" style={{ minWidth: '280px' }}>{data.inventory_type || '\u00A0'}</span><br/>
            (Type of Inventory Item)<br/>
            As at <span className="underline-input" style={{ minWidth: '180px' }}>{data.as_at_date || '\u00A0'}</span>
        </div>

        <table className="meta-table" style={{ marginBottom: '6px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%' }}>
                <strong>Fund Cluster :</strong> <span className="underline-input" style={{ minWidth: '200px' }}>{data.fund_cluster || 'Regular Agency Fund'}</span>
              </td>
              <td style={{ width: '50%' }}></td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div style={{ display: 'flex', width: '100%', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ marginRight: '4px' }}><strong>For which</strong></span>
                  <span className="underline-input text-center" style={{ flex: '1 1 180px', minWidth: '120px' }}>{data.accountable_officer || 'Arsenio Gem A. Garcillanosa'}</span>
                  <span style={{ margin: '0 4px' }}>,</span>
                  <span className="underline-input text-center" style={{ flex: '1 1 140px', minWidth: '100px' }}>{data.designation || '\u00A0'}</span>
                  <span style={{ margin: '0 4px' }}>,</span>
                  <span className="underline-input text-center" style={{ flex: '1 1 200px', minWidth: '150px' }}>{data.entity_name || '\u00A0'}</span>
                  <span style={{ margin: '0 6px', whiteSpace: 'nowrap' }}><strong>is accountable, having assumed such accountability on</strong></span>
                  <span className="underline-input text-center" style={{ flex: '0 1 120px', minWidth: '80px' }}>{data.date_assumption || '\u00A0'}</span>
                  <span>.</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="main-table">
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: '8%' }}>Article</th>
              <th rowSpan={2} style={{ width: '19%' }}>Description</th>
              <th rowSpan={2} style={{ width: '9%' }}>Stock Number</th>
              <th rowSpan={2} style={{ width: '6%' }}>Unit of Measure</th>
              <th rowSpan={2} style={{ width: '8%' }}>Unit Value</th>
              <th style={{ width: '8%' }}>Balance Per Card</th>
              <th style={{ width: '8%' }}>On Hand Per Count</th>
              <th colSpan={2} style={{ width: '14%' }}>Shortage/Overage</th>
              <th rowSpan={2} style={{ width: '20%' }}>Remarks</th>
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
                <td>{item.article || '\u00A0'}</td>
                <td className="text-left">{item.description || '\u00A0'}</td>
                <td>{item.stock_no || '\u00A0'}</td>
                <td>{item.unit || '\u00A0'}</td>
                <td className="text-right">{item.unit_value !== undefined && item.unit_value !== null && item.unit_value !== '' ? item.unit_value : '\u00A0'}</td>
                <td className="text-right">{item.balance_per_card !== undefined && item.balance_per_card !== null && item.balance_per_card !== '' ? item.balance_per_card : '\u00A0'}</td>
                <td className="text-right">{item.on_hand_count !== undefined && item.on_hand_count !== null && item.on_hand_count !== '' ? item.on_hand_count : '\u00A0'}</td>
                <td className="text-right">{item.shortage_qty || '\u00A0'}</td>
                <td className="text-right">{item.shortage_value || '\u00A0'}</td>
                <td className="text-left">{item.remarks || '\u00A0'}</td>
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