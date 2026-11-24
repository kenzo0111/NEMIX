import React from 'react';
import { formatDisplayDate } from '@/utils/dateUtils';

// --- Types ---

interface POItem {
  stock_number?: string;
  unit?: string;
  description?: string;
  quantity: number;
  unit_cost: number;
  amount: number;
}

interface PurchaseOrderProps {
  po_number?: string;
  entity_name?: string;
  entity_address?: string;
  supplier?: string;
  supplier_address?: string;
  date_of_purchase?: string; // ISO string or Date string
  tin_number?: string;
  mode_of_procurement?: string;
  mode_of_payment?: string;
  place_of_delivery?: string;
  delivery_term?: string;
  date_of_delivery?: string;
  payment_term?: string;
  items?: POItem[];
  grand_total?: number;
  fund_cluster?: string;
  ors_burs_no?: string;
  funds_available?: string;
  ors_burs_date?: string;
  ors_burs_amount?: string | number;
  accountant_signature?: string;
}

// --- Helpers ---

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return formatDisplayDate(dateString, 'long');
};

const formatNumber = (num?: number) => {
  return (num || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// --- Component ---

export const PurchaseOrder: React.FC<PurchaseOrderProps> = (props) => {
  const {
    po_number = 'PO',
    entity_name = '',
    entity_address = 'lot 8, F. Pimentel',
    supplier = '',
    supplier_address = '',
    date_of_purchase,
    tin_number = '',
    mode_of_procurement,
    mode_of_payment,
    place_of_delivery = '',
    delivery_term = '',
    date_of_delivery,
    payment_term = '',
    items = [],
    grand_total = 0,
    fund_cluster = '',
    ors_burs_no = '',
    funds_available = '',
    ors_burs_date,
    ors_burs_amount = '',
    accountant_signature = '',
  } = props;

  const procurementMode = mode_of_procurement || mode_of_payment || '';

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 8mm; }
        .po-container { 
            font-family: 'Times New Roman', Times, serif; 
            font-size: 8.5pt; 
            background: #fff; 
            color: #000; 
            width: 100%; 
            max-width: 194mm; 
            margin: 0 auto;
            line-height: 1.15;
            box-sizing: border-box;
        }
        .po-container .po-doc { background: #fff; padding: 4px 6px; box-sizing: border-box; position: relative; }
        .po-container .annex-label { position: absolute; top: 4px; right: 8px; font-size: 16pt; font-weight: 700; color: #000; font-style: italic; }
        .po-container table { border-collapse: collapse; width: 100%; font-size: 8pt; }
        .po-container td { vertical-align: top; padding: 2px 3px; line-height: 1.1; }
        
        /* Utility Classes recreated from HTML */
        .po-container .table-cell-border { border-right: 1px solid #000; border-top: 1px solid #000; }
        .po-container .table-cell-border-right { border-right: 1px solid #000; }
        .po-container .table-cell-border-top { border-top: 1px solid #000; }
        .po-container .table-border-2 { border: 1.5px solid #000; }
        .po-container .text-center { text-align: center; }
        .po-container .text-right { text-align: right; }
        .po-container .font-semibold { font-weight: 600; }
        .po-container .font-bold { font-weight: 700; }
        
        /* Inline style replacements */
        .po-container .center-margin-bottom { text-align: center; margin-bottom: 4px; }
        .po-container .h1-po { font-size: 11.5pt; font-weight: 700; margin: 0 0 2px; letter-spacing: 0.3px; }
        .po-container .p-underline { font-size: 9.5pt; text-decoration: underline; margin: 0 0 1px; }
        .po-container .p-italic-gray { font-size: 8pt; font-style: italic; margin: 0; color: #444; }
        .po-container .width-15 { width: 15%; }
        .po-container .width-45 { width: 45%; }
        .po-container .width-25 { width: 25%; }
        .po-container .padding-12 { padding: 4px 6px; }
        .po-container .font-size-12 { font-size: 8.5pt; }
        .po-container .width-13 { width: 13%; }
        .po-container .width-8 { width: 8%; }
        .po-container .width-39 { width: 39%; }
        .po-container .width-10 { width: 10%; }
        .po-container .signature-cell { height: auto; min-height: auto; vertical-align: top; padding: 4px 6px; }
        .po-container .p-italic-small-margin { margin-bottom: 3px; font-style: italic; font-size: 7.5pt; line-height: 1.1; }
        .po-container .signature-line { width: 160px; margin: 0 auto 3px; height: 20px; border-bottom: 1.5px solid #000; }
        .po-container .p-italic-small { font-size: 7.5pt; font-style: italic; line-height: 1.1; }
        .po-container .flex-center { margin-top: 3px; display: flex; align-items: center; justify-content: center; }
        .po-container .span-small-margin { font-size: 7.5pt; margin-right: 4px; }
        .po-container .date-line { border-bottom: 1px solid black; display: inline-block; width: 70px; padding-bottom: 1px; }
        .po-container .center-margin-top { text-align: center; margin-top: 6px; }
        .po-container .width-35 { width: 35%; }
        .po-container .accountant-cell { padding: 4px 6px; height: auto; min-height: auto; vertical-align: bottom; }
        .po-container .accountant-signature { height: 24px; border-bottom: 1.5px solid #000; margin: 0 auto 2px; width: 160px; display: flex; align-items: flex-end; justify-content: center; font-size: 8pt; }
        .po-container .p-bold-small-margin { font-size: 8pt; font-weight: 700; margin: 2px 0 0; }
        
        @media print { 
            body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
            .po-container { max-width: none; width: 100%; }
        }
      `}</style>

      <div data-paper-preview className="po-container">
        <div className="po-doc">
          <div className="center-margin-bottom">
            <div className="annex-label">Appendix 6.1</div>
            <h1 className="h1-po">PURCHASE ORDER</h1>
            <p className="p-underline">
              {entity_name}
            </p>
            <p className="p-italic-gray">
              {entity_address}
            </p>
          </div>

          <div className="table-border-2">
            <table>
              <tbody>
                <tr>
                  <td className="table-cell-border-right font-semibold width-15">
                    Supplier:
                  </td>
                  <td colSpan={3} className="table-cell-border-right width-45">
                    {supplier}
                  </td>
                  <td className="table-cell-border-right font-semibold width-15">
                    P.O. No.:
                  </td>
                  <td className="width-25">{po_number}</td>
                </tr>

                <tr>
                  <td className="table-cell-border font-semibold">Address:</td>
                  <td colSpan={3} className="table-cell-border-right table-cell-border-top">
                    {supplier_address}
                  </td>
                  <td className="table-cell-border-right table-cell-border-top font-semibold">
                    Date:
                  </td>
                  <td className="table-cell-border-top">{formatDate(date_of_purchase)}</td>
                </tr>

                <tr>
                  <td className="table-cell-border font-semibold">TIN:</td>
                  <td colSpan={3} className="table-cell-border-right table-cell-border-top">
                    {tin_number}
                  </td>
                  <td className="table-cell-border-right table-cell-border-top font-semibold">
                    Mode of Procurement:
                  </td>
                  <td className="table-cell-border-top">{procurementMode}</td>
                </tr>

                <tr>
                  <td colSpan={6} className="table-cell-border-top padding-12">
                    <strong className="font-size-12">Gentlemen:</strong>
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Please furnish this Office the following articles
                    subject to the terms and conditions contained herein:
                  </td>
                </tr>

                <tr>
                  <td className="table-cell-border font-semibold">Place of Delivery:</td>
                  <td colSpan={2} className="table-cell-border-right table-cell-border-top">
                    {place_of_delivery}
                  </td>
                  <td className="table-cell-border-right table-cell-border-top font-semibold">
                    Delivery Term:
                  </td>
                  <td colSpan={2} className="table-cell-border-top">
                    {delivery_term}
                  </td>
                </tr>

                <tr>
                  <td className="table-cell-border font-semibold">Date of Delivery:</td>
                  <td colSpan={2} className="table-cell-border-right table-cell-border-top">
                    {formatDate(date_of_delivery)}
                  </td>
                  <td className="table-cell-border-right table-cell-border-top font-semibold">
                    Payment Term:
                  </td>
                  <td colSpan={2} className="table-cell-border-top">
                    {payment_term}
                  </td>
                </tr>

                {/* Headers */}
                <tr>
                  <td className="table-cell-border text-center font-semibold width-13">
                    Stock/Property Number
                  </td>
                  <td className="table-cell-border text-center font-semibold width-8">
                    Unit
                  </td>
                  <td className="table-cell-border text-center font-semibold width-39">
                    Description
                  </td>
                  <td className="table-cell-border text-center font-semibold width-10">
                    Quantity
                  </td>
                  <td className="table-cell-border text-center font-semibold width-15">
                    Unit Cost
                  </td>
                  <td className="table-cell-border-top text-center font-semibold width-15">
                    Amount
                  </td>
                </tr>

                {/* Loop Items */}
                {items.length > 0 ? (
                  items.map((item, index) => (
                    <tr key={index}>
                      <td className="table-cell-border">{item.stock_number}</td>
                      <td className="table-cell-border">{item.unit}</td>
                      <td className="table-cell-border">{item.description}</td>
                      <td className="table-cell-border text-center">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="table-cell-border text-right">
                        {formatNumber(item.unit_cost)}
                      </td>
                      <td className="table-cell-border text-right">
                        {formatNumber(item.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="table-cell-border text-center">
                      No items
                    </td>
                  </tr>
                )}

                {/* Grand Total */}
                <tr>
                  <td colSpan={5} className="table-cell-border text-right font-semibold">
                    Grand Total:
                  </td>
                  <td className="table-cell-border-top text-right font-bold">
                    {formatNumber(grand_total)}
                  </td>
                </tr>

                {/* Footer Signatures */}
                <tr>
                  <td
                    colSpan={3}
                    className="table-cell-border text-center signature-cell"
                  >
                    <p className="p-italic-small-margin">
                      In case of failure to make the total delivery within the time specified above, a
                      penalty of one percent (1%) of the total contract price shall be imposed for
                      each day of delay, until the obligation is fully complied with.
                    </p>
                    <p className="p-italic-small-margin">
                      Conforme:
                    </p>
                    <div className="signature-line"></div>
                    <p className="p-italic-small">
                      signature over printed name of supplier
                    </p>
                    <div className="flex-center">
                      <span className="span-small-margin">Date:</span>
                      <span className="date-line"></span>
                    </div>
                  </td>
                  <td
                    colSpan={3}
                    className="table-cell-border-top text-center signature-cell"
                  >
                    <div className="center-margin-top">
                      <p className="p-italic-small-margin">
                        Very truly yours,
                      </p>
                      <div className="signature-line"></div>
                      <p className="p-italic-small">
                        signature over printed name of authorization
                      </p>
                      <p className="p-italic-small">College President</p>
                    </div>
                  </td>
                </tr>

                {/* Accounting Section */}
                <tr>
                  <td className="table-cell-border font-semibold width-15">
                    Fund Cluster:
                  </td>
                  <td
                    className="table-cell-border-right table-cell-border-top width-35"
                  >
                    {fund_cluster}
                  </td>
                  <td className="table-cell-border font-semibold width-15">
                    ORS/BURS No.:
                  </td>
                  <td colSpan={3} className="table-cell-border-top">
                    {ors_burs_no}
                  </td>
                </tr>

                <tr>
                  <td className="table-cell-border font-semibold">Funds Available:</td>
                  <td className="table-cell-border-right table-cell-border-top">
                    {funds_available}
                  </td>
                  <td className="table-cell-border font-semibold text-left">Date of ORS/BURS:</td>
                  <td className="table-cell-border">{formatDate(ors_burs_date)}</td>
                  <td className="table-cell-border font-semibold text-center">Amount:</td>
                  <td className="table-cell-border-top">{ors_burs_amount}</td>
                </tr>

                <tr>
                  <td
                    colSpan={6}
                    className="table-cell-border-top text-center accountant-cell"
                  >
                    <div className="accountant-signature">
                      {accountant_signature}
                    </div>
                    <p className="p-bold-small-margin">
                      Accountant's Signature
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default PurchaseOrder;
