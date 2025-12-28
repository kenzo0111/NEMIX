import React from 'react';

// --- Interfaces ---

export interface PurchaseRequestItem {
  stockNo?: string;
  unit?: string;
  itemDescription?: string;
  quantity?: number | string;
  unitCost?: number | string;
  totalCost?: number | string;
}

export interface PurchaseRequestData {
  entityName?: string;
  fundCluster?: string;
  
  prNo?: string;
  responsibilityCenterCode?: string;
  date?: string;

  items?: PurchaseRequestItem[];
  
  purpose?: string;

  // Signatories
  requestedBy?: string;
  requestedDesignation?: string;
  
  approvedBy?: string;
  approvedDesignation?: string;
}

interface PurchaseRequestProps {
  data: PurchaseRequestData;
  targetRows?: number; // Default 15 as per original logic
}

// --- Helper Functions ---

const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null || amount === '') return '';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US');
  } catch {
    return dateString;
  }
};

export const PurchaseRequest: React.FC<PurchaseRequestProps> = ({ 
  data, 
  targetRows = 15 
}) => {
  const items = data.items || [];
  
  // Calculate total cost
  const grandTotal = items.reduce((sum, item) => {
    const cost = typeof item.totalCost === 'string' ? parseFloat(item.totalCost) : (item.totalCost || 0);
    return sum + (isNaN(cost) ? 0 : cost);
  }, 0);

  // Calculate empty rows needed to fill the page
  const emptyRowsCount = Math.max(0, targetRows - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 10mm; }
        .pr-container {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12px;
            color: #000;
            background: #fff;
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            box-sizing: border-box;
        }

        /* Utilities */
        .right { text-align: right; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        
        /* Titles */
        .header-title { text-align: right; font-style: italic; font-size: 12pt; margin-bottom: 5px; }
        .main-title { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 15px; }

        /* Tables */
        table { width: 100%; border-collapse: collapse; }
        
        /* Meta Table (Entity/Fund) */
        .meta-table { margin-bottom: 6px; }
        .meta-table td { border: none; padding: 4px; vertical-align: bottom; }
        .meta-underline { border-bottom: 1px solid #000; display: inline-block; width: 100%; min-height: 14px; }
        
        /* Additional classes for inline styles */
        .meta-entity-label { width: 12%; }
        .meta-entity-field { width: 56%; }
        .meta-fund-label { width: 16%; text-align: right; }
        .meta-fund-field { width: 16%; }
        .header-empty { width: 33%; }
        .header-info { width: 34%; text-align: left; }
        .header-margin { margin-top: 4px; }
        .header-date { width: 33%; text-align: left; }
        .purpose-cell { vertical-align: top; }
        .sig-cell { padding: 8px; vertical-align: top; }
        .sig-line-border { border-bottom: 1px solid #000; }

        /* Main Table */
        .main-table th, .main-table td { border: 1px solid #000; padding: 6px; font-size: 12px; vertical-align: top; }
        .main-table thead th { background: #fff; } /* Original had white background */
        
        /* Column Widths */
        .col-stock { width: 12%; }
        .col-unit { width: 8%; }
        .col-desc { width: 40%; }
        .col-qty { width: 8%; }
        .col-ucost { width: 16%; }
        .col-tcost { width: 16%; }

        /* Purpose Section */
        .purpose { padding: 6px; min-height: 40px; }
        
        /* Signature Section */
        .sig-label { height: 18px; font-weight: bold; }
        .sig-line { border-bottom: 1px solid #000; height: 18px; text-align: center; font-weight: bold; }
        .sig-sub { border-bottom: 1px solid #000; height: 18px; text-align: center; }
        .sig-placeholder { height: 18px; }

        @media print {
            body { margin: 0; padding: 0; }
            .pr-container { width: 100%; max-width: none; }
        }
      `}</style>

      <div className="pr-container">
        <div className="header-title">Appendix 60</div>
        <div className="main-title">PURCHASE REQUEST</div>

        {/* Entity / Fund Cluster Table */}
        <table className="meta-table">
          <tbody>
            <tr>
              <td className="meta-entity-label"><strong>Entity Name:</strong></td>
              <td className="meta-entity-field">
                <div className="meta-underline">{data.entityName}</div>
              </td>
              <td className="meta-fund-label"><strong>Fund Cluster:</strong></td>
              <td className="meta-fund-field">
                <div className="meta-underline">{data.fundCluster}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Main Content Table */}
        <table className="main-table">
          <thead>
            {/* Header Info Rows embedded in table to match borders */}
            <tr>
              <th colSpan={2} className="header-empty"></th>
              <th colSpan={2} className="header-info">
                <div><strong>PR No.:</strong> {data.prNo}</div>
                <div className="header-margin">
                  <strong>Responsibility Center Code:</strong> {data.responsibilityCenterCode}
                </div>
              </th>
              <th colSpan={2} className="header-date">
                <strong>Date:</strong> {formatDate(data.date)}
              </th>
            </tr>
            <tr>
              <th className="col-stock center">Stock/<br />Property No.</th>
              <th className="col-unit center">Unit</th>
              <th className="col-desc center">Item Description</th>
              <th className="col-qty center">Quantity</th>
              <th className="col-ucost center">Unit Cost</th>
              <th className="col-tcost center">Total Cost</th>
            </tr>
          </thead>
          
          <tbody>
            {/* Render Items */}
            {items.map((item, index) => (
              <tr key={index}>
                <td className="center">{item.stockNo || (index + 1)}</td>
                <td className="center">{item.unit}</td>
                <td>{item.itemDescription}</td>
                <td className="center">{item.quantity}</td>
                <td className="right">{formatCurrency(item.unitCost)}</td>
                <td className="right">{formatCurrency(item.totalCost)}</td>
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
                <td>&nbsp;</td>
              </tr>
            ))}

            {/* Grand Total */}
            <tr>
              <td colSpan={5} className="right"><strong>TOTAL</strong></td>
              <td className="right"><strong>{formatCurrency(grandTotal)}</strong></td>
            </tr>

            {/* Purpose */}
            <tr>
              <td colSpan={6} className="purpose-cell"><strong>Purpose:</strong></td>
            </tr>
            <tr>
              <td colSpan={6} className="purpose">{data.purpose}</td>
            </tr>

            {/* Signatures */}
            <tr>
              {/* Labels Column */}
              <td colSpan={2} className="sig-cell">
                <div className="sig-placeholder">&nbsp;</div>
                <div className="sig-label">Signature:</div>
                <div className="sig-label">Printed Name:</div>
                <div className="sig-label">Designation:</div>
              </td>

              {/* Requested By Column */}
              <td colSpan={2} className="sig-cell">
                <div className="center"><strong>Requested by:</strong></div>
                <div className="sig-placeholder sig-line-border"></div>
                <div className="sig-line">{data.requestedBy}</div>
                <div className="sig-sub">{data.requestedDesignation}</div>
              </td>

              {/* Approved By Column */}
              <td colSpan={2} className="sig-cell">
                <div className="center"><strong>Approved by:</strong></div>
                <div className="sig-placeholder sig-line-border"></div>
                <div className="sig-line">{data.approvedBy}</div>
                <div className="sig-sub">{data.approvedDesignation}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PurchaseRequest;