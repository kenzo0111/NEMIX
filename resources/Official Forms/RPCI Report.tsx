import React, { useState } from 'react';

// --- Type Definitions ---
interface InventoryItem {
  id: string;
  article: string;
  description: string;
  stockNumber: string;
  unitOfMeasure: string;
  unitValue: number | string;
  balancePerCardQty: number | string;
  onHandPerCountQty: number | string;
  shortageOverageQty: number | string;
  shortageOverageValue: number | string;
  remarks: string;
}

interface RPCIFormState {
  inventoryType: string;
  asAtDate: string;
  fundCluster: string;
  accountableOfficer: string;
  officialDesignation: string;
  entityName: string;
  assumptionDate: string;
  items: InventoryItem[];
  certifiedCorrectBy: string;
  approvedBy: string;
  verifiedBy: string;
}

// --- Helper for empty row generation ---
const generateEmptyRow = (): InventoryItem => ({
  id: Math.random().toString(36).substr(2, 9),
  article: '',
  description: '',
  stockNumber: '',
  unitOfMeasure: '',
  unitValue: '',
  balancePerCardQty: '',
  onHandPerCountQty: '',
  shortageOverageQty: '',
  shortageOverageValue: '',
  remarks: '',
});

export default function InventoryReportForm() {
  const [formState, setFormState] = useState<RPCIFormState>({
    inventoryType: '',
    asAtDate: '',
    fundCluster: '',
    accountableOfficer: '',
    officialDesignation: '',
    entityName: '',
    assumptionDate: '',
    items: Array.from({ length: 10 }, generateEmptyRow), // Starts with 10 empty rows
    certifiedCorrectBy: '',
    approvedBy: '',
    verifiedBy: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: keyof InventoryItem, value: string) => {
    const newItems = [...formState.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormState((prev) => ({ ...prev, items: newItems }));
  };

  return (
    <div className="min-h-screen bg-gray-200 py-8 px-4 font-sans text-sm print:bg-white print:p-0">
      {/* Paper Container - styled to resemble an A4 sheet */}
      <div className="max-w-[1000px] mx-auto bg-white shadow-xl min-h-[11in] p-10 print:shadow-none print:w-full print:max-w-none border border-gray-300">
        
        {/* Header Section */}
        <div className="text-right italic mb-4">Appendix 66</div>
        
        <div className="text-center font-bold text-xl mb-4">
          REPORT ON THE PHYSICAL COUNT OF INVENTORIES
        </div>

        <div className="flex flex-col items-center mb-6 space-y-2">
          <input
            type="text"
            name="inventoryType"
            placeholder="(Type of Inventory Item)"
            className="border-b border-black outline-none text-center w-80 uppercase font-semibold"
            value={formState.inventoryType}
            onChange={handleInputChange}
          />
          <div className="flex items-center space-x-2">
            <span>As at</span>
            <input
              type="text"
              name="asAtDate"
              placeholder="e.g., December 31, 2023"
              className="border-b border-black outline-none w-48 text-center"
              value={formState.asAtDate}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="mb-4">
          <span className="font-semibold">Fund Cluster : </span>
          <input
            type="text"
            name="fundCluster"
            className="border-b border-black outline-none w-64"
            value={formState.fundCluster}
            onChange={handleInputChange}
          />
        </div>

        {/* Accountability Paragraph */}
        <div className="mb-6 leading-relaxed text-justify">
          For which{' '}
          <input
            type="text"
            name="accountableOfficer"
            placeholder="Name of Accountable Officer"
            className="border-b border-black outline-none w-64 text-center font-semibold"
            value={formState.accountableOfficer}
            onChange={handleInputChange}
          />
          ,{' '}
          <input
            type="text"
            name="officialDesignation"
            placeholder="Official Designation"
            className="border-b border-black outline-none w-48 text-center"
            value={formState.officialDesignation}
            onChange={handleInputChange}
          />
          ,{' '}
          <input
            type="text"
            name="entityName"
            placeholder="Entity Name"
            className="border-b border-black outline-none w-64 text-center"
            value={formState.entityName}
            onChange={handleInputChange}
          />{' '}
          is accountable, having assumed such accountability on{' '}
          <input
            type="text"
            name="assumptionDate"
            placeholder="Date of Assumption"
            className="border-b border-black outline-none w-48 text-center"
            value={formState.assumptionDate}
            onChange={handleInputChange}
          />
          .
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse border border-black text-center text-xs">
            <thead>
              <tr>
                <th className="border border-black p-1" rowSpan={2}>Article</th>
                <th className="border border-black p-1 w-48" rowSpan={2}>Description</th>
                <th className="border border-black p-1" rowSpan={2}>Stock<br/>Number</th>
                <th className="border border-black p-1" rowSpan={2}>Unit of<br/>Measure</th>
                <th className="border border-black p-1" rowSpan={2}>Unit<br/>Value</th>
                <th className="border border-black p-1" rowSpan={2}>Balance<br/>Per Card<br/>(Quantity)</th>
                <th className="border border-black p-1" rowSpan={2}>On Hand<br/>Per Count<br/>(Quantity)</th>
                <th className="border border-black p-1" colSpan={2}>Shortage/Overage</th>
                <th className="border border-black p-1" rowSpan={2}>Remarks</th>
              </tr>
              <tr>
                <th className="border border-black p-1">Quantity</th>
                <th className="border border-black p-1">Value</th>
              </tr>
            </thead>
            <tbody>
              {formState.items.map((item, index) => (
                <tr key={item.id} className="h-8">
                  <td className="border border-black p-0">
                    <input type="text" className="w-full h-full outline-none px-1 text-center bg-transparent" value={item.article} onChange={(e) => handleItemChange(index, 'article', e.target.value)} />
                  </td>
                  <td className="border border-black p-0">
                    <input type="text" className="w-full h-full outline-none px-1 bg-transparent" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                  </td>
                  <td className="border border-black p-0">
                    <input type="text" className="w-full h-full outline-none px-1 text-center bg-transparent" value={item.stockNumber} onChange={(e) => handleItemChange(index, 'stockNumber', e.target.value)} />
                  </td>
                  <td className="border border-black p-0">
                    <input type="text" className="w-full h-full outline-none px-1 text-center bg-transparent" value={item.unitOfMeasure} onChange={(e) => handleItemChange(index, 'unitOfMeasure', e.target.value)} />
                  </td>
                  <td className="border border-black p-0">
                    <input type="number" className="w-full h-full outline-none px-1 text-right bg-transparent" value={item.unitValue} onChange={(e) => handleItemChange(index, 'unitValue', e.target.value)} />
                  </td>
                  <td className="border border-black p-0">
                    <input type="number" className="w-full h-full outline-none px-1 text-right bg-transparent" value={item.balancePerCardQty} onChange={(e) => handleItemChange(index, 'balancePerCardQty', e.target.value)} />
                  </td>
                  <td className="border border-black p-0">
                    <input type="number" className="w-full h-full outline-none px-1 text-right bg-transparent" value={item.onHandPerCountQty} onChange={(e) => handleItemChange(index, 'onHandPerCountQty', e.target.value)} />
                  </td>
                  <td className="border border-black p-0">
                    <input type="number" className="w-full h-full outline-none px-1 text-right bg-transparent" value={item.shortageOverageQty} onChange={(e) => handleItemChange(index, 'shortageOverageQty', e.target.value)} />
                  </td>
                  <td className="border border-black p-0">
                    <input type="number" className="w-full h-full outline-none px-1 text-right bg-transparent" value={item.shortageOverageValue} onChange={(e) => handleItemChange(index, 'shortageOverageValue', e.target.value)} />
                  </td>
                  <td className="border border-black p-0">
                    <input type="text" className="w-full h-full outline-none px-1 bg-transparent" value={item.remarks} onChange={(e) => handleItemChange(index, 'remarks', e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures Section */}
        <div className="grid grid-cols-3 gap-8 text-center mt-12">
          {/* Certified Correct By */}
          <div className="flex flex-col items-center">
            <div className="w-full text-left mb-8">Certified Correct by:</div>
            <input
              type="text"
              name="certifiedCorrectBy"
              className="border-b border-black outline-none w-full text-center font-bold uppercase"
              value={formState.certifiedCorrectBy}
              onChange={handleInputChange}
            />
            <div className="text-xs mt-1">Signature over Printed Name of</div>
            <div className="text-xs">Inventory Committee Chair and Members</div>
          </div>

          {/* Approved By */}
          <div className="flex flex-col items-center">
            <div className="w-full text-left mb-8">Approved by:</div>
            <input
              type="text"
              name="approvedBy"
              className="border-b border-black outline-none w-full text-center font-bold uppercase"
              value={formState.approvedBy}
              onChange={handleInputChange}
            />
            <div className="text-xs mt-1">Signature over Printed Name of</div>
            <div className="text-xs">Head of Agency/Entity or Authorized Rep</div>
          </div>

          {/* Verified By */}
          <div className="flex flex-col items-center">
            <div className="w-full text-left mb-8">Verified by:</div>
            <input
              type="text"
              name="verifiedBy"
              className="border-b border-black outline-none w-full text-center font-bold uppercase"
              value={formState.verifiedBy}
              onChange={handleInputChange}
            />
            <div className="text-xs mt-1">Signature over Printed Name of</div>
            <div className="text-xs">COA Representative</div>
          </div>
        </div>

        {/* Print Button (Hidden during actual printing) */}
        <div className="mt-12 text-center print:hidden">
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow"
          >
            Print Form
          </button>
        </div>

      </div>
    </div>
  );
}
