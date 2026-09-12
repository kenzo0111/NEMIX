import React from 'react';
import { formatDisplayDate } from '@/utils/dateUtils';

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
  if (!dateString) return '\u00A0';
  return formatDisplayDate(dateString, 'YYYY-MM-DD') || '\u00A0';
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
        @page { size: A4 portrait; margin: 8mm; }
        .par-container {
            font-family: 'Times New Roman', Times, serif;
            font-size: 8.5pt;
            color: #000;
            background: #fff;
            width: 100%;
            max-width: 194mm;
            margin: 0 auto;
            line-height: 1.15;
            box-sizing: border-box;
        }
        .header { width: 100%; margin-bottom: 2px; }
        .center { text-align: center; }
        .right { text-align: right; }
        .small { font-size: 7pt; line-height: 1.1; }
        
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 0.6mm 1mm; vertical-align: middle; }
        
        /* Meta Table specific */
        .meta-row td { border: none; padding: 1.5px 0; font-size: 8.5pt; line-height: 1.1; }
        .meta-left { width: 65%; }
        .meta-right { width: 25%; }

        /* Items Table specific */
        .items-table { margin-top: 3px; }
        .items-table th { background: #f2f2f2; font-size: 8pt; padding: 0.8mm 1mm; font-weight: bold; }
        .items-table td { font-size: 8pt; padding: 0.6mm 1mm; height: auto; }
        .items-table tfoot td { text-align: center; }
        .items-table tr.empty-row td,
        .empty-row td {
            height: 4mm !important;
            min-height: 4mm !important;
            padding: 0 1mm !important;
            line-height: 1 !important;
        }
        
        /* Signature Lines */
        .sign-line { border-top: 1px solid #000; width: 85%; margin: 2px auto 0; display: block; }
        
        /* Additional classes for inline styles */
        .float-right { float: right; font-size: 9pt; font-style: italic; }
        .clear-both { clear: both; }
        .title-margin { margin: 1px 0 3px 0; font-size: 11.5pt; font-weight: bold; letter-spacing: 0.3px; }
        .meta-margin { margin-bottom: 4px; }
        .col-quantity { width: 6%; }
        .col-unit { width: 8%; }
        .col-description { width: 36%; }
        .col-property-number { width: 20%; }
        .col-date-acquired { width: 15%; }
        .col-amount { width: 15%; }
        .text-right { text-align: right; }
        .total-label { text-align: right; font-weight: bold; padding: 0.6mm 1mm; }
        .total-value { text-align: right; font-weight: bold; padding: 0.6mm 1mm; }
        .sig-cell { vertical-align: top; padding: 4px 6px; }
        .text-left { text-align: left; }
        .sig-space { height: 16px; }
        .sig-name { margin-top: 2px; font-weight: bold; font-size: 8.5pt; line-height: 1.15; }
        .small-space { height: 2px; }
        
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
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <strong style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Entity Name :</strong>
                  <span style={{ flexGrow: 1, borderBottom: '1px solid #000', minHeight: '16px', padding: '0 4px 1px 4px', lineHeight: 1.15 }}>{data.entityName || '\u00A0'}</span>
                </div>
              </td>
              <td className="meta-right"></td>
            </tr>
            <tr>
              <td className="meta-left">
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <strong style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Fund Cluster:</strong>
                  <span style={{ flexGrow: 1, borderBottom: '1px solid #000', minHeight: '16px', padding: '0 4px 1px 4px', lineHeight: 1.15 }}>{data.fundCluster || '\u00A0'}</span>
                </div>
              </td>
              <td className="meta-right">
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <strong style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>PAR No.:</strong>
                  <span style={{ flexGrow: 1, borderBottom: '1px solid #000', minHeight: '16px', padding: '0 4px 1px 4px', lineHeight: 1.15 }}>{data.parNo || '\u00A0'}</span>
                </div>
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
              <tr key={`empty-${index}`} className="empty-row">
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
                <div style={{ fontSize: '8pt', lineHeight: 1.1 }}>{data.receivedByPosition || '__________________________________'}</div>
                <div className="small">Position/Office</div>
                <div className="small-space"></div>
                <div style={{ fontSize: '8pt', lineHeight: 1.1 }}>{data.receivedDate || '_________________'}</div>
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
                <div style={{ fontSize: '8pt', lineHeight: 1.1 }}>{data.issuedByPosition || 'SUPPLY OFFICER III/ADMIN OFFICER V'}</div>
                <div className="small">Position/Office</div>
                <div className="small-space"></div>
                <div style={{ fontSize: '8pt', lineHeight: 1.1 }}>{data.issuedDate || '_________________'}</div>
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