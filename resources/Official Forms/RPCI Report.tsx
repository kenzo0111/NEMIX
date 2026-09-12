import React from 'react';
import { formatDisplayDate } from '@/utils/dateUtils';

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
  const targetRowCount = 6;
  const emptyRowsCount = Math.max(0, targetRowCount - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <>
      <style>{`
        @page {
            size: A4 landscape;
            margin: 8mm;
        }
        .rpci-container {
            font-family: 'Times New Roman', Times, serif;
            font-size: 8.5pt;
            background: #ffffff;
            color: #000000;
            width: 100%;
            max-width: 281mm;
            margin: 0 auto;
            box-sizing: border-box;
            line-height: 1.15;
        }
        .header-appendix {
            text-align: right;
            font-style: italic;
            font-size: 9pt;
            margin-bottom: 1mm;
            font-weight: bold;
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
            font-size: 8.5pt;
            margin-bottom: 1.5mm;
            line-height: 1.1;
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
            padding: 0.6mm 1mm;
            word-break: break-word;
            overflow-wrap: anywhere;
            text-align: center;
            font-size: 8pt;
            box-sizing: border-box;
            vertical-align: middle;
            line-height: 1.1;
        }
        .main-table th {
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
        .text-left { text-align: left !important; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        
        .footer-table {
            margin-top: 1.5mm;
            width: 100%;
            min-height: auto;
            height: auto;
        }
        .footer-table td {
            width: 33.33%;
            padding: 1.5mm 2mm;
            vertical-align: top;
            font-size: 8pt;
            line-height: 1.1;
        }
        @media print {
            body { margin: 0; padding: 0; background: #fff; }
            .rpci-container { width: 100%; max-width: none; margin: 0 auto; padding: 0; }
            .main-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header-appendix, .main-title, .sub-title, .rpci-top-info {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            .footer-table {
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

      <div className="rpci-container">
        <div className="header-appendix">Appendix 66</div>

        <div className="main-title">REPORT ON THE PHYSICAL COUNT OF INVENTORIES</div>
        <div className="sub-title">
          <div style={{ display: 'inline-block', borderBottom: '1px solid #000000', padding: '0 6px 1.5px 6px', minWidth: '240px', fontWeight: 'bold', fontSize: '8.5pt', textAlign: 'center' }}>
            {data.inventory_type || '\u00A0'}
          </div>
          <div style={{ marginTop: '1px', fontSize: '7.5pt', fontStyle: 'italic' }}>(Type of Inventory Item)</div>
          <div style={{ marginTop: '3px' }}>
            As at{' '}
            <div style={{ display: 'inline-block', borderBottom: '1px solid #000000', padding: '0 6px 1.5px 6px', minWidth: '150px', fontWeight: 'bold', fontSize: '8.5pt', textAlign: 'center' }}>
              {formatDisplayDate(data.as_at_date, 'long') || data.as_at_date || '\u00A0'}
            </div>
          </div>
        </div>

        {/* Top Info Grid */}
        <table className="rpci-top-info" style={{ width: '100%', marginBottom: '4px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '85px' }} />
            <col style={{ width: '280px' }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ fontWeight: 'bold', fontSize: '8.5pt', verticalAlign: 'middle', padding: '1.5px 0' }}>
                Fund Cluster:
              </td>
              <td style={{ borderBottom: '1px solid #000000', padding: '1.5px 4px', verticalAlign: 'middle', fontSize: '8.5pt', lineHeight: 1.1 }}>
                {data.fund_cluster || '01 - Regular Agency Fund'}
              </td>
              <td>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        {/* Accountability statement on a single seamless flex line */}
        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', marginBottom: '6px', fontSize: '8.5pt', lineHeight: 1.15, whiteSpace: 'nowrap' }}>
          <span>For which</span>
          <div style={{ flex: '1 1 auto', borderBottom: '1px solid #000000', textAlign: 'center', fontWeight: 'bold', padding: '0 3px 1px 3px', marginLeft: '3px', minWidth: '90px' }}>
            {data.accountable_officer || 'Arsenio Gem A. Garcillanosa'}
          </div>
          <span>,</span>
          <div style={{ flex: '1 1 auto', borderBottom: '1px solid #000000', textAlign: 'center', fontWeight: 'bold', padding: '0 3px 1px 3px', marginLeft: '3px', minWidth: '90px' }}>
            {data.designation || 'Supply Custodian'}
          </div>
          <span>,</span>
          <div style={{ flex: '1 1 auto', borderBottom: '1px solid #000000', textAlign: 'center', fontWeight: 'bold', padding: '0 3px 1px 3px', marginLeft: '3px', minWidth: '110px' }}>
            {data.entity_name || '\u00A0'}
          </div>
          <span style={{ marginLeft: '3px' }}>is accountable, having assumed such accountability on</span>
          <div style={{ flex: '0 0 110px', borderBottom: '1px solid #000000', textAlign: 'center', fontWeight: 'bold', padding: '0 3px 1px 3px', marginLeft: '3px', minWidth: '80px' }}>
            {formatDisplayDate(data.date_assumption, 'MM/DD/YYYY') || data.date_assumption || '\u00A0'}
          </div>
          <span>.</span>
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
                <div style={{ marginBottom: '4.5mm', fontWeight: 'bold' }}>Certified Correct by:</div>
                <table style={{ width: '90%', margin: '0 auto', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '0 3px 2px 3px', fontWeight: 'bold', textAlign: 'center', fontSize: '8pt' }}>
                        {data.committee_chair_name || '\u00A0'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', textAlign: 'center', fontSize: '7pt', paddingTop: '2px', lineHeight: 1.1 }}>
                        Signature over Printed Name of Inventory Committee Chair and Members
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td>
                <div style={{ marginBottom: '4.5mm', fontWeight: 'bold' }}>Approved by:</div>
                <table style={{ width: '90%', margin: '0 auto', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '0 3px 2px 3px', fontWeight: 'bold', textAlign: 'center', fontSize: '8pt' }}>
                        {data.head_of_agency_name || '\u00A0'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', textAlign: 'center', fontSize: '7pt', paddingTop: '2px', lineHeight: 1.1 }}>
                        Signature over Printed Name of Head of Agency/Entity or Authorized Representative
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td>
                <div style={{ marginBottom: '4.5mm', fontWeight: 'bold' }}>Verified by:</div>
                <table style={{ width: '90%', margin: '0 auto', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', borderBottom: '1px solid #000000', padding: '0 3px 2px 3px', fontWeight: 'bold', textAlign: 'center', fontSize: '8pt' }}>
                        {data.coa_representative_name || '\u00A0'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', textAlign: 'center', fontSize: '7pt', paddingTop: '2px', lineHeight: 1.1 }}>
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