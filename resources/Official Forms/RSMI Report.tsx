import React from 'react';

export interface RSMIItem {
  id?: string;
  risNo: string;
  responsibilityCenterCode: string;
  stockNo: string;
  itemDescription: string;
  unit: string;
  quantityIssued: number | null;
  unitCost: number | null;
  amount: number | null;
}

export interface RSMIRecapitulation {
  id?: string;
  stockNo: string;
  quantity: number | null;
  unitCost: number | null;
  totalCost: number | null;
  uacsObjectCode: string;
}

export interface RSMIForm {
  entityName: string;
  serialNo: string;
  fundCluster: string;
  date: string; // ISO date string or formatted string
  
  // Main Table Items
  issuedItems: RSMIItem[];
  
  // Recapitulation Items
  recapitulationItems: RSMIRecapitulation[];
  
  // Signatories
  supplyCustodianName: string;
  accountingStaffName: string;
  accountingDate: string;
}

interface Props {
  data: RSMIForm;
}

export default function RSMIFormPaper({ data }: Props) {
  // Pad empty rows to maintain the paper-like appearance (e.g., min 10 rows)
  const paddedItems = [...data.issuedItems];
  while (paddedItems.length < 10) {
    paddedItems.push({ risNo: '', responsibilityCenterCode: '', stockNo: '', itemDescription: '', unit: '', quantityIssued: null, unitCost: null, amount: null });
  }

  const paddedRecap = [...data.recapitulationItems];
  while (paddedRecap.length < 5) {
    paddedRecap.push({ stockNo: '', quantity: null, unitCost: null, totalCost: null, uacsObjectCode: '' });
  }

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white text-black border border-gray-300 shadow-lg text-sm font-sans" style={{ minHeight: '11in' }}>
      {/* Header */}
      <div className="text-right italic font-semibold mb-4">Appendix 64</div>
      <h1 className="text-center font-bold text-xl mb-8 uppercase">Report of Supplies and Materials Issued</h1>

      {/* Form Meta Data */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex mb-2">
            <span className="w-28 font-semibold">Entity Name:</span>
            <span className="flex-1 border-b border-black outline-none px-2">{data.entityName}</span>
          </div>
          <div className="flex">
            <span className="w-28 font-semibold">Fund Cluster:</span>
            <span className="flex-1 border-b border-black outline-none px-2">{data.fundCluster}</span>
          </div>
        </div>
        <div>
          <div className="flex mb-2">
            <span className="w-24 font-semibold">Serial No.:</span>
            <span className="flex-1 border-b border-black outline-none px-2">{data.serialNo}</span>
          </div>
          <div className="flex">
            <span className="w-24 font-semibold">Date:</span>
            <span className="flex-1 border-b border-black outline-none px-2">{data.date}</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <table className="w-full border-collapse border border-black mb-8 text-center text-xs">
        <thead>
          <tr>
            <th colSpan={6} className="border border-black p-2 bg-gray-50 italic">To be filled up by the Supply and/or Property Division/Unit</th>
            <th colSpan={2} className="border border-black p-2 bg-gray-50 italic">To be filled up by the Accounting Division/Unit</th>
          </tr>
          <tr>
            <th className="border border-black p-2">RIS No.</th>
            <th className="border border-black p-2">Responsibility Center Code</th>
            <th className="border border-black p-2">Stock No.</th>
            <th className="border border-black p-2 w-1/4">Item</th>
            <th className="border border-black p-2">Unit</th>
            <th className="border border-black p-2">Quantity Issued</th>
            <th className="border border-black p-2">Unit Cost</th>
            <th className="border border-black p-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {paddedItems.map((item, idx) => (
            <tr key={idx} className="h-6">
              <td className="border border-black p-1">{item.risNo}</td>
              <td className="border border-black p-1">{item.responsibilityCenterCode}</td>
              <td className="border border-black p-1">{item.stockNo}</td>
              <td className="border border-black p-1 text-left">{item.itemDescription}</td>
              <td className="border border-black p-1">{item.unit}</td>
              <td className="border border-black p-1">{item.quantityIssued || ''}</td>
              <td className="border border-black p-1">{item.unitCost || ''}</td>
              <td className="border border-black p-1">{item.amount || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Recapitulation Section */}
      <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
        <table className="w-full border-collapse border border-black text-center">
          <thead>
            <tr>
              <th colSpan={3} className="border border-black p-2 text-left bg-gray-50">Recapitulation:</th>
            </tr>
            <tr>
              <th className="border border-black p-2">Stock No.</th>
              <th className="border border-black p-2">Quantity</th>
              <th className="border border-black p-2">Unit Cost</th>
            </tr>
          </thead>
          <tbody>
            {paddedRecap.map((recap, idx) => (
              <tr key={idx} className="h-6">
                <td className="border border-black p-1">{recap.stockNo}</td>
                <td className="border border-black p-1">{recap.quantity || ''}</td>
                <td className="border border-black p-1">{recap.unitCost || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="w-full border-collapse border border-black text-center">
          <thead>
            <tr>
              <th colSpan={2} className="border border-black p-2 text-left bg-gray-50">Recapitulation:</th>
            </tr>
            <tr>
              <th className="border border-black p-2">Total Cost</th>
              <th className="border border-black p-2">UACS Object Code</th>
            </tr>
          </thead>
          <tbody>
            {paddedRecap.map((recap, idx) => (
              <tr key={idx} className="h-6">
                <td className="border border-black p-1">{recap.totalCost || ''}</td>
                <td className="border border-black p-1">{recap.uacsObjectCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signatures */}
      <div className="mt-12 text-sm border-t-2 border-black pt-4">
        <div className="mb-8">
          <span className="font-semibold">I hereby certify to the correctness of the above information.</span>
        </div>
        
        <div className="grid grid-cols-2 gap-12 text-center">
          <div>
            <div className="border-b border-black font-bold uppercase pb-1 mb-1 h-8 flex items-end justify-center">
              {data.supplyCustodianName}
            </div>
            <p className="text-xs">Signature over Printed Name of Supply and/or Property Custodian</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
               <div className="text-left text-xs mb-2">Posted by:</div>
               <div className="border-b border-black font-bold uppercase pb-1 mb-1 h-8 flex items-end justify-center">
                  {data.accountingStaffName}
               </div>
               <p className="text-xs">Signature over Printed Name of Designated Accounting Staff</p>
            </div>
            <div>
               <div className="text-left text-xs mb-2 invisible">Date</div>
               <div className="border-b border-black pb-1 mb-1 h-8 flex items-end justify-center">
                  {data.accountingDate}
               </div>
               <p className="text-xs">Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
