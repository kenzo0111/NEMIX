import React from 'react';
import { formatDisplayDate } from '@/utils/dateUtils';

// --- Interfaces ---

export interface StockCardEntry {
  date?: string;
  reference?: string;
  receipt_qty?: number | string;
  issue_qty?: number | string;
  issue_office?: string;
  balance_qty?: number | string;
  days_to_consume?: number | string;
}

export interface StockCardData {
  entity_name?: string;
  fund_cluster?: string;
  item?: string;
  stock_no?: string;
  description?: string;
  re_order_point?: string;
  unit_of_measurement?: string;
  
  // Entries
  entries?: StockCardEntry[];
}

interface StockCardProps {
  data: StockCardData;
}

// --- Helper Functions ---

const formatFundCluster = (val?: string | null): string => {
  if (!val || val === '01' || val === 'General Fund' || val === 'Regular Agency Fund') {
    return '01 - Regular Agency Fund';
  }
  return val;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return formatDisplayDate(dateString, 'MM/DD/YYYY');
};

export const StockCard: React.FC<StockCardProps> = ({ data }) => {
  const entries = data.entries || [];
  const targetRowCount = 12;
  const emptyRowsCount = Math.max(0, targetRowCount - entries.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <>
      <style>{`
        @page {
            size: A4 portrait;
            margin: 8mm;
        }
        .sc-container {
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
        .header-title {
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
            line-height: 1.15;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        /* Main Grid Table */
        .main-table {
            border: 1.5px solid #000000;
            width: 100%;
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
            background-color: #ffffff;
            font-weight: bold;
            text-align: center;
            padding: 0.8mm 1mm;
        }
        .empty-row td {
            height: 4mm !important;
            min-height: 4mm !important;
            padding: 0 1mm !important;
            line-height: 1 !important;
        }
        
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        
        @media print {
            body { margin: 0; padding: 0; background: #fff; }
            .sc-container { width: 100%; max-width: none; margin: 0 auto; padding: 0; }
            .main-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header-title, .main-title, .sc-top-info, .sc-header-box {
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

      <div className="sc-container">
        <div className="header-title">Appendix 58</div>

        <div className="main-title">STOCK CARD</div>

        {/* Top Info Grid with explicit column widths to prevent any layout collapse */}
        <table className="sc-top-info" style={{ width: '100%', marginBottom: '6px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
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
              <td style={{ borderBottom: '1px solid #000000', fontSize: '8.5pt', verticalAlign: 'middle', padding: '1.5px 4px', lineHeight: 1.1 }}>
                {data.entity_name ? data.entity_name.replace(/Camarines Norte State College/gi, 'University of Camarines Norte') : 'University of Camarines Norte'}
              </td>
              <td>&nbsp;</td>
              <td style={{ fontWeight: 'bold', fontSize: '8.5pt', verticalAlign: 'middle', padding: '1.5px 0' }}>
                Fund Cluster:
              </td>
              <td style={{ borderBottom: '1px solid #000000', fontSize: '8.5pt', verticalAlign: 'middle', padding: '1.5px 4px', lineHeight: 1.1 }}>
                {formatFundCluster(data.fund_cluster)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Boxed Header Info */}
        <table className="main-table sc-header-box" style={{ borderBottom: 'none', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '38%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '32%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 'normal', padding: '2px 4px', fontSize: '8pt', lineHeight: 1.1 }}>Item:</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold', padding: '2px 4px', fontSize: '8pt', lineHeight: 1.1 }}>{data.item || '\u00A0'}</td>
              <td style={{ textAlign: 'center', fontWeight: 'normal', padding: '2px 4px', fontSize: '8pt', lineHeight: 1.1 }}>Stock No.:</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold', padding: '2px 4px', fontSize: '8pt', lineHeight: 1.1 }}>{data.stock_no || '\u00A0'}</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center', padding: '2px 4px', fontSize: '8pt', lineHeight: 1.1 }}>Description:</td>
              <td style={{ textAlign: 'center', padding: '2px 4px', fontSize: '8pt', lineHeight: 1.1 }}>{data.description || '\u00A0'}</td>
              <td style={{ textAlign: 'center', padding: '2px 4px', fontSize: '8pt', lineHeight: 1.1 }}>Re-order Point:</td>
              <td style={{ textAlign: 'center', padding: '2px 4px', fontSize: '8pt', lineHeight: 1.1 }}>{data.re_order_point || '\u00A0'}</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center', lineHeight: 1.1, padding: '2px 4px', fontSize: '8pt' }}>Unit of<br />Measurement:</td>
              <td style={{ textAlign: 'center', padding: '2px 4px', fontSize: '8pt', lineHeight: 1.1 }}>{data.unit_of_measurement || '\u00A0'}</td>
              <td colSpan={2} style={{ background: '#ffffff', padding: '2px 4px' }}>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        {/* Main Content Table */}
        <table className="main-table" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '11%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '26%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '17%' }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2}>Date</th>
              <th rowSpan={2}>Reference</th>
              <th rowSpan={2}>Receipt<br/>Qty.</th>
              <th colSpan={2}>Issue</th>
              <th rowSpan={2}>Balance<br/>Qty.</th>
              <th rowSpan={2}>No. of Days<br/>to Consume</th>
            </tr>
            <tr>
              <th>Qty.</th>
              <th>Office</th>
            </tr>
          </thead>
          
          <tbody>
            {/* Populated Entries */}
            {entries.map((entry, index) => (
              <tr key={index}>
                <td className="text-center">{formatDate(entry.date) || entry.date || '\u00A0'}</td>
                <td className="text-center">{entry.reference || '\u00A0'}</td>
                <td className="text-center">{entry.receipt_qty !== undefined && entry.receipt_qty !== null && entry.receipt_qty !== '' ? entry.receipt_qty : '\u00A0'}</td>
                <td className="text-center">{entry.issue_qty !== undefined && entry.issue_qty !== null && entry.issue_qty !== '' ? entry.issue_qty : '\u00A0'}</td>
                <td className="text-center">{entry.issue_office || '\u00A0'}</td>
                <td className="text-center">{entry.balance_qty !== undefined && entry.balance_qty !== null && entry.balance_qty !== '' ? entry.balance_qty : '\u00A0'}</td>
                <td className="text-center">{entry.days_to_consume || '\u00A0'}</td>
              </tr>
            ))}

            {/* Empty Padding Rows to maintain table height */}
            {emptyRows.map((_, index) => (
              <tr key={`empty-${index}`} className="empty-row">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default StockCard;