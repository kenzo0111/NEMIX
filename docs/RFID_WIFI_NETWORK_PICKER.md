# RFID dashboard Wi-Fi network picker

The RFID settings page automatically requests nearby networks when an online scanner running firmware 2.5.0 or newer has no recent network list. Refresh networks requests another scan. Select a network card, enter its password (or select an open network), then save the scanner configuration. Hidden networks remain available through manual entry.

Discovery runs on the scanner's 2.4 GHz Wi-Fi radio. Browsers cannot enumerate Wi-Fi networks themselves. An offline scanner must first be connected using its local setup portal; firmware older than 2.5.0 must be updated before dashboard discovery works.

The authenticated admin endpoint queues a per-device request identifier in the application cache. The signed device heartbeat delivers that identifier to the firmware. Firmware starts an asynchronous Wi-Fi scan while idle, returns up to 20 unique networks sorted by signal strength, and sends an early heartbeat with the results. Discovery does not change saved credentials or configuration versions. The dashboard polls scanner data every five seconds and only offers network results less than two minutes old. A failed scan or lost response can be retried; pending requests expire after two hours. No Wi-Fi passwords are included in discovery data.

Deploy the updated application and frontend assets, then build and install firmware 2.5.0 on the scanner using the existing flashing workflow. No database migration is needed. On hardware, verify Refresh networks, selecting a secured network, an open network, an empty scan, switching devices, and applying a network that cannot reach the server (existing rollback behavior).
