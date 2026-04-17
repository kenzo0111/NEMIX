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
  return new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

export const StockCard: React.FC<StockCardProps> = ({ data }) => {
  // Logic to pad empty rows to fill up the page (Stock cards typically have more rows than RIS)
  const entries = data.entries || [];
  const targetRowCount = 25; // Adjusted for a full page without a large signature block
  const emptyRowsCount = Math.max(0, targetRowCount - entries.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <>
      <style>{`
        @page {
            size: A4 portrait;
            margin: 20px;
        }
        .sc-container {
            font-family: 'Times New Roman', Times, serif;
            font-size: 10pt;
            background: #fff;
            color: #000;
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            box-sizing: border-box;
        }
        .header-title {
            text-align: right;
            font-style: italic;
            font-size: 12pt;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .main-title {
            text-align: center;
            font-weight: bold;
            font-size: 14pt;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        /* Header Grid (Header Fields) */
        .info-grid {
            display: grid;
            grid-template-columns: max-content 1fr 30px max-content 1fr;
            row-gap: 8px;
            margin-bottom: 15px;
            align-items: end;
        }
        .info-grid .label {
            font-weight: bold;
            padding-right: 5px;
            white-space: nowrap;
        }
        .info-grid .field {
            border-bottom: 1px solid #000;
            font-weight: bold;
            padding-bottom: 2px;
            min-width: 150px;
            min-height: 16px;
        }

        /* Main Grid Table */
        .main-table {
            border: 2px solid #000;
            width: 100%;
        }
        .main-table th, .main-table td {
            border: 1px solid #000;
            padding: 5px;
            font-size: 10pt;
        }
        .main-table th {
            background-color: #ffffff; /* Typically white in standard forms, or you can change to #f0f0f0 */
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
        }
        .main-table td {
            height: 25px; /* Minimum height for rows */
        }
        
        /* Column Widths */
        .col-date { width: 12%; }
        .col-ref { width: 15%; }
        .col-receipt { width: 12%; }
        .col-issue-qty { width: 12%; }
        .col-issue-office { width: 20%; }
        .col-balance { width: 12%; }
        .col-days { width: 17%; }

        .text-center { text-align: center; }
        .text-left { text-align: left; }
        
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
        <table style={{ width: '100%', marginBottom: '10px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '15%', fontWeight: 'bold', padding: '5px', verticalAlign: 'bottom' }}>Entity Name:</td>
              <td style={{ width: '40%', fontWeight: 'bold', padding: '5px', verticalAlign: 'bottom' }}>
                <div style={{ borderBottom: '1px solid #000', minHeight: '16px' }}>{data.entity_name}</div>
              </td>
              <td style={{ width: '15%', fontWeight: 'bold', padding: '5px', verticalAlign: 'bottom' }}>Fund Cluster:</td>
              <td style={{ width: '30%', fontWeight: 'bold', padding: '5px', verticalAlign: 'bottom' }}>
                <div style={{ borderBottom: '1px solid #000', minHeight: '16px' }}>{data.fund_cluster}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Boxed Header Info */}
        <table className="main-table" style={{ marginBottom: '-2px', borderBottom: 'none' }}>
          <tbody>
            <tr>
              <td style={{ width: '15%' }}>Item:</td>
              <td style={{ width: '40%' }}>{data.item}</td>
              <td style={{ width: '15%' }}>Stock No.:</td>
              <td style={{ width: '30%' }}>{data.stock_no}</td>
            </tr>
            <tr>
              <td>Description:</td>
              <td>{data.description}</td>
              <td>Re-order Point:</td>
              <td>{data.re_order_point}</td>
            </tr>
            <tr>
              <td>Unit of Measurement:</td>
              <td>{data.unit_of_measurement}</td>
              <td colSpan={2} style={{ borderBottom: 'none' }}></td>
            </tr>
          </tbody>
        </table>

        {/* Main Content Table */}
        <table className="main-table">
          <thead>
            <tr>
              <th rowSpan={2} className="col-date">Date</th>
              <th rowSpan={2} className="col-ref">Reference</th>
              <th rowSpan={2} className="col-receipt">Receipt<br/>Qty.</th>
              <th colSpan={2}>Issue</th>
              <th rowSpan={2} className="col-balance">Balance<br/>Qty.</th>
              <th rowSpan={2} className="col-days">No. of Days<br/>to Consume</th>
            </tr>
            <tr>
              <th className="col-issue-qty">Qty.</th>
              <th className="col-issue-office">Office</th>
            </tr>
          </thead>
          
          <tbody>
            {/* Populated Entries */}
            {entries.map((entry, index) => (
              <tr key={index}>
                <td className="text-center">{formatDate(entry.date) || entry.date}</td>
                <td className="text-center">{entry.reference}</td>
                <td className="text-center">{entry.receipt_qty}</td>
                <td className="text-center">{entry.issue_qty}</td>
                <td className="text-center">{entry.issue_office}</td>
                <td className="text-center">{entry.balance_qty}</td>
                <td className="text-center">{entry.days_to_consume}</td>
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