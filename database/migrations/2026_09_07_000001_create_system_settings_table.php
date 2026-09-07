<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('category', 50)->index();
            $table->string('key', 100)->unique();
            $table->json('value')->nullable();
            $table->string('data_type', 20)->default('string'); // string, integer, boolean, json
            $table->string('label', 255);
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(false)->index();
            $table->boolean('is_encrypted')->default(false);
            $table->timestamps();
        });

        // Seed initial consumable system settings
        $now = now();
        $defaultSettings = [
            // 1. INSTITUTION & BRANDING (Public for print rendering)
            [
                'category' => 'institution',
                'key' => 'institution.name',
                'value' => json_encode('University of Camarines Norte'),
                'data_type' => 'string',
                'label' => 'Institution Full Name',
                'description' => 'Official agency name displayed on headers of RIS, RSMI, RPCI, and Stock Cards.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'institution',
                'key' => 'institution.acronym',
                'value' => json_encode('UCN'),
                'data_type' => 'string',
                'label' => 'Institution Acronym',
                'description' => 'Short agency code used in reports and tags.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'institution',
                'key' => 'institution.custodial_office',
                'value' => json_encode('Supply & Property Management Office (SPMO)'),
                'data_type' => 'string',
                'label' => 'Custodial Office Title',
                'description' => 'Primary supply office managing consumable stocks.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'institution',
                'key' => 'institution.campus_address',
                'value' => json_encode('Daet, Camarines Norte'),
                'data_type' => 'string',
                'label' => 'Campus / Physical Address',
                'description' => 'Official campus location printed on reports.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'institution',
                'key' => 'institution.responsibility_center_code',
                'value' => json_encode('01-101-00'),
                'data_type' => 'string',
                'label' => 'Responsibility Center Code (RCC)',
                'description' => 'Default COA/agency code for SPMO.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'institution',
                'key' => 'institution.logo_path',
                'value' => json_encode('/images/ucn-crest.png'),
                'data_type' => 'string',
                'label' => 'Institutional Seal / Logo Path',
                'description' => 'Path to official crest rendered on printable forms.',
                'is_public' => true,
                'is_encrypted' => false,
            ],

            // 2. CONSUMABLE SIGNATORIES (Public for document rendering)
            [
                'category' => 'signatories',
                'key' => 'signatories.ris_approved_by_name',
                'value' => json_encode('ARSENIO GEM A. GARCILLANOSA'),
                'data_type' => 'string',
                'label' => 'RIS Approving Officer Name',
                'description' => 'Official who authorizes consumable requisitions on the Requisition & Issue Slip.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.ris_approved_by_designation',
                'value' => json_encode('SUPPLY OFFICER III/ADMIN OFFICER V'),
                'data_type' => 'string',
                'label' => 'RIS Approving Officer Designation',
                'description' => 'Official position title of the RIS approving officer.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.ris_issued_by_name',
                'value' => json_encode('Supply Custodian / Storekeeper'),
                'data_type' => 'string',
                'label' => 'RIS Issuing Custodian Name',
                'description' => 'Warehouseman or custodian in charge of dispatching physical stock.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.ris_issued_by_designation',
                'value' => json_encode('Administrative Aide VI / Storekeeper'),
                'data_type' => 'string',
                'label' => 'RIS Issuing Custodian Designation',
                'description' => 'Position of the custodian issuing supplies.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.ris_oic_active',
                'value' => json_encode(false),
                'data_type' => 'boolean',
                'label' => 'RIS Acting / OIC Status Active',
                'description' => 'When active, prepends OIC delegation title to approved RIS forms.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.ris_oic_prefix',
                'value' => json_encode('OIC, '),
                'data_type' => 'string',
                'label' => 'RIS OIC Prefix Text',
                'description' => 'Prefix text rendered when an Acting Officer-in-Charge is on duty.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.rsmi_certified_by_name',
                'value' => json_encode('ARSENIO GEM A. GARCILLANOSA'),
                'data_type' => 'string',
                'label' => 'RSMI Certification Officer Name',
                'description' => 'Official certifying the monthly Report of Supplies and Materials Issued.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.rsmi_certified_by_designation',
                'value' => json_encode('Supply Officer III / SPMO Head'),
                'data_type' => 'string',
                'label' => 'RSMI Certification Officer Designation',
                'description' => 'Official title for RSMI certificate.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.rsmi_posted_by_name',
                'value' => json_encode('Accounting Representative / Bookkeeper'),
                'data_type' => 'string',
                'label' => 'RSMI Accounting Posted By',
                'description' => 'Accounting personnel receiving the RSMI ledger.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.rpci_accountable_officer_name',
                'value' => json_encode('Arsenio Gem A. Garcillanosa'),
                'data_type' => 'string',
                'label' => 'RPCI Accountable Officer Name',
                'description' => 'Accountable officer on the Report on Physical Count of Inventories.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.rpci_accountable_officer_designation',
                'value' => json_encode('Supply Custodian / Supply Officer III'),
                'data_type' => 'string',
                'label' => 'RPCI Accountable Officer Designation',
                'description' => 'Official position of the RPCI accountable officer.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.rpci_committee_chair',
                'value' => json_encode('Inspection Committee Chairman'),
                'data_type' => 'string',
                'label' => 'RPCI Inventory Committee Chairman',
                'description' => 'Head of physical count inspection committee.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'signatories',
                'key' => 'signatories.stock_card_custodian',
                'value' => json_encode('Storekeeper / Property Custodian'),
                'data_type' => 'string',
                'label' => 'Stock Card Custodian Name',
                'description' => 'Personnel maintaining individual consumable stock card cards.',
                'is_public' => true,
                'is_encrypted' => false,
            ],

            // 3. INVENTORY & REORDER POLICIES
            [
                'category' => 'inventory',
                'key' => 'inventory.low_stock_threshold',
                'value' => json_encode(10),
                'data_type' => 'integer',
                'label' => 'Global Low-Stock Reorder Threshold',
                'description' => 'Quantity at or below which consumable items trigger a Low Stock warning status.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'inventory',
                'key' => 'inventory.critical_stock_threshold',
                'value' => json_encode(3),
                'data_type' => 'integer',
                'label' => 'Critical Stock Alert Threshold',
                'description' => 'Urgent red-alert stock quantity requiring immediate procurement replenishment.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'inventory',
                'key' => 'inventory.strict_stock_enforcement',
                'value' => json_encode(true),
                'data_type' => 'boolean',
                'label' => 'Strict Balance Issuance Enforcement',
                'description' => 'Disallows issuance if requested quantity exceeds current available physical balance.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'inventory',
                'key' => 'inventory.category_thresholds',
                'value' => json_encode([
                    'Office Supplies' => 25,
                    'Janitorial Supplies' => 15,
                    'IT & Computer Consumables' => 5,
                    'Medical & First Aid' => 15,
                    'Laboratory Consumables' => 10,
                ]),
                'data_type' => 'json',
                'label' => 'Category-Specific Reorder Thresholds',
                'description' => 'Overriding low stock thresholds per consumable category.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'inventory',
                'key' => 'inventory.units_of_issue',
                'value' => json_encode([
                    'piece', 'box', 'ream', 'pack', 'roll', 'bottle', 'gallon', 'liter', 'tube', 'pad', 'set'
                ]),
                'data_type' => 'json',
                'label' => 'Standard Consumable Units of Issue',
                'description' => 'Approved unit choices for measuring consumable supply stock.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'inventory',
                'key' => 'inventory.fund_clusters',
                'value' => json_encode([
                    '01 - Regular Agency Fund',
                    '05 - Internally Generated Funds (IGF)',
                    '07 - Trust Receipts',
                    '08 - Revolving Fund'
                ]),
                'data_type' => 'json',
                'label' => 'Active Fund Clusters',
                'description' => 'Standard government accounting fund clusters for supply requisitions.',
                'is_public' => true,
                'is_encrypted' => false,
            ],

            // 4. DOCUMENT NUMBERING & SEQUENCING
            [
                'category' => 'numbering',
                'key' => 'numbering.ris_prefix',
                'value' => json_encode('RIS-'),
                'data_type' => 'string',
                'label' => 'Requisition & Issue Slip (RIS) Prefix',
                'description' => 'Prefix code for generated RIS documents.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'numbering',
                'key' => 'numbering.rsmi_prefix',
                'value' => json_encode('RSMI-'),
                'data_type' => 'string',
                'label' => 'Report of Supplies Issued (RSMI) Prefix',
                'description' => 'Prefix code for monthly RSMI reports.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'numbering',
                'key' => 'numbering.rpci_prefix',
                'value' => json_encode('RPCI-'),
                'data_type' => 'string',
                'label' => 'Physical Count of Inventories (RPCI) Prefix',
                'description' => 'Prefix code for physical count inventory reports.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'numbering',
                'key' => 'numbering.stock_card_prefix',
                'value' => json_encode('STOCK-'),
                'data_type' => 'string',
                'label' => 'Stock Card Code Prefix',
                'description' => 'Prefix code for individual consumable items / stock cards.',
                'is_public' => true,
                'is_encrypted' => false,
            ],

            // 5. RFID STORAGE & BIN SCANNER CONFIGURATION
            [
                'category' => 'rfid',
                'key' => 'rfid.scan_debounce_ms',
                'value' => json_encode(1200),
                'data_type' => 'integer',
                'label' => 'RFID Scan Cooldown / Debounce (ms)',
                'description' => 'Milliseconds delay to prevent duplicate trigger reads on shelf bins or stock packs.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
            [
                'category' => 'rfid',
                'key' => 'rfid.active_mode',
                'value' => json_encode('bin_association'),
                'data_type' => 'string',
                'label' => 'Default Warehouse RFID Mode',
                'description' => 'Operating mode: bin_association, issuance_verification, or rpci_stocktake.',
                'is_public' => true,
                'is_encrypted' => false,
            ],

            // 6. EMAIL & ALERT NOTIFICATIONS
            [
                'category' => 'mail',
                'key' => 'mail.low_stock_email_alerts',
                'value' => json_encode(true),
                'data_type' => 'boolean',
                'label' => 'Automated Low-Stock Email Alerts',
                'description' => 'Sends email warnings to supply personnel when consumable stock dips below threshold.',
                'is_public' => false,
                'is_encrypted' => false,
            ],
            [
                'category' => 'mail',
                'key' => 'mail.alert_recipient_email',
                'value' => json_encode(''),
                'data_type' => 'string',
                'label' => 'Supply Alert Notification Recipient',
                'description' => 'Designated email for low-stock warnings (leave blank to notify current admin).',
                'is_public' => false,
                'is_encrypted' => false,
            ],

            // 7. SECURITY & SYSTEM OPERATIONS
            [
                'category' => 'security',
                'key' => 'security.session_timeout_minutes',
                'value' => json_encode(30),
                'data_type' => 'integer',
                'label' => 'Stockroom Terminal Auto-Logout (Minutes)',
                'description' => 'Inactivity period before supply personnel sessions automatically lock out.',
                'is_public' => true,
                'is_encrypted' => false,
            ],
        ];

        foreach ($defaultSettings as $setting) {
            $setting['created_at'] = $now;
            $setting['updated_at'] = $now;
            DB::table('system_settings')->insert($setting);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
