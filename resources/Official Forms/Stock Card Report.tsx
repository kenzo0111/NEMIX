import React from 'react';

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

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const StockCard: React.FC<StockCardProps> = ({ data }) => {
  const entries = data.entries || [];
  const targetRowCount = 20;
  const emptyRowsCount = Math.max(0, targetRowCount - entries.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <>
      <style>{`
        @page {
            size: A4 portrait;
            margin: 12mm;
        }
        .sc-container {
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
        .header-title {
            text-align: right;
            font-style: italic;
            font-size: 11pt;
            margin-bottom: 4px;
            font-weight: bold;
        }
        .main-title {
            text-align: center;
            font-weight: bold;
            font-size: 13pt;
            margin-bottom: 14px;
            letter-spacing: 0.5px;
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
            padding: 4px 6px;
            font-size: 9.5pt;
            box-sizing: border-box;
            word-break: break-word;
            overflow-wrap: anywhere;
            vertical-align: middle;
            line-height: 1.3;
        }
        .main-table th {
            background-color: #ffffff;
            font-weight: bold;
            text-align: center;
        }
        .empty-row td {
            height: 22px;
        }
        
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        
        @media print {
            body { margin: 0; padding: 0; background: #fff; }
            .sc-container { width: 100%; max-width: none; }
            .main-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="sc-container">
        <div className="header-title">Appendix 58</div>

        <div className="main-title">STOCK CARD</div>

        {/* Top Info Grid with explicit column widths to prevent any layout collapse */}
        <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '90px' }} />
            <col style={{ width: '280px' }} />
            <col style={{ width: '30px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '230px' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ fontWeight: 'bold', fontSize: '10pt', verticalAlign: 'middle', padding: '2px 0' }}>
                Entity Name:
              </td>
              <td style={{ borderBottom: '1px solid #000000', fontSize: '10pt', verticalAlign: 'middle', padding: '2px 6px 3px 6px', lineHeight: 1.2 }}>
                {data.entity_name ? data.entity_name.replace(/Camarines Norte State College/gi, 'University of Camarines Norte') : 'University of Camarines Norte'}
              </td>
              <td>&nbsp;</td>
              <td style={{ fontWeight: 'bold', fontSize: '10pt', verticalAlign: 'middle', padding: '2px 0' }}>
                Fund Cluster:
              </td>
              <td style={{ borderBottom: '1px solid #000000', fontSize: '10pt', verticalAlign: 'middle', padding: '2px 6px 3px 6px', lineHeight: 1.2 }}>
                {data.fund_cluster || '\u00A0'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Boxed Header Info */}
        <table className="main-table" style={{ borderBottom: 'none', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '38%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '32%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 'normal', padding: '6px 4px' }}>Item:</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold', padding: '6px 6px' }}>{data.item || '\u00A0'}</td>
              <td style={{ textAlign: 'center', fontWeight: 'normal', padding: '6px 4px' }}>Stock No.:</td>
              <td style={{ textAlign: 'center', fontWeight: 'bold', padding: '6px 6px' }}>{data.stock_no || '\u00A0'}</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center', padding: '6px 4px' }}>Description:</td>
              <td style={{ textAlign: 'center', padding: '6px 6px' }}>{data.description || '\u00A0'}</td>
              <td style={{ textAlign: 'center', padding: '6px 4px' }}>Re-order Point:</td>
              <td style={{ textAlign: 'center', padding: '6px 6px' }}>{data.re_order_point || '\u00A0'}</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center', lineHeight: 1.2, padding: '4px 4px' }}>Unit of<br />Measurement:</td>
              <td style={{ textAlign: 'center', padding: '6px 6px' }}>{data.unit_of_measurement || '\u00A0'}</td>
              <td colSpan={2} style={{ background: '#ffffff', padding: '6px 4px' }}>&nbsp;</td>
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