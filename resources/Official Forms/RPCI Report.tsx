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
  const targetRowCount = 12;
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
            margin-bottom: 4px;
            letter-spacing: 0.5px;
        }
        .sub-title {
            text-align: center;
            font-size: 9pt;
            margin-bottom: 12px;
            line-height: 1.35;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .main-table {
            border: 1.5px solid #000000;
        }
        .main-table th, .main-table td {
            border: 1px solid #000000;
            padding: 4px 5px;
            word-break: break-word;
            overflow-wrap: anywhere;
            text-align: center;
            font-size: 9pt;
            box-sizing: border-box;
            vertical-align: middle;
            line-height: 1.3;
        }
        .main-table th {
            font-weight: bold;
            background-color: #ffffff;
        }
        .empty-row td {
            height: 20px;
        }
        .text-left { text-align: left !important; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        
        .footer-table {
            margin-top: 14px;
            width: 100%;
        }
        .footer-table td {
            width: 33.33%;
            padding: 6px 12px;
            vertical-align: top;
            font-size: 8.5pt;
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
          <div style={{ display: 'inline-block', borderBottom: '1px solid #000000', padding: '0 8px 1px 8px', fontWeight: 'bold', fontSize: '9.5pt' }}>
            {data.inventory_type || '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}
          </div>
          <div style={{ marginTop: '1px', fontSize: '8.5pt', fontStyle: 'italic' }}>(Type of Inventory Item)</div>
          <div style={{ marginTop: '4px', fontSize: '9pt', display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
            <span style={{ fontStyle: 'italic', marginRight: '6px' }}>As at</span>
            <span style={{ borderBottom: '1px solid #000000', padding: '0 8px 1px 8px', fontWeight: 'bold', fontSize: '9.5pt' }}>
              {data.as_at_date || '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}
            </span>
          </div>
        </div>

        {/* Fund Cluster: tight underline wrapping the text */}
        <div style={{ marginBottom: '6px', fontSize: '9.5pt', display: 'flex', alignItems: 'baseline' }}>
          <strong style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Fund Cluster :</strong>
          <span style={{ borderBottom: '1px solid #000000', padding: '0 4px 1px 4px', fontWeight: 'bold' }}>
            {data.fund_cluster || 'General Fund'}
          </span>
        </div>

        {/* Accountability statement: natural inline typography with tight underlines and snug commas */}
        <div style={{ marginBottom: '10px', fontSize: '9pt', lineHeight: 1.5, color: '#000000' }}>
          <strong>For which</strong>{' '}
          <span style={{ borderBottom: '1px solid #000000', padding: '0 3px 1px 3px', fontWeight: 'bold' }}>
            {data.accountable_officer || 'System Administrator'}
          </span>
          ,{' '}
          <span style={{ borderBottom: '1px solid #000000', padding: '0 3px 1px 3px', fontWeight: 'bold' }}>
            {data.designation || 'Supply Custodian'}
          </span>
          ,{' '}
          <span style={{ borderBottom: '1px solid #000000', padding: '0 3px 1px 3px', fontWeight: 'bold' }}>
            {data.entity_name || 'University of Camarines Norte'}
          </span>{' '}
          <strong>is accountable, having assumed such accountability on</strong>{' '}
          <span style={{ borderBottom: '1px solid #000000', padding: '0 6px 1px 6px', fontWeight: 'bold', display: 'inline-block', minWidth: '80px', textAlign: 'center' }}>
            {data.date_assumption || '\u00A0'}
          </span>
          .
        </div>

        <table className="main-table">
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: '8%' }}>Article</th>
              <th rowSpan={2} style={{ width: '20%' }}>Description</th>
              <th rowSpan={2} style={{ width: '12%' }}>Stock Number</th>
              <th rowSpan={2} style={{ width: '6%' }}>Unit of Measure</th>
              <th rowSpan={2} style={{ width: '8%' }}>Unit Value</th>
              <th style={{ width: '8%' }}>Balance Per Card</th>
              <th style={{ width: '8%' }}>On Hand Per Count</th>
              <th colSpan={2} style={{ width: '14%' }}>Shortage/Overage</th>
              <th rowSpan={2} style={{ width: '16%' }}>Remarks</th>
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
              <tr key={`empty-${idx}`} className="empty-row">
                <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Signatures */}
        <table className="footer-table">
          <tbody>
            <tr>
              <td>
                <div style={{ marginBottom: '28px' }}>Certified Correct by:</div>
                <table style={{ width: '90%', margin: '0 auto', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '0 4px 4px 4px', fontWeight: 'bold', textAlign: 'center', fontSize: '8.5pt', minHeight: '20px' }}>
                        {data.committee_chair_name || '\u00A0'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', textAlign: 'center', fontSize: '7.5pt', paddingTop: '4px', lineHeight: 1.2 }}>
                        Signature over Printed Name of Inventory Committee Chair and Members
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td>
                <div style={{ marginBottom: '28px' }}>Approved by:</div>
                <table style={{ width: '90%', margin: '0 auto', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '0 4px 4px 4px', fontWeight: 'bold', textAlign: 'center', fontSize: '8.5pt', minHeight: '20px' }}>
                        {data.head_of_agency_name || '\u00A0'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', textAlign: 'center', fontSize: '7.5pt', paddingTop: '4px', lineHeight: 1.2 }}>
                        Signature over Printed Name of Head of Agency/Entity or Authorized Representative
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td>
                <div style={{ marginBottom: '28px' }}>Verified by:</div>
                <table style={{ width: '90%', margin: '0 auto', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '0 4px 4px 4px', fontWeight: 'bold', textAlign: 'center', fontSize: '8.5pt', minHeight: '20px' }}>
                        {data.coa_representative_name || '\u00A0'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', textAlign: 'center', fontSize: '7.5pt', paddingTop: '4px', lineHeight: 1.2 }}>
                        Signature over Printed Name of COA Representative
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

export default ReportPhysicalCount;