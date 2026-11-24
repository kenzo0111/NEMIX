import React from 'react';

// --- Interfaces ---

export interface IcsItem {
  quantity?: number | string;
  unit?: string;
  unitCost?: number | string;
  totalCost?: number | string;
  description?: string;
  itemNo?: string;
  usefulLife?: string;
}

export interface IcsData {
  entityName?: string;
  fundCluster?: string;
  icsNo?: string; // Maps to $parNo in original
  notFoundMessage?: string; // Optional message if items aren't ready

  items?: IcsItem[];

  // Signatories
  receivedFromName?: string;
  receivedFromPosition?: string;
  receivedFromDate?: string;

  receivedByName?: string;
  receivedByPosition?: string;
  receivedByDate?: string;
}

interface InventoryCustodianSlipProps {
  data: IcsData;
  minRows?: number; // Default 10 per original PHP logic
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

const renderDescription = (text?: string) => {
  if (!text) return '\u00A0'; // Non-breaking space
  return text.split('\n').map((str, index, array) => (
    <React.Fragment key={index}>
      {str}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ));
};

export const InventoryCustodianSlip: React.FC<InventoryCustodianSlipProps> = ({ 
  data, 
  minRows = 10 
}) => {
  const items = data.items || [];
  
  // Calculate empty rows needed to reach minimum height
  const emptyRowsCount = Math.max(0, minRows - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <>
      <style>{`
        @page { size: A4; margin: 8mm; }
        .ics-container {
            font-family: 'Times New Roman', serif;
            font-size: 8.5pt;
            color: #000;
            background: #fff;
            width: 100%;
            max-width: 194mm;
            margin: 0 auto;
            box-sizing: border-box;
            line-height: 1.15;
        }

        /* Utilities */
        .ics-container .center { text-align: center; }
        .ics-container .bold { font-weight: bold; }
        
        /* Header */
        .ics-container .header { margin-bottom: 2px; overflow: hidden; }
        
        /* Meta Row (Entity/Fund) */
        .ics-container table.meta-row { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
        .ics-container table.meta-row td { border: none !important; padding: 1.5px 4px !important; vertical-align: middle !important; text-align: left !important; line-height: 1.1; font-size: 8.5pt; }
        .ics-container .meta-left { width: 65%; }
        .ics-container .meta-right { width: 35%; text-align: right; }
        .ics-container .meta-sub { margin-top: 2px; display: block; }

        /* Main Table */
        .ics-container table.main-table { width: 100%; border-collapse: collapse; margin-top: 0; }
        .ics-container .main-table th, .ics-container .main-table td { border: 1px solid #000; padding: 0.6mm 1mm; vertical-align: middle; word-break: break-word; font-size: 8pt; line-height: 1.1; }
        .ics-container .main-table th { text-align: center; font-weight: bold; background: #f2f2f2; padding: 0.8mm 1mm; }
        .ics-container .main-table td { text-align: center; height: auto; }
        .ics-container .main-table tr.empty-row td, .ics-container .empty-row td {
            height: 4mm !important;
            min-height: 4mm !important;
            padding: 0 1mm !important;
            line-height: 1 !important;
        }
        
        /* Column Widths */
        .ics-container .qty { width: 6%; }
        .ics-container .unit { width: 8%; }
        .ics-container .unit-cost { width: 11%; }
        .ics-container .total-cost { width: 11%; }
        .ics-container .description { width: 38%; text-align: left !important; padding-left: 4px !important; line-height: 1.15; }
        .ics-container .item-no { width: 13%; }
        .ics-container .useful-life { width: 13%; }

        /* Not Found Message */
        .ics-container .not-found-msg { text-align: center; padding: 20px 10px; color: #666; }
        
        /* Additional classes for inline styles */
        .ics-container .float-right { float: right; font-size: 16pt; font-style: italic; }
        .ics-container .clear-both { clear: both; }
        .ics-container .title { margin: 1px 0 3px 0; font-size: 11.5pt; font-weight: bold; letter-spacing: 0.3px; }
        .ics-container .not-found-main { font-size: 11pt; margin-bottom: 6px; }
        .ics-container .not-found-sub { font-size: 8.5pt; color: #999; }
        .ics-container .description-header { text-align: center; }
        .ics-container .purpose-cell { padding: 4px 6px; }
        
        /* Signatures */
        .ics-container .signatures { width: 100%; margin-top: 4px; display: flex; }
        .ics-container .sig-block { width: 50%; padding: 0 8px; vertical-align: top; box-sizing: border-box; }
        .ics-container .sig-block:first-child { border-right: 1px solid #000; padding-right: 10px; }
        .ics-container .sig-block:last-child { padding-left: 10px; }
        
        .ics-container .sig-label { text-align: left; font-weight: bold; margin-bottom: 16px; font-size: 8.5pt; line-height: 1.1; }
        .ics-container .sig-line { width: 100%; border-bottom: 1px solid #000; margin-bottom: 2px; }
        .ics-container .sig-name { font-weight: bold; font-size: 8.5pt; text-align: center; margin-bottom: 1px; text-transform: uppercase; line-height: 1.15; }
        .ics-container .sig-subtext { font-size: 7pt; line-height: 1.15; text-align: center; color: #c00; }
        .ics-container .sig-subtext.position { color: #000; }

        @media print {
            body { margin: 0; padding: 0; }
            .ics-container { width: 100%; max-width: none; }
            .ics-container .main-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div data-paper-preview className="ics-container">
        {/* Top Header */}
        <div className="header">
          <div className="float-right"><strong><em>Appendix 59</em></strong></div>
          <div className="clear-both"></div>
        </div>

        <h2 className="center title">
          INVENTORY CUSTODIAN SLIP
        </h2>

        {/* Optional Not Found Message */}
        {data.notFoundMessage && (
          <div className="not-found-msg">
            <p className="not-found-main">{data.notFoundMessage}</p>
            <p className="not-found-sub">
              This form will be generated when the purchase order is processed and items are received.
            </p>
          </div>
        )}

        {/* Meta Info Row */}
        <table className="meta-row">
          <tbody>
            <tr>
              <td className="meta-left">
                <div><strong>Entity Name :</strong> {data.entityName || '____________________________________'}</div>
                <div className="meta-sub"><strong>Fund Cluster :</strong> {data.fundCluster || '____________________________________'}</div>
              </td>
              <td className="meta-right">
                <strong>ICS No. :</strong> {data.icsNo || '_______________'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Main Items Table */}
        <table className="main-table">
          <thead>
            <tr>
              <th rowSpan={2} className="qty">Quantity</th>
              <th rowSpan={2} className="unit">Unit</th>
              <th colSpan={2}>Amount</th>
              <th rowSpan={2} className="description description-header">Description</th>
              <th rowSpan={2} className="item-no">Inventory Item No.</th>
              <th rowSpan={2} className="useful-life">Estimated Useful Life</th>
            </tr>
            <tr>
              <th className="unit-cost">Unit Cost</th>
              <th className="total-cost">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {/* Render Data Items */}
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
                <td>{formatCurrency(item.unitCost)}</td>
                <td>{formatCurrency(item.totalCost)}</td>
                <td className="description">{renderDescription(item.description)}</td>
                <td>{item.itemNo}</td>
                <td>{item.usefulLife}</td>
              </tr>
            ))}

            {/* Render Empty Filling Rows */}
            {emptyRows.map((_, index) => (
              <tr key={`empty-${index}`} className="empty-row">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td className="description">&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
          
          {/* Footer Signature Block */}
          <tfoot>
            <tr>
              <td colSpan={7} className="purpose-cell">
                <div className="signatures">
                  {/* Received From (Left) */}
                  <div className="sig-block">
                    <div className="sig-label">Received from :</div>
                    <div className="sig-line"></div>
                    <div className="sig-name">
                      {data.receivedFromName || 'ARSENIO GEM A. GARCILLANOSA'}
                    </div>
                    <div className="sig-subtext">Signature Over Printed Name</div>
                    <div className="sig-subtext position">
                      {data.receivedFromPosition || 'SUPPLY OFFICER III/ADMIN OFFICER V'}
                    </div>
                    <div className="sig-subtext position">
                      Date: {data.receivedFromDate || '_________________'}
                    </div>
                  </div>

                  {/* Received By (Right) */}
                  <div className="sig-block">
                    <div className="sig-label">Received by:</div>
                    <div className="sig-line"></div>
                    <div className="sig-name">
                      {data.receivedByName || '_______________________________'}
                    </div>
                    <div className="sig-subtext">Signature Over Printed Name</div>
                    <div className="sig-subtext position">
                      Position: {data.receivedByPosition || '_________________'}
                    </div>
                    <div className="sig-subtext position">
                      Date: {data.receivedByDate || '_________________'}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
};

export default InventoryCustodianSlip;
