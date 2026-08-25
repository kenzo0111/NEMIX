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
  // Logic to pad empty rows to fill up the page cleanly without splitting to 2nd page
  const entries = data.entries || [];
  const targetRowCount = 22;
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
            padding: 3px 5px;
            font-size: 9.5pt;
            box-sizing: border-box;
            word-break: break-word;
            overflow-wrap: anywhere;
            vertical-align: middle;
            line-height: 1.2;
        }
        .main-table th {
            background-color: #ffffff;
            font-weight: bold;
            text-align: center;
        }
        .main-table td {
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

        {/* Top Info Grid */}
        <div style={{ display: 'flex', width: '100%', marginBottom: '10px', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', flex: '1 1 56%' }}>
            <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '6px', fontSize: '10pt' }}>Entity Name:</span>
            <div style={{
              flexGrow: 1,
              borderBottom: '1px solid #000',
              minHeight: '18px',
              padding: '0 4px 2px 4px',
              fontSize: '10pt',
              fontWeight: 'normal',
              lineHeight: 1.25,
              wordBreak: 'break-word',
              boxSizing: 'border-box'
            }}>
              {data.entity_name || '\u00A0'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', flex: '1 1 44%' }}>
            <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '6px', fontSize: '10pt' }}>Fund Cluster:</span>
            <div style={{
              flexGrow: 1,
              borderBottom: '1px solid #000',
              minHeight: '18px',
              padding: '0 4px 2px 4px',
              fontSize: '10pt',
              fontWeight: 'normal',
              lineHeight: 1.25,
              wordBreak: 'break-word',
              boxSizing: 'border-box'
            }}>
              {data.fund_cluster || '\u00A0'}
            </div>
          </div>
        </div>

        {/* Boxed Header Info */}
        <table className="main-table" style={{ borderBottom: 'none' }}>
          <tbody>
            <tr>
              <td style={{ width: '15%', textAlign: 'center' }}>Item:</td>
              <td style={{ width: '41%', textAlign: 'center', fontWeight: 'bold' }}>{data.item || '\u00A0'}</td>
              <td style={{ width: '15%', textAlign: 'center' }}>Stock No.:</td>
              <td style={{ width: '29%', textAlign: 'center', fontWeight: 'bold' }}>{data.stock_no || '\u00A0'}</td>
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
              <td colSpan={2} style={{ background: '#fff' }}>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        {/* Main Content Table */}
        <table className="main-table">
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: '11%' }}>Date</th>
              <th rowSpan={2} style={{ width: '16%' }}>Reference</th>
              <th rowSpan={2} style={{ width: '10%' }}>Receipt<br/>Qty.</th>
              <th colSpan={2} style={{ width: '33%' }}>Issue</th>
              <th rowSpan={2} style={{ width: '12%' }}>Balance<br/>Qty.</th>
              <th rowSpan={2} style={{ width: '18%' }}>No. of Days<br/>to Consume</th>
            </tr>
            <tr>
              <th style={{ width: '11%' }}>Qty.</th>
              <th style={{ width: '22%' }}>Office</th>
            </tr>
          </thead>
          
          <tbody>
            {/* Populated Entries */}
            {entries.map((entry, index) => (
              <tr key={index}>
                <td className="text-center">{formatDate(entry.date) || entry.date || '\u00A0'}</td>
                <td className="text-center">{entry.reference || '\u00A0'}</td>
                <td className="text-center">{entry.receipt_qty ?? '\u00A0'}</td>
                <td className="text-center">{entry.issue_qty ?? '\u00A0'}</td>
                <td className="text-center">{entry.issue_office || '\u00A0'}</td>
                <td className="text-center">{entry.balance_qty ?? '\u00A0'}</td>
                <td className="text-center">{entry.days_to_consume || '\u00A0'}</td>
              </tr>
            ))}

            {/* Empty Padding Rows to maintain table height */}
            {emptyRows.map((_, index) => (
              <tr key={`empty-${index}`}>
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