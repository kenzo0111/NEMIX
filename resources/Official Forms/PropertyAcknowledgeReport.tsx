import React from 'react';

// --- Interfaces ---

export interface ParItem {
  quantity?: number | string;
  unit?: string;
  description?: string;
  property_number?: string; // Corresponds to stock_number or property_number
  date_acquired?: string; // ISO Date string (YYYY-MM-DD)
  amount?: number;
}

export interface ParData {
  entityName?: string;
  fundCluster?: string;
  parNo?: string;
  
  items?: ParItem[];
  grandTotal?: number; // Optional: can be calculated or passed directly

  // Signatories
  receivedByName?: string;
  receivedByPosition?: string;
  receivedDate?: string;

  issuedByName?: string;
  issuedByPosition?: string;
  issuedDate?: string;
}

interface PropertyAcknowledgmentReceiptProps {
  data: ParData;
  targetRows?: number; // Default 18 rows to fill A4
}

// --- Helper Functions ---

const formatDate = (dateString?: string) => {
  if (!dateString) return '\u00A0'; // Return &nbsp;
  try {
    return new Date(dateString).toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
  } catch (e) {
    return dateString;
  }
};

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return '\u00A0';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const PropertyAcknowledgmentReceipt: React.FC<PropertyAcknowledgmentReceiptProps> = ({ 
  data, 
  targetRows = 18 
}) => {
  const items = data.items || [];
  
  // Calculate empty rows needed to fill the page
  const emptyRowsCount = Math.max(0, targetRows - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  // Calculate total if not provided
  const totalAmount = data.grandTotal ?? items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 25mm 15mm; }
        .par-container {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12px;
            color: #000;
            background: #fff;
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
        }
        .header { width: 100%; margin-bottom: 6px; }
        .center { text-align: center; }
        .right { text-align: right; }
        .small { font-size: 11px; }
        
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }
        
        /* Meta Table specific */
        .meta-row td { border: none; padding: 2px 0; }
        .meta-left { width: 65%; }
        .meta-right { width: 25%; }

        /* Items Table specific */
        .items-table { margin-top: 4px; }
        .items-table th { background: #f2f2f2; font-size: 11px; }
        .items-table td { font-size: 11px; }
        .items-table tfoot td { text-align: center; }
        
        /* Signature Lines */
        .sign-line { border-top: 1px solid #000; width: 85%; margin: 8px auto 0; display: block; }
        
        /* Additional classes for inline styles */
        .float-right { float: right; }
        .clear-both { clear: both; }
        .title-margin { margin: 4px 0 6px 0; }
        .meta-margin { margin-bottom: 6px; }
        .col-quantity { width: 6%; }
        .col-unit { width: 8%; }
        .col-description { width: 36%; }
        .col-property-number { width: 20%; }
        .col-date-acquired { width: 15%; }
        .col-amount { width: 15%; }
        .text-right { text-align: right; }
        .total-label { text-align: right; font-weight: bold; }
        .total-value { text-align: right; font-weight: bold; }
        .sig-cell { vertical-align: top; padding: 12px 6px; }
        .text-left { text-align: left; }
        .sig-space { height: 60px; }
        .sig-name { margin-top: 4px; font-weight: bold; }
        .small-space { height: 6px; }
        
        @media print {
            body { margin: 0; padding: 0; }
            .par-container { width: 100%; max-width: none; }
            .items-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="par-container">
        {/* Header */}
        <div className="header">
          <div className="float-right">
            <strong><em>Appendix 71</em></strong>
          </div>
          <div className="clear-both"></div>
        </div>

        <h2 className="center title-margin">
          PROPERTY ACKNOWLEDGMENT RECEIPT
        </h2>

        {/* Meta Data */}
        <table className="meta-row meta-margin">
          <tbody>
            <tr>
              <td className="meta-left">
                <strong>Entity Name :</strong> {data.entityName || '____________________________________'}
              </td>
            </tr>
            <tr>
              <td className="meta-left">
                <strong>Fund Cluster:</strong> {data.fundCluster || '____________________________________'}
              </td>
              <td className="meta-right">
                <strong>PAR No.:</strong> {data.parNo || '_______________'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Main Items Table */}
        <table className="items-table">
          <thead>
            <tr>
              <th className="col-quantity">Quantity</th>
              <th className="col-unit">Unit</th>
              <th className="col-description">Description</th>
              <th className="col-property-number">Property Number</th>
              <th className="col-date-acquired">Date Acquired</th>
              <th className="col-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* Render Items */}
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item.quantity || '\u00A0'}</td>
                <td>{item.unit || '\u00A0'}</td>
                <td>{item.description || '\u00A0'}</td>
                <td>{item.property_number || '\u00A0'}</td>
                <td>{formatDate(item.date_acquired)}</td>
                <td className="text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}

            {/* Empty Rows Padding */}
            {emptyRows.map((_, index) => (
              <tr key={`empty-${index}`}>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td className="text-right">&nbsp;</td>
              </tr>
            ))}

            {/* Grand Total Row */}
            {totalAmount > 0 && (
              <tr>
                <td colSpan={5} className="total-label">
                  Grand Total:
                </td>
                <td className="total-value">
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
            )}
          </tbody>

          {/* Footer / Signatures */}
          <tfoot>
            <tr>
              <td colSpan={3} className="sig-cell">
                <div className="text-left"><strong>Received by:</strong></div>
                <div className="sig-space"></div>
                <div className="sign-line"></div>
                <div className="sig-name">
                    {data.receivedByName || '_______________________________________'}
                </div>
                <div className="small">Signature over Printed Name of End User</div>
                <div className="small-space"></div>
                <div>{data.receivedByPosition || '__________________________________'}</div>
                <div className="small">Position/Office</div>
                <div className="small-space"></div>
                <div>{data.receivedDate || '_________________'}</div>
                <div className="small">Date</div>
              </td>
              <td colSpan={3} className="sig-cell">
                <div className="text-left"><strong>Issued by:</strong></div>
                <div className="sig-space"></div>
                <div className="sign-line"></div>
                <div className="sig-name">
                    {data.issuedByName || 'ARSENIO GEM A. GARCILLANOSA'}
                </div>
                <div className="small">Signature over Printed Name of Supply and/or Property Custodian</div>
                <div className="small-space"></div>
                <div>{data.issuedByPosition || 'SUPPLY OFFICER III/ADMIN OFFICER V'}</div>
                <div className="small">Position/Office</div>
                <div className="small-space"></div>
                <div>{data.issuedDate || '_________________'}</div>
                <div className="small">Date</div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
};

export default PropertyAcknowledgmentReceipt;