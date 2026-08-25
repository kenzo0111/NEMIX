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

        {/* Top Info Grid (pure table for 100% reliable baseline rendering) */}
        <table style={{ width: '100%', marginBottom: '10px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '1%', whiteSpace: 'nowrap', fontWeight: 'bold', fontSize: '10pt', paddingRight: '8px', verticalAlign: 'bottom' }}>
                Entity Name:
              </td>
              <td style={{ borderBottom: '1px solid #000000', padding: '0 4px 4px 4px', verticalAlign: 'bottom', fontSize: '10pt', width: '45%' }}>
                {data.entity_name || '\u00A0'}
              </td>
              <td style={{ width: '4%' }}>&nbsp;</td>
              <td style={{ width: '1%', whiteSpace: 'nowrap', fontWeight: 'bold', fontSize: '10pt', paddingRight: '8px', verticalAlign: 'bottom' }}>
                Fund Cluster:
              </td>
              <td style={{ borderBottom: '1px solid #000000', padding: '0 4px 4px 4px', verticalAlign: 'bottom', fontSize: '10pt', width: '35%' }}>
                {data.fund_cluster || '\u00A0'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Boxed Header Info */}
        <table className="main-table" style={{ borderBottom: 'none' }}>
          <tbody>
            <tr>
              <td style={{ width: '14%', textAlign: 'center' }}>Item:</td>
              <td style={{ width: '38%', textAlign: 'center', fontWeight: 'bold' }}>{data.item || '\u00A0'}</td>
              <td style={{ width: '14%', textAlign: 'center' }}>Stock No.:</td>
              <td style={{ width: '34%', textAlign: 'center', fontWeight: 'bold' }}>{data.stock_no || '\u00A0'}</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center' }}>Description:</td>
              <td style={{ textAlign: 'center' }}>{data.description || '\u00A0'}</td>
              <td style={{ textAlign: 'center' }}>Re-order Point:</td>
              <td style={{ textAlign: 'center' }}>{data.re_order_point || '\u00A0'}</td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center', lineHeight: 1.15 }}>Unit of<br />Measurement:</td>
              <td style={{ textAlign: 'center' }}>{data.unit_of_measurement || '\u00A0'}</td>
              <td colSpan={2} style={{ background: '#ffffff' }}>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        {/* Main Content Table */}
        <table className="main-table">
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: '11%' }}>Date</th>
              <th rowSpan={2} style={{ width: '15%' }}>Reference</th>
              <th rowSpan={2} style={{ width: '10%' }}>Receipt<br/>Qty.</th>
              <th colSpan={2} style={{ width: '36%' }}>Issue</th>
              <th rowSpan={2} style={{ width: '11%' }}>Balance<br/>Qty.</th>
              <th rowSpan={2} style={{ width: '17%' }}>No. of Days<br/>to Consume</th>
            </tr>
            <tr>
              <th style={{ width: '10%' }}>Qty.</th>
              <th style={{ width: '26%' }}>Office</th>
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