-- ============================================================
-- 0032: Full names for acronyms on definition slides
-- ============================================================
-- Run after 0031 (either order works, they touch different fields).
-- Slides whose job is to define or compare terms (diagram legends, term
-- lists, key terms, comparison-table headers and row labels) now always
-- carry the full name of each acronym in a separate `full` field
-- (`columnsFull` for table headers). The lesson player shows it set apart
-- from the definition in italic serif type, for example:
--   RPO   Recovery Point Objective
--         Maximum acceptable data loss, measured backwards in time...
-- Narration reads it as "RPO, Recovery Point Objective: ...".
--
-- 606 updates across 199 lessons. Each only applies if the label still
-- matches what was audited; re-running just rewrites the same values.


-- ---------------- a-plus-core-1 ----------------

-- Common Ports/Protocols (Remote Access, Directory Services, Network Management)
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,0,full}', to_jsonb($t$Secure Shell$t$::text))
  where id = '008af181-de84-420e-a786-a539bce80baf' and content_blocks #>> '{1,rows,0,label}' = $t$SSH$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,2,full}', to_jsonb($t$Domain Name System$t$::text))
  where id = '008af181-de84-420e-a786-a539bce80baf' and content_blocks #>> '{1,rows,2,label}' = $t$DNS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,3,full}', to_jsonb($t$Dynamic Host Configuration Protocol$t$::text))
  where id = '008af181-de84-420e-a786-a539bce80baf' and content_blocks #>> '{1,rows,3,label}' = $t$DHCP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,4,full}', to_jsonb($t$Network Time Protocol$t$::text))
  where id = '008af181-de84-420e-a786-a539bce80baf' and content_blocks #>> '{1,rows,4,label}' = $t$NTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,5,full}', to_jsonb($t$Simple Network Management Protocol$t$::text))
  where id = '008af181-de84-420e-a786-a539bce80baf' and content_blocks #>> '{1,rows,5,label}' = $t$SNMP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,6,full}', to_jsonb($t$LDAP: Lightweight Directory Access Protocol · LDAPS: Secure LDAP$t$::text))
  where id = '008af181-de84-420e-a786-a539bce80baf' and content_blocks #>> '{1,rows,6,label}' = $t$LDAP / LDAPS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,7,full}', to_jsonb($t$Remote Desktop Protocol$t$::text))
  where id = '008af181-de84-420e-a786-a539bce80baf' and content_blocks #>> '{1,rows,7,label}' = $t$RDP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$Network Time Protocol$t$::text))
  where id = '008af181-de84-420e-a786-a539bce80baf' and content_blocks #>> '{2,term}' = $t$NTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,columnsFull}', $t$["Secure Shell", null, "Remote Desktop Protocol"]$t$::jsonb)
  where id = '008af181-de84-420e-a786-a539bce80baf' and content_blocks #> '{3,columns}' = $t$["SSH", "Telnet", "RDP"]$t$::jsonb;

-- Configuring Basic Wired/Wireless SOHO Networks
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,steps,3,full}', to_jsonb($t$DHCP: Dynamic Host Configuration Protocol$t$::text))
  where id = '04fad0d0-8cec-4456-a9f2-bf0210158eb3' and content_blocks #>> '{1,diagram,steps,3,label}' = $t$Configure DHCP scope$t$;

-- Basic Cable Types and Connectors
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,0,full}', to_jsonb($t$High-Definition Multimedia Interface$t$::text))
  where id = '09fb4c7f-6bef-4068-a304-a16dd7acdf00' and content_blocks #>> '{1,rows,0,label}' = $t$HDMI$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,3,full}', to_jsonb($t$Video Graphics Array$t$::text))
  where id = '09fb4c7f-6bef-4068-a304-a16dd7acdf00' and content_blocks #>> '{1,rows,3,label}' = $t$VGA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["SATA: Serial ATA", null, null]$t$::jsonb)
  where id = '09fb4c7f-6bef-4068-a304-a16dd7acdf00' and content_blocks #> '{2,columns}' = $t$["SATA data", "SATA power", "Molex"]$t$::jsonb;

-- Display Components and Attributes
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,0,full}', to_jsonb($t$LCD: Liquid Crystal Display · IPS: In-Plane Switching$t$::text))
  where id = '1d4bf983-81fd-43ff-a907-cbf951967409' and content_blocks #>> '{1,rows,0,label}' = $t$LCD: IPS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,1,full}', to_jsonb($t$TN: Twisted Nematic$t$::text))
  where id = '1d4bf983-81fd-43ff-a907-cbf951967409' and content_blocks #>> '{1,rows,1,label}' = $t$LCD: TN$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,2,full}', to_jsonb($t$VA: Vertical Alignment$t$::text))
  where id = '1d4bf983-81fd-43ff-a907-cbf951967409' and content_blocks #>> '{1,rows,2,label}' = $t$LCD: VA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,3,full}', to_jsonb($t$Organic Light-Emitting Diode$t$::text))
  where id = '1d4bf983-81fd-43ff-a907-cbf951967409' and content_blocks #>> '{1,rows,3,label}' = $t$OLED$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$PPI: Pixels Per Inch$t$::text))
  where id = '1d4bf983-81fd-43ff-a907-cbf951967409' and content_blocks #>> '{2,terms,2,term}' = $t$Pixel density (PPI)$t$;

-- Wireless Networking Technologies
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,rungs,0,full}', to_jsonb($t$Wi-Fi Protected Access 3$t$::text))
  where id = '20afd9b2-9f41-476f-b979-0e608034bd21' and content_blocks #>> '{3,diagram,rungs,0,label}' = $t$WPA3$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,rungs,1,full}', to_jsonb($t$Wi-Fi Protected Access 2$t$::text))
  where id = '20afd9b2-9f41-476f-b979-0e608034bd21' and content_blocks #>> '{3,diagram,rungs,1,label}' = $t$WPA2$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,rungs,2,full}', to_jsonb($t$Wired Equivalent Privacy$t$::text))
  where id = '20afd9b2-9f41-476f-b979-0e608034bd21' and content_blocks #>> '{3,diagram,rungs,2,label}' = $t$WEP$t$;

-- Common Network Configuration Concepts
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$CIDR: Classless Inter-Domain Routing$t$::text))
  where id = '28331f74-0900-4123-9943-f85e93974f00' and content_blocks #>> '{1,terms,1,term}' = $t$Subnet mask / CIDR$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,0,full}', to_jsonb($t$Virtual Local Area Network$t$::text))
  where id = '28331f74-0900-4123-9943-f85e93974f00' and content_blocks #>> '{2,rows,0,label}' = $t$VLAN$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,1,full}', to_jsonb($t$Network Address Translation$t$::text))
  where id = '28331f74-0900-4123-9943-f85e93974f00' and content_blocks #>> '{2,rows,1,label}' = $t$NAT$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,2,full}', to_jsonb($t$APIPA: Automatic Private IP Addressing$t$::text))
  where id = '28331f74-0900-4123-9943-f85e93974f00' and content_blocks #>> '{2,rows,2,label}' = $t$APIPA (169.254)$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,3,full}', to_jsonb($t$DHCP: Dynamic Host Configuration Protocol$t$::text))
  where id = '28331f74-0900-4123-9943-f85e93974f00' and content_blocks #>> '{2,rows,3,label}' = $t$Static vs. DHCP$t$;

-- Troubleshooting Wireless Network Issues
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,4,full}', to_jsonb($t$SSID: Service Set Identifier$t$::text))
  where id = '34c9f064-58e5-498b-aaf9-4f14c5873baa' and content_blocks #>> '{1,rows,4,label}' = $t$SSID not visible$t$;

-- Common Networking Hardware Devices
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$Network Interface Card$t$::text))
  where id = '3f122be7-cefc-47c1-acd3-574a2f58dcd9' and content_blocks #>> '{3,terms,1,term}' = $t$NIC$t$;

-- Troubleshooting Motherboards, RAM, and CPUs
update lessons set content_blocks = jsonb_set(content_blocks, '{1,full}', to_jsonb($t$Power-on Self-Test$t$::text))
  where id = '5e65c31e-0266-4011-a0c2-63a8578532fd' and content_blocks #>> '{1,term}' = $t$POST$t$;

-- Domain 5 Recap: Hardware and Network Troubleshooting
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$POST: Power-on Self-Test$t$::text))
  where id = '6072e2fc-015e-4d02-bd43-cf9385768410' and content_blocks #>> '{1,terms,0,term}' = $t$No POST, no beep$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$PSU: Power Supply Unit$t$::text))
  where id = '6072e2fc-015e-4d02-bd43-cf9385768410' and content_blocks #>> '{1,terms,3,term}' = $t$Burning PSU$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,4,full}', to_jsonb($t$HDD: Hard Disk Drive$t$::text))
  where id = '6072e2fc-015e-4d02-bd43-cf9385768410' and content_blocks #>> '{1,terms,4,term}' = $t$Clicking HDD$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,5,full}', to_jsonb($t$RAID: Redundant Array of Independent Disks$t$::text))
  where id = '6072e2fc-015e-4d02-bd43-cf9385768410' and content_blocks #>> '{1,terms,5,term}' = $t$RAID 0$t$;

-- RAM Characteristics
update lessons set content_blocks = jsonb_set(content_blocks, '{1,full}', to_jsonb($t$DDR: Double Data Rate$t$::text))
  where id = '70f762a8-3f59-4f51-b1f6-249597683c08' and content_blocks #>> '{1,term}' = $t$DDR generations$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,full}', to_jsonb($t$ECC: Error-Correcting Code · RAM: Random Access Memory$t$::text))
  where id = '70f762a8-3f59-4f51-b1f6-249597683c08' and content_blocks #>> '{3,term}' = $t$ECC RAM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,0,full}', to_jsonb($t$DIMM: Dual in-Line Memory Module$t$::text))
  where id = '70f762a8-3f59-4f51-b1f6-249597683c08' and content_blocks #>> '{4,terms,0,term}' = $t$DIMM / SO-DIMM$t$;

-- Troubleshooting RAID Issues
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,0,full}', to_jsonb($t$RAID: Redundant Array of Independent Disks$t$::text))
  where id = '78a61322-09dc-48af-8eba-7bf83e6cec25' and content_blocks #>> '{1,rows,0,label}' = $t$RAID 0$t$;

-- Internet Connection Types and Network Types
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,1,full}', to_jsonb($t$Digital Subscriber Line$t$::text))
  where id = '902633fc-24ba-451e-b8fc-2b372f830cf0' and content_blocks #>> '{1,rows,1,label}' = $t$DSL$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,rungs,0,full}', to_jsonb($t$Wide Area Network$t$::text))
  where id = '902633fc-24ba-451e-b8fc-2b372f830cf0' and content_blocks #>> '{2,diagram,rungs,0,label}' = $t$WAN$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,rungs,1,full}', to_jsonb($t$Metropolitan Area Network$t$::text))
  where id = '902633fc-24ba-451e-b8fc-2b372f830cf0' and content_blocks #>> '{2,diagram,rungs,1,label}' = $t$MAN$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,rungs,2,full}', to_jsonb($t$Local Area Network$t$::text))
  where id = '902633fc-24ba-451e-b8fc-2b372f830cf0' and content_blocks #>> '{2,diagram,rungs,2,label}' = $t$LAN$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,rungs,3,full}', to_jsonb($t$Personal Area Network$t$::text))
  where id = '902633fc-24ba-451e-b8fc-2b372f830cf0' and content_blocks #>> '{2,diagram,rungs,3,label}' = $t$PAN$t$;

-- Domain 2 Recap: Networking
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$TCP: Transmission Control Protocol · UDP: User Datagram Protocol$t$::text))
  where id = 'a63006dc-7cd1-4dd5-8fd3-487aab6d22c7' and content_blocks #>> '{1,terms,0,term}' = $t$TCP / UDP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$IMAP: Internet Message Access Protocol · POP3: Post Office Protocol Version 3$t$::text))
  where id = 'a63006dc-7cd1-4dd5-8fd3-487aab6d22c7' and content_blocks #>> '{1,terms,2,term}' = $t$IMAP / POP3$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$WPA3: Wi-Fi Protected Access 3 · WEP: Wired Equivalent Privacy$t$::text))
  where id = 'a63006dc-7cd1-4dd5-8fd3-487aab6d22c7' and content_blocks #>> '{2,terms,1,term}' = $t$WPA3 / WEP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$NAT: Network Address Translation · VLAN: Virtual Local Area Network$t$::text))
  where id = 'a63006dc-7cd1-4dd5-8fd3-487aab6d22c7' and content_blocks #>> '{2,terms,3,term}' = $t$NAT / VLAN$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,4,full}', to_jsonb($t$SOHO: Small Office/Home Office$t$::text))
  where id = 'a63006dc-7cd1-4dd5-8fd3-487aab6d22c7' and content_blocks #>> '{2,terms,4,term}' = $t$SOHO first step$t$;

-- Mobile Device Network Connectivity
update lessons set content_blocks = jsonb_set(content_blocks, '{1,columnsFull}', $t$["SIM: Subscriber Identity Module", null]$t$::jsonb)
  where id = 'b49d321b-b6a0-4711-8ff9-a02c6d8ccd28' and content_blocks #> '{1,columns}' = $t$["Physical SIM", "eSIM"]$t$::jsonb;

-- Storage Devices
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,0,full}', to_jsonb($t$Hard Disk Drive$t$::text))
  where id = 'b7559fc1-f139-45ed-8fda-9c1ab62614bb' and content_blocks #>> '{1,rows,0,label}' = $t$HDD$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,1,full}', to_jsonb($t$SATA: Serial ATA · SSD: Solid-State Drive$t$::text))
  where id = 'b7559fc1-f139-45ed-8fda-9c1ab62614bb' and content_blocks #>> '{1,rows,1,label}' = $t$SATA SSD (2.5-inch)$t$;

-- TCP vs. UDP and Common Ports/Protocols (Web, Email, File Transfer)
update lessons set content_blocks = jsonb_set(content_blocks, '{1,columnsFull}', $t$["Transmission Control Protocol", "User Datagram Protocol"]$t$::jsonb)
  where id = 'bde5e5c8-e4e2-4b70-9409-7ffd120a279d' and content_blocks #> '{1,columns}' = $t$["TCP", "UDP"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,steps,0,full}', to_jsonb($t$Synchronize$t$::text))
  where id = 'bde5e5c8-e4e2-4b70-9409-7ffd120a279d' and content_blocks #>> '{2,diagram,steps,0,label}' = $t$SYN$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,steps,2,full}', to_jsonb($t$Acknowledge$t$::text))
  where id = 'bde5e5c8-e4e2-4b70-9409-7ffd120a279d' and content_blocks #>> '{2,diagram,steps,2,label}' = $t$ACK$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,0,full}', to_jsonb($t$Hypertext Transfer Protocol$t$::text))
  where id = 'bde5e5c8-e4e2-4b70-9409-7ffd120a279d' and content_blocks #>> '{3,rows,0,label}' = $t$HTTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,1,full}', to_jsonb($t$HTTP Secure$t$::text))
  where id = 'bde5e5c8-e4e2-4b70-9409-7ffd120a279d' and content_blocks #>> '{3,rows,1,label}' = $t$HTTPS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,2,full}', to_jsonb($t$File Transfer Protocol$t$::text))
  where id = 'bde5e5c8-e4e2-4b70-9409-7ffd120a279d' and content_blocks #>> '{3,rows,2,label}' = $t$FTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,3,full}', to_jsonb($t$SSH File Transfer Protocol$t$::text))
  where id = 'bde5e5c8-e4e2-4b70-9409-7ffd120a279d' and content_blocks #>> '{3,rows,3,label}' = $t$SFTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,4,full}', to_jsonb($t$Simple Mail Transfer Protocol$t$::text))
  where id = 'bde5e5c8-e4e2-4b70-9409-7ffd120a279d' and content_blocks #>> '{3,rows,4,label}' = $t$SMTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,5,full}', to_jsonb($t$Post Office Protocol Version 3$t$::text))
  where id = 'bde5e5c8-e4e2-4b70-9409-7ffd120a279d' and content_blocks #>> '{3,rows,5,label}' = $t$POP3$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,6,full}', to_jsonb($t$Internet Message Access Protocol$t$::text))
  where id = 'bde5e5c8-e4e2-4b70-9409-7ffd120a279d' and content_blocks #>> '{3,rows,6,label}' = $t$IMAP$t$;

-- Troubleshooting Wired Network Issues
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,steps,1,full}', to_jsonb($t$IP: Internet Protocol$t$::text))
  where id = 'c1ab1486-8281-4901-b3c7-8842fd3a98cf' and content_blocks #>> '{1,diagram,steps,1,label}' = $t$IP configuration$t$;

-- Services Provided by Networked Hosts
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,3,full}', to_jsonb($t$DHCP: Dynamic Host Configuration Protocol$t$::text))
  where id = 'c3b77b45-b8bd-41eb-bab6-f67815002bb4' and content_blocks #>> '{1,rows,3,label}' = $t$DHCP server$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,4,full}', to_jsonb($t$DNS: Domain Name System$t$::text))
  where id = 'c3b77b45-b8bd-41eb-bab6-f67815002bb4' and content_blocks #>> '{1,rows,4,label}' = $t$DNS server$t$;

-- Domain 3 Recap: Hardware
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$OLED: Organic Light-Emitting Diode$t$::text))
  where id = 'c76c8ced-12d9-45d2-b88c-fd911f797e27' and content_blocks #>> '{1,terms,0,term}' = $t$OLED / Mini LED$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$IPS: Intrusion Prevention System · TN: Twisted Nematic · VA: Vertical Alignment$t$::text))
  where id = 'c76c8ced-12d9-45d2-b88c-fd911f797e27' and content_blocks #>> '{1,terms,1,term}' = $t$IPS / TN / VA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$SATA: Serial ATA$t$::text))
  where id = 'c76c8ced-12d9-45d2-b88c-fd911f797e27' and content_blocks #>> '{1,terms,2,term}' = $t$SATA data / power$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,4,full}', to_jsonb($t$DDR3: Double Data Rate 3$t$::text))
  where id = 'c76c8ced-12d9-45d2-b88c-fd911f797e27' and content_blocks #>> '{1,terms,4,term}' = $t$DDR3, 4, 5$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,5,full}', to_jsonb($t$Elliptic Curve Cryptography$t$::text))
  where id = 'c76c8ced-12d9-45d2-b88c-fd911f797e27' and content_blocks #>> '{1,terms,5,term}' = $t$ECC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$SATA: Serial ATA$t$::text))
  where id = 'c76c8ced-12d9-45d2-b88c-fd911f797e27' and content_blocks #>> '{2,terms,0,term}' = $t$M.2 NVMe / M.2 SATA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$ATX: Advanced Technology eXtended$t$::text))
  where id = 'c76c8ced-12d9-45d2-b88c-fd911f797e27' and content_blocks #>> '{2,terms,1,term}' = $t$ATX, Micro-ATX, Mini-ITX$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$BIOS: Basic Input/Output System$t$::text))
  where id = 'c76c8ced-12d9-45d2-b88c-fd911f797e27' and content_blocks #>> '{2,terms,2,term}' = $t$Socket plus BIOS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,4,full}', to_jsonb($t$Power Supply Unit$t$::text))
  where id = 'c76c8ced-12d9-45d2-b88c-fd911f797e27' and content_blocks #>> '{2,terms,4,term}' = $t$PSU$t$;

-- Installing and Configuring the Appropriate Power Supply
update lessons set content_blocks = jsonb_set(content_blocks, '{1,full}', to_jsonb($t$PSU: Power Supply Unit$t$::text))
  where id = 'd1bc2668-7dca-41ab-b43a-faaecd811fc3' and content_blocks #>> '{1,term}' = $t$Sizing a PSU$t$;

-- Mobile Accessories and Connectivity Options
update lessons set content_blocks = jsonb_set(content_blocks, '{1,columnsFull}', $t$["Near-Field Communication", null]$t$::jsonb)
  where id = 'dd81de2a-eaff-42cc-a716-4c530d4a6f79' and content_blocks #> '{1,columns}' = $t$["NFC", "Bluetooth"]$t$::jsonb;

-- Mobile Application Support and Mobile Device Management
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$Bring Your Own Device$t$::text))
  where id = 'e318812d-8f6b-4a45-8b40-3a8f4b73239c' and content_blocks #>> '{2,terms,2,term}' = $t$BYOD$t$;

-- Motherboards, CPUs, and Add-On Cards (Part 1: Form Factors and Sockets)
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,rungs,0,full}', to_jsonb($t$Advanced Technology eXtended$t$::text))
  where id = 'eb072f9e-8b88-4ed0-ad0a-6ebbb6fe4d45' and content_blocks #>> '{1,diagram,rungs,0,label}' = $t$ATX$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,full}', to_jsonb($t$CPU: Central Processing Unit$t$::text))
  where id = 'eb072f9e-8b88-4ed0-ad0a-6ebbb6fe4d45' and content_blocks #>> '{3,term}' = $t$CPU socket$t$;

-- Motherboards, CPUs, and Add-On Cards (Part 2: Expansion Cards and CPU Features)
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$Graphics Processing Unit$t$::text))
  where id = 'ecbaf0bb-b174-4119-b701-fe4e00226218' and content_blocks #>> '{2,terms,0,term}' = $t$GPU$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$Network Interface Card$t$::text))
  where id = 'ecbaf0bb-b174-4119-b701-fe4e00226218' and content_blocks #>> '{2,terms,3,term}' = $t$NIC$t$;

-- Domain 1 Recap: Mobile Devices
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$SATA: Serial ATA$t$::text))
  where id = 'ee45e0cf-8a17-4070-9aa8-658c1efb92d9' and content_blocks #>> '{1,terms,1,term}' = $t$M.2 NVMe / 2.5-inch SATA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$Field-Replaceable Unit$t$::text))
  where id = 'ee45e0cf-8a17-4070-9aa8-658c1efb92d9' and content_blocks #>> '{1,terms,2,term}' = $t$FRU$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$NFC: Near-Field Communication$t$::text))
  where id = 'ee45e0cf-8a17-4070-9aa8-658c1efb92d9' and content_blocks #>> '{2,terms,0,term}' = $t$NFC / Bluetooth$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,4,full}', to_jsonb($t$Mobile Device Management$t$::text))
  where id = 'ee45e0cf-8a17-4070-9aa8-658c1efb92d9' and content_blocks #>> '{2,terms,4,term}' = $t$MDM$t$;

-- Laptop Hardware Components and Replacement Techniques
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$SATA: Serial ATA$t$::text))
  where id = 'ff4df31d-6611-40da-abe0-f22cd8e44665' and content_blocks #>> '{1,terms,2,term}' = $t$2.5-inch SATA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$Field-Replaceable Unit$t$::text))
  where id = 'ff4df31d-6611-40da-abe0-f22cd8e44665' and content_blocks #>> '{1,terms,3,term}' = $t$FRU$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,full}', to_jsonb($t$ESD: Electrostatic Discharge$t$::text))
  where id = 'ff4df31d-6611-40da-abe0-f22cd8e44665' and content_blocks #>> '{3,term}' = $t$ESD precautions$t$;

-- ---------------- a-plus-core-2 ----------------

-- Prohibited Content, Privacy, Licensing, and Policy Concepts
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,4,full}', to_jsonb($t$End-User License Agreement$t$::text))
  where id = '0d91bdc7-7e44-4569-99e3-090097c1b3d3' and content_blocks #>> '{3,rows,4,label}' = $t$EULA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,rows,0,full}', to_jsonb($t$Personally Identifiable Information$t$::text))
  where id = '0d91bdc7-7e44-4569-99e3-090097c1b3d3' and content_blocks #>> '{4,rows,0,label}' = $t$PII$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,rows,1,full}', to_jsonb($t$Protected Health Information$t$::text))
  where id = '0d91bdc7-7e44-4569-99e3-090097c1b3d3' and content_blocks #>> '{4,rows,1,label}' = $t$PHI$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,rows,2,full}', to_jsonb($t$PCI: Payment Card Industry$t$::text))
  where id = '0d91bdc7-7e44-4569-99e3-090097c1b3d3' and content_blocks #>> '{4,rows,2,label}' = $t$PCI data$t$;

-- Configuring Browser Security Settings
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,1,full}', to_jsonb($t$ISP: Internet Service Provider$t$::text))
  where id = '11cdd6bb-acd7-4d28-842c-d095db4a5655' and content_blocks #>> '{2,rows,1,label}' = $t$Network, ISP, websites$t$;

-- Windows OS Security Settings
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$User Account Control$t$::text))
  where id = '3304a191-b275-4ca3-890f-dca60bb7121f' and content_blocks #>> '{1,terms,3,term}' = $t$UAC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["New Technology File System", null]$t$::jsonb)
  where id = '3304a191-b275-4ca3-890f-dca60bb7121f' and content_blocks #> '{2,columns}' = $t$["NTFS", "Share"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,columnsFull}', $t$[null, "Encrypting File System"]$t$::jsonb)
  where id = '3304a191-b275-4ca3-890f-dca60bb7121f' and content_blocks #> '{4,columns}' = $t$["BitLocker", "EFS"]$t$::jsonb;

-- Configuring Windows Networking Features
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$VPN: Virtual Private Network$t$::text))
  where id = '419442e3-deb4-48bd-b15c-bc3db9bc8a57' and content_blocks #>> '{2,terms,2,term}' = $t$Built-in VPN client$t$;

-- Securing Mobile Devices
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$Mobile Device Management$t$::text))
  where id = '58af8634-941b-4253-81b7-792e2113716f' and content_blocks #>> '{2,term}' = $t$MDM$t$;

-- Troubleshooting Windows OS Issues Part 1 (Boot and Startup)
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,0,full}', to_jsonb($t$BSOD: Blue Screen of Death$t$::text))
  where id = '5c8e3735-f680-4389-89d3-0fe549a0fc26' and content_blocks #>> '{1,rows,0,label}' = $t$Blue screen (BSOD)$t$;

-- Domain 2 Recap: Security
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$Multifactor Authentication$t$::text))
  where id = '70b18ff7-f72b-471d-8e9a-520bf5727a51' and content_blocks #>> '{1,terms,1,term}' = $t$MFA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$NTFS: New Technology File System$t$::text))
  where id = '70b18ff7-f72b-471d-8e9a-520bf5727a51' and content_blocks #>> '{1,terms,2,term}' = $t$NTFS plus share$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$EFS: Encrypting File System$t$::text))
  where id = '70b18ff7-f72b-471d-8e9a-520bf5727a51' and content_blocks #>> '{1,terms,3,term}' = $t$BitLocker / EFS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,5,full}', to_jsonb($t$FIDO2: Fast Identity Online 2 · TOTP: Time-Based One-Time Password · SAML: Security Assertion Markup Language$t$::text))
  where id = '70b18ff7-f72b-471d-8e9a-520bf5727a51' and content_blocks #>> '{1,terms,5,term}' = $t$FIDO2 / TOTP / SAML$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$EDR: Endpoint Detection and Response · XDR: Extended Detection and Response · MDR: Managed Detection and Response$t$::text))
  where id = '70b18ff7-f72b-471d-8e9a-520bf5727a51' and content_blocks #>> '{3,terms,0,term}' = $t$EDR / XDR / MDR$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$SOHO: Small Office/Home Office$t$::text))
  where id = '70b18ff7-f72b-471d-8e9a-520bf5727a51' and content_blocks #>> '{3,terms,3,term}' = $t$SOHO first step$t$;

-- Domain 3 Recap: Software Troubleshooting
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$AV: Antivirus$t$::text))
  where id = '825125de-8ab0-431a-9b92-3b1eb4320704' and content_blocks #>> '{3,terms,0,term}' = $t$AV disabled itself$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$Potentially Unwanted Program$t$::text))
  where id = '825125de-8ab0-431a-9b92-3b1eb4320704' and content_blocks #>> '{3,terms,1,term}' = $t$PUP$t$;

-- Remote Access Technologies
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,0,full}', to_jsonb($t$Remote Desktop Protocol$t$::text))
  where id = '96aada23-e9ae-486e-9904-d283f47b5b56' and content_blocks #>> '{1,rows,0,label}' = $t$RDP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,1,full}', to_jsonb($t$Virtual Network Computing$t$::text))
  where id = '96aada23-e9ae-486e-9904-d283f47b5b56' and content_blocks #>> '{1,rows,1,label}' = $t$VNC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,2,full}', to_jsonb($t$Secure Shell$t$::text))
  where id = '96aada23-e9ae-486e-9904-d283f47b5b56' and content_blocks #>> '{1,rows,2,label}' = $t$SSH$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,3,full}', to_jsonb($t$Virtual Private Network$t$::text))
  where id = '96aada23-e9ae-486e-9904-d283f47b5b56' and content_blocks #>> '{1,rows,3,label}' = $t$VPN$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$Remote Monitoring and Management$t$::text))
  where id = '96aada23-e9ae-486e-9904-d283f47b5b56' and content_blocks #>> '{2,term}' = $t$RMM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$RDP: Remote Desktop Protocol$t$::text))
  where id = '96aada23-e9ae-486e-9904-d283f47b5b56' and content_blocks #>> '{3,terms,3,term}' = $t$Never expose RDP directly$t$;

-- Windows OS Features and Tools
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,9,full}', to_jsonb($t$Microsoft Management Console$t$::text))
  where id = '985e3838-d481-45cb-b282-2c3d4301fcc6' and content_blocks #>> '{1,rows,9,label}' = $t$MMC$t$;

-- Troubleshooting Windows OS Issues Part 2 (Performance and Resources)
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,0,full}', to_jsonb($t$CPU: Central Processing Unit$t$::text))
  where id = 'a40b3270-2b32-4ae2-92ef-5d3bb2e9e54e' and content_blocks #>> '{1,rows,0,label}' = $t$High CPU$t$;

-- Common OS Types and Purposes
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,0,full}', to_jsonb($t$New Technology File System$t$::text))
  where id = 'b22ec324-3e33-48ab-9a9c-e3da43d68785' and content_blocks #>> '{2,rows,0,label}' = $t$NTFS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,2,full}', to_jsonb($t$Resilient File System$t$::text))
  where id = 'b22ec324-3e33-48ab-9a9c-e3da43d68785' and content_blocks #>> '{2,rows,2,label}' = $t$ReFS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,3,full}', to_jsonb($t$Apple File System$t$::text))
  where id = 'b22ec324-3e33-48ab-9a9c-e3da43d68785' and content_blocks #>> '{2,rows,3,label}' = $t$APFS$t$;

-- Documentation, Ticketing, and Change Management Procedures
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,2,full}', to_jsonb($t$Standard Operating Procedure$t$::text))
  where id = 'b710b00a-5238-4416-b90b-9d0d61df5af9' and content_blocks #>> '{3,terms,2,term}' = $t$SOP$t$;

-- Malware Types and Detection, Removal, and Prevention
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,2,full}', to_jsonb($t$Endpoint Detection and Response$t$::text))
  where id = 'bed3d0f1-c8c0-4ae7-bd58-8d0affe8b480' and content_blocks #>> '{3,terms,2,term}' = $t$EDR$t$;

-- Wireless Security Protocols and Authentication Methods
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,rungs,0,full}', to_jsonb($t$Wi-Fi Protected Access 3$t$::text))
  where id = 'c2b2f7b3-93b4-48c9-bbe7-776300b5e75b' and content_blocks #>> '{1,diagram,rungs,0,label}' = $t$WPA3$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,rungs,1,full}', to_jsonb($t$Wi-Fi Protected Access 2$t$::text))
  where id = 'c2b2f7b3-93b4-48c9-bbe7-776300b5e75b' and content_blocks #>> '{1,diagram,rungs,1,label}' = $t$WPA2$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,rungs,2,full}', to_jsonb($t$Wi-Fi Protected Access$t$::text))
  where id = 'c2b2f7b3-93b4-48c9-bbe7-776300b5e75b' and content_blocks #>> '{1,diagram,rungs,2,label}' = $t$WPA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,rungs,3,full}', to_jsonb($t$Wired Equivalent Privacy$t$::text))
  where id = 'c2b2f7b3-93b4-48c9-bbe7-776300b5e75b' and content_blocks #>> '{1,diagram,rungs,3,label}' = $t$WEP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["PSK: Pre-Shared Key", null]$t$::jsonb)
  where id = 'c2b2f7b3-93b4-48c9-bbe7-776300b5e75b' and content_blocks #> '{2,columns}' = $t$["Personal (PSK)", "Enterprise (802.1X / RADIUS)"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,0,full}', to_jsonb($t$Fast Identity Online 2$t$::text))
  where id = 'c2b2f7b3-93b4-48c9-bbe7-776300b5e75b' and content_blocks #>> '{3,rows,0,label}' = $t$FIDO2$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,1,full}', to_jsonb($t$Time-Based One-Time Password$t$::text))
  where id = 'c2b2f7b3-93b4-48c9-bbe7-776300b5e75b' and content_blocks #>> '{3,rows,1,label}' = $t$TOTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,2,full}', to_jsonb($t$Security Assertion Markup Language$t$::text))
  where id = 'c2b2f7b3-93b4-48c9-bbe7-776300b5e75b' and content_blocks #>> '{3,rows,2,label}' = $t$SAML$t$;

-- Safety Procedures and Environmental Impacts
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$ESD: Electrostatic Discharge$t$::text))
  where id = 'cf4d0458-5e6c-4acb-a898-5b490835acff' and content_blocks #>> '{1,terms,0,term}' = $t$ESD prevention$t$;

-- A Study Strategy That Works
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$OS: Operating System$t$::text))
  where id = 'd00de1b7-7973-4642-af82-f127492b3b96' and content_blocks #>> '{2,terms,0,term}' = $t$Repeat OS and Security most$t$;

-- Securing SOHO Wireless and Wired Networks
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,rungs,3,full}', to_jsonb($t$WPS: Wi-Fi Protected Setup$t$::text))
  where id = 'd83bf299-b4bc-4f54-ab2f-fc741a27280f' and content_blocks #>> '{1,diagram,rungs,3,label}' = $t$Disable WPS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,rungs,7,full}', to_jsonb($t$MAC: Media Access Control$t$::text))
  where id = 'd83bf299-b4bc-4f54-ab2f-fc741a27280f' and content_blocks #>> '{1,diagram,rungs,7,label}' = $t$MAC filtering$t$;

-- Workstation Security Options and Hardening
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["Endpoint Detection and Response", "Extended Detection and Response", "Managed Detection and Response"]$t$::jsonb)
  where id = 'e61423e7-648b-4112-9f6d-44947c274b25' and content_blocks #> '{2,columns}' = $t$["EDR", "XDR", "MDR"]$t$::jsonb;

-- Domain 1 Recap: Operating Systems
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$GPT: GUID Partition Table · UEFI: Unified Extensible Firmware Interface$t$::text))
  where id = 'e79c45c0-b491-4e05-a4da-b401d99f7e58' and content_blocks #>> '{1,terms,2,term}' = $t$GPT + UEFI$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$PXE: Preboot Execution Environment$t$::text))
  where id = 'e79c45c0-b491-4e05-a4da-b401d99f7e58' and content_blocks #>> '{1,terms,3,term}' = $t$PXE / zero-touch$t$;

-- Domain 4 Recap: Operational Procedures
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$Safety Data Sheet$t$::text))
  where id = 'f004a94e-5d76-4a4d-8fb1-af3fca7ae3f7' and content_blocks #>> '{2,terms,1,term}' = $t$SDS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$PII: Personally Identifiable Information · PHI: Protected Health Information · PCI: Payment Card Industry$t$::text))
  where id = 'f004a94e-5d76-4a4d-8fb1-af3fca7ae3f7' and content_blocks #>> '{2,terms,3,term}' = $t$PII / PHI / PCI$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$Remote Desktop Protocol$t$::text))
  where id = 'f004a94e-5d76-4a4d-8fb1-af3fca7ae3f7' and content_blocks #>> '{3,terms,1,term}' = $t$RDP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,2,full}', to_jsonb($t$VNC: Virtual Network Computing · SSH: Secure Shell · RMM: Remote Monitoring and Management$t$::text))
  where id = 'f004a94e-5d76-4a4d-8fb1-af3fca7ae3f7' and content_blocks #>> '{3,terms,2,term}' = $t$VNC / SSH / RMM$t$;

-- OS Installations and Upgrades in a Diverse Environment
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$Preboot Execution Environment$t$::text))
  where id = 'f485e1a2-b46b-475e-ab20-a5b41454b1b6' and content_blocks #>> '{2,terms,3,term}' = $t$PXE$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,columnsFull}', $t$["GPT: GUID Partition Table · UEFI: Unified Extensible Firmware Interface", "MBR: Master Boot Record · BIOS: Basic Input/Output System"]$t$::jsonb)
  where id = 'f485e1a2-b46b-475e-ab20-a5b41454b1b6' and content_blocks #> '{3,columns}' = $t$["GPT + UEFI", "MBR + BIOS"]$t$::jsonb;

-- ---------------- cissp ----------------

-- Development Methodologies: Waterfall, Agile, DevOps, and DevSecOps
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$CI: Continuous Integration · CD: Continuous Delivery$t$::text))
  where id = '0f722383-1d7b-458f-9132-dd9455f1080b' and content_blocks #>> '{3,terms,1,term}' = $t$CI / CD$t$;

-- Business Continuity Planning
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,after,0,full}', to_jsonb($t$Recovery Time Objective$t$::text))
  where id = '12f82476-c2b0-48b1-82f9-05f7f570b86c' and content_blocks #>> '{2,diagram,after,0,label}' = $t$RTO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,after,1,full}', to_jsonb($t$Work Recovery Time$t$::text))
  where id = '12f82476-c2b0-48b1-82f9-05f7f570b86c' and content_blocks #>> '{2,diagram,after,1,label}' = $t$WRT$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,before,full}', to_jsonb($t$Recovery Point Objective$t$::text))
  where id = '12f82476-c2b0-48b1-82f9-05f7f570b86c' and content_blocks #>> '{2,diagram,before,label}' = $t$RPO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,total,full}', to_jsonb($t$Maximum Tolerable Downtime$t$::text))
  where id = '12f82476-c2b0-48b1-82f9-05f7f570b86c' and content_blocks #>> '{2,diagram,total,label}' = $t$MTD$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,columnsFull}', $t$["Recovery Time Objective", "Recovery Point Objective"]$t$::jsonb)
  where id = '12f82476-c2b0-48b1-82f9-05f7f570b86c' and content_blocks #> '{3,columns}' = $t$["RTO", "RPO"]$t$::jsonb;

-- Public Key Infrastructure (PKI) and Key Management
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,rungs,0,full}', to_jsonb($t$CA: Certificate Authority$t$::text))
  where id = '14db0970-1727-4ae8-82a7-976020c611ed' and content_blocks #>> '{3,diagram,rungs,0,label}' = $t$Root CA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,columnsFull}', $t$["Certificate Revocation List", "Online Certificate Status Protocol"]$t$::jsonb)
  where id = '14db0970-1727-4ae8-82a7-976020c611ed' and content_blocks #> '{4,columns}' = $t$["CRL", "OCSP"]$t$::jsonb;

-- Domain 2 Recap: Asset Security
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$DLP: Data Loss Prevention · CASB: Cloud Access Security Broker · DRM: Digital Rights Management$t$::text))
  where id = '1727630c-595f-43e5-ab98-4eab59465f09' and content_blocks #>> '{2,terms,2,term}' = $t$DLP / CASB / DRM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,1,full}', to_jsonb($t$EOL: End of Life · EOS: End of Support$t$::text))
  where id = '1727630c-595f-43e5-ab98-4eab59465f09' and content_blocks #>> '{4,terms,1,term}' = $t$EOL vs. EOS$t$;

-- Software Capability Maturity Models: CMMI, SAMM, and BSIMM
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["OWASP: Open Worldwide Application Security Project · SAMM: Software Assurance Maturity Model", "Building Security In Maturity Model"]$t$::jsonb)
  where id = '18827c83-bb43-4de9-a588-8905bcf08498' and content_blocks #> '{2,columns}' = $t$["OWASP SAMM", "BSIMM"]$t$::jsonb;

-- Common Source-Code Vulnerabilities and the OWASP Top 10
update lessons set content_blocks = jsonb_set(content_blocks, '{1,full}', to_jsonb($t$OWASP: Open Worldwide Application Security Project$t$::text))
  where id = '1941fba5-7552-4f08-8630-2caa9ca37b69' and content_blocks #>> '{1,term}' = $t$OWASP Top 10$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,full}', to_jsonb($t$SQL: Structured Query Language$t$::text))
  where id = '1941fba5-7552-4f08-8630-2caa9ca37b69' and content_blocks #>> '{3,term}' = $t$SQL injection$t$;

-- Domain 8 Recap: Software Development Security
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$Software Development Life Cycle$t$::text))
  where id = '1d7cbc70-3d4a-4ddc-ba10-dea54fddebc6' and content_blocks #>> '{1,terms,0,term}' = $t$SDLC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,4,full}', to_jsonb($t$CMMI: Capability Maturity Model Integration · SAMM: Software Assurance Maturity Model · BSIMM: Building Security In Maturity Model$t$::text))
  where id = '1d7cbc70-3d4a-4ddc-ba10-dea54fddebc6' and content_blocks #>> '{1,terms,4,term}' = $t$CMMI / SAMM / BSIMM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$SBOM: Software Bill of Materials$t$::text))
  where id = '1d7cbc70-3d4a-4ddc-ba10-dea54fddebc6' and content_blocks #>> '{2,terms,2,term}' = $t$Transitive dependencies and SBOM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$API: Application Programming Interface$t$::text))
  where id = '1d7cbc70-3d4a-4ddc-ba10-dea54fddebc6' and content_blocks #>> '{3,terms,0,term}' = $t$API security$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$XSS: Cross-Site Scripting$t$::text))
  where id = '1d7cbc70-3d4a-4ddc-ba10-dea54fddebc6' and content_blocks #>> '{3,terms,1,term}' = $t$Injection / XSS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$TOCTOU: Time-of-Check to Time-of-Use$t$::text))
  where id = '1d7cbc70-3d4a-4ddc-ba10-dea54fddebc6' and content_blocks #>> '{3,terms,3,term}' = $t$Buffer overflow / TOCTOU$t$;

-- API Security and Secure Integration
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$API: Application Programming Interface$t$::text))
  where id = '2b2457ba-3248-4805-967c-b99309600850' and content_blocks #>> '{2,terms,2,term}' = $t$API gateway$t$;

-- Domain 1 Recap: Security and Risk Management
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$CIA: Confidentiality, Integrity and Availability$t$::text))
  where id = '2d143320-7fe6-40b8-90f0-b4b0cb50a75d' and content_blocks #>> '{1,terms,0,term}' = $t$CIA triad$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,4,full}', to_jsonb($t$Annualized Loss Expectancy$t$::text))
  where id = '2d143320-7fe6-40b8-90f0-b4b0cb50a75d' and content_blocks #>> '{1,terms,4,term}' = $t$ALE$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$Intellectual Property$t$::text))
  where id = '2d143320-7fe6-40b8-90f0-b4b0cb50a75d' and content_blocks #>> '{2,terms,2,term}' = $t$IP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,after,0,full}', to_jsonb($t$Recovery Time Objective$t$::text))
  where id = '2d143320-7fe6-40b8-90f0-b4b0cb50a75d' and content_blocks #>> '{3,diagram,after,0,label}' = $t$RTO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,after,1,full}', to_jsonb($t$Work Recovery Time$t$::text))
  where id = '2d143320-7fe6-40b8-90f0-b4b0cb50a75d' and content_blocks #>> '{3,diagram,after,1,label}' = $t$WRT$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,before,full}', to_jsonb($t$Recovery Point Objective$t$::text))
  where id = '2d143320-7fe6-40b8-90f0-b4b0cb50a75d' and content_blocks #>> '{3,diagram,before,label}' = $t$RPO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,total,full}', to_jsonb($t$Maximum Tolerable Downtime$t$::text))
  where id = '2d143320-7fe6-40b8-90f0-b4b0cb50a75d' and content_blocks #>> '{3,diagram,total,label}' = $t$MTD$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,2,full}', to_jsonb($t$Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service and Elevation of Privilege$t$::text))
  where id = '2d143320-7fe6-40b8-90f0-b4b0cb50a75d' and content_blocks #>> '{4,terms,2,term}' = $t$STRIDE$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,3,full}', to_jsonb($t$DREAD: Damage, Reproducibility, Exploitability, Affected Users and Discoverability · PASTA: Process for Attack Simulation and Threat Analysis$t$::text))
  where id = '2d143320-7fe6-40b8-90f0-b4b0cb50a75d' and content_blocks #>> '{4,terms,3,term}' = $t$DREAD / PASTA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,4,full}', to_jsonb($t$Software Bill of Materials$t$::text))
  where id = '2d143320-7fe6-40b8-90f0-b4b0cb50a75d' and content_blocks #>> '{4,terms,4,term}' = $t$SBOM$t$;

-- Federated Identity Management and Single Sign-On
update lessons set content_blocks = jsonb_set(content_blocks, '{1,columnsFull}', $t$[null, "FIM: Federated Identity Management"]$t$::jsonb)
  where id = '2fddfdab-98dd-4f4a-9db2-5d47a11a3706' and content_blocks #> '{1,columns}' = $t$["Single sign-on (SSO)", "Federated identity (FIM)"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,columnsFull}', $t$["Security Assertion Markup Language", null, null]$t$::jsonb)
  where id = '2fddfdab-98dd-4f4a-9db2-5d47a11a3706' and content_blocks #> '{3,columns}' = $t$["SAML", "OAuth 2.0", "OpenID Connect"]$t$::jsonb;

-- Change Management
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,steps,1,full}', to_jsonb($t$CAB: Change Advisory Board$t$::text))
  where id = '305a45db-be41-4317-9f38-2906cf863c39' and content_blocks #>> '{2,diagram,steps,1,label}' = $t$CAB review$t$;

-- Cryptography Fundamentals: Symmetric, Asymmetric, and Hashing
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$ECB: Electronic Codebook$t$::text))
  where id = '391cce56-e835-45ac-a852-4b926eeca1d2' and content_blocks #>> '{2,terms,1,term}' = $t$ECB mode$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$CBC: Cipher Block Chaining$t$::text))
  where id = '391cce56-e835-45ac-a852-4b926eeca1d2' and content_blocks #>> '{2,terms,2,term}' = $t$CBC mode$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$GCM: Galois/Counter Mode$t$::text))
  where id = '391cce56-e835-45ac-a852-4b926eeca1d2' and content_blocks #>> '{2,terms,3,term}' = $t$GCM mode$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$Rivest-Shamir-Adleman$t$::text))
  where id = '391cce56-e835-45ac-a852-4b926eeca1d2' and content_blocks #>> '{3,terms,0,term}' = $t$RSA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$Elliptic Curve Cryptography$t$::text))
  where id = '391cce56-e835-45ac-a852-4b926eeca1d2' and content_blocks #>> '{3,terms,1,term}' = $t$ECC$t$;

-- Domain 5 Recap: Identity and Access Management
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$Identification, Authentication, Authorization and Accountability$t$::text))
  where id = '445e87ed-fc73-447e-ac52-06fa45bfee70' and content_blocks #>> '{1,terms,0,term}' = $t$IAAA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$Multifactor Authentication$t$::text))
  where id = '445e87ed-fc73-447e-ac52-06fa45bfee70' and content_blocks #>> '{1,terms,2,term}' = $t$MFA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$DAC: Discretionary Access Control · MAC: Mandatory Access Control · RBAC: Role-Based Access Control · ABAC: Attribute-Based Access Control$t$::text))
  where id = '445e87ed-fc73-447e-ac52-06fa45bfee70' and content_blocks #>> '{2,terms,0,term}' = $t$DAC / MAC / RBAC / ABAC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$RADIUS: Remote Authentication Dial-In User Service · TACACS: Terminal Access Controller Access-Control System$t$::text))
  where id = '445e87ed-fc73-447e-ac52-06fa45bfee70' and content_blocks #>> '{2,terms,2,term}' = $t$RADIUS / TACACS+$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$SAML: Security Assertion Markup Language · OIDC: OpenID Connect$t$::text))
  where id = '445e87ed-fc73-447e-ac52-06fa45bfee70' and content_blocks #>> '{3,terms,0,term}' = $t$SAML / OAuth / OIDC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$SCIM: System for Cross-Domain Identity Management · JIT: Just-in-Time$t$::text))
  where id = '445e87ed-fc73-447e-ac52-06fa45bfee70' and content_blocks #>> '{3,terms,1,term}' = $t$SCIM / JIT$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,5,full}', to_jsonb($t$Privileged Access Management$t$::text))
  where id = '445e87ed-fc73-447e-ac52-06fa45bfee70' and content_blocks #>> '{3,terms,5,term}' = $t$PAM$t$;

-- Patch and Vulnerability Management
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$Common Vulnerabilities and Exposures$t$::text))
  where id = '4794cf63-1a70-4a80-8100-e753936e9534' and content_blocks #>> '{2,terms,0,term}' = $t$CVE$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$Common Vulnerability Scoring System$t$::text))
  where id = '4794cf63-1a70-4a80-8100-e753936e9534' and content_blocks #>> '{2,terms,1,term}' = $t$CVSS$t$;

-- Domain 4 Recap: Communication and Network Security
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$OSI: Open Systems Interconnection$t$::text))
  where id = '4a95f104-26d6-4d58-a85d-03e1b1d1be3e' and content_blocks #>> '{1,terms,0,term}' = $t$OSI layers$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$Virtual Private Networks$t$::text))
  where id = '4a95f104-26d6-4d58-a85d-03e1b1d1be3e' and content_blocks #>> '{3,terms,3,term}' = $t$VPNs$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,4,full}', to_jsonb($t$Voice over Internet Protocol$t$::text))
  where id = '4a95f104-26d6-4d58-a85d-03e1b1d1be3e' and content_blocks #>> '{3,terms,4,term}' = $t$VoIP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,5,full}', to_jsonb($t$Software-Defined Networking$t$::text))
  where id = '4a95f104-26d6-4d58-a85d-03e1b1d1be3e' and content_blocks #>> '{3,terms,5,term}' = $t$SDN$t$;

-- Network Topologies, Transmission Media, and Cabling
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,1,full}', to_jsonb($t$EMI: Electromagnetic Interference$t$::text))
  where id = '55c76f07-6024-4a27-b36d-44c031522dd5' and content_blocks #>> '{3,rows,1,label}' = $t$Interference (EMI)$t$;

-- Domain 6 Recap: Security Assessment and Testing
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,5,full}', to_jsonb($t$BAS: Breach and Attack Simulation$t$::text))
  where id = '5b2fa997-59a2-4027-a002-c0920a9675f4' and content_blocks #>> '{1,terms,5,term}' = $t$Red / blue / purple / BAS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$SAST: Static Application Security Testing · DAST: Dynamic Application Security Testing · IAST: Interactive Application Security Testing$t$::text))
  where id = '5b2fa997-59a2-4027-a002-c0920a9675f4' and content_blocks #>> '{2,terms,3,term}' = $t$SAST / DAST / IAST$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$KPI: Key Performance Indicator · KRI: Key Risk Indicator$t$::text))
  where id = '5b2fa997-59a2-4027-a002-c0920a9675f4' and content_blocks #>> '{3,terms,0,term}' = $t$KPI / KRI$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,2,full}', to_jsonb($t$SOC: System and Organization Controls$t$::text))
  where id = '5b2fa997-59a2-4027-a002-c0920a9675f4' and content_blocks #>> '{3,terms,2,term}' = $t$SOC 2 Type I / II$t$;

-- Domain 7 Recap: Security Operations
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$Security Information and Event Management$t$::text))
  where id = '5da80eed-dffa-41dc-991b-72b56a2b9b8b' and content_blocks #>> '{2,terms,0,term}' = $t$SIEM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$UEBA: User and Entity Behavior Analytics$t$::text))
  where id = '5da80eed-dffa-41dc-991b-72b56a2b9b8b' and content_blocks #>> '{2,terms,1,term}' = $t$UEBA / clipping level$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$CMDB: Configuration Management Database$t$::text))
  where id = '5da80eed-dffa-41dc-991b-72b56a2b9b8b' and content_blocks #>> '{2,terms,2,term}' = $t$Baseline, drift, golden image, CMDB$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$IDS: Intrusion Detection System · IPS: Intrusion Prevention System$t$::text))
  where id = '5da80eed-dffa-41dc-991b-72b56a2b9b8b' and content_blocks #>> '{3,terms,1,term}' = $t$IDS / IPS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,2,full}', to_jsonb($t$DR: Disaster Recovery$t$::text))
  where id = '5da80eed-dffa-41dc-991b-72b56a2b9b8b' and content_blocks #>> '{4,terms,2,term}' = $t$DR tests$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,3,full}', to_jsonb($t$RTO: Recovery Time Objective · RPO: Recovery Point Objective · MTD: Maximum Tolerable Downtime$t$::text))
  where id = '5da80eed-dffa-41dc-991b-72b56a2b9b8b' and content_blocks #>> '{4,terms,3,term}' = $t$RTO / RPO / MTD$t$;

-- Security Process Data Collection
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,4,full}', to_jsonb($t$DR: Disaster Recovery · BC: Business Continuity$t$::text))
  where id = '60346678-1c3e-4127-970f-6a8d1b2d1fc6' and content_blocks #>> '{2,terms,4,term}' = $t$DR and BC test results$t$;

-- Recovery Strategies and System Resilience
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,2,full}', to_jsonb($t$Redundant Array of Independent Disks$t$::text))
  where id = '6104fb19-e077-456f-9c11-119b1aae29da' and content_blocks #>> '{4,terms,2,term}' = $t$RAID$t$;

-- Facility Security Controls
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$Heating, Ventilation and Air Conditioning$t$::text))
  where id = '6b4c407f-1567-4d60-b83c-614f5a72b847' and content_blocks #>> '{3,terms,0,term}' = $t$HVAC$t$;

-- Evaluation Criteria, Certification, and Accreditation
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$EAL: Evaluation Assurance Level$t$::text))
  where id = '6bc58f7f-aed3-4056-b4b6-e5b0a1923824' and content_blocks #>> '{3,terms,3,term}' = $t$EAL 1 to 7$t$;

-- Domain 3 Recap: Security Architecture and Engineering
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$Trusted Computer System Evaluation Criteria$t$::text))
  where id = '6d4813a1-6013-471c-a565-19cc02c0236c' and content_blocks #>> '{2,terms,0,term}' = $t$TCSEC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,4,full}', to_jsonb($t$TPM: Trusted Platform Module · HSM: Hardware Security Module · TEE: Trusted Execution Environment$t$::text))
  where id = '6d4813a1-6013-471c-a565-19cc02c0236c' and content_blocks #>> '{2,terms,4,term}' = $t$TPM / HSM / TEE$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$SCADA: Supervisory Control and Data Acquisition · ICS: Industrial Control Systems$t$::text))
  where id = '6d4813a1-6013-471c-a565-19cc02c0236c' and content_blocks #>> '{3,terms,3,term}' = $t$SCADA / ICS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{5,terms,0,full}', to_jsonb($t$RA: Registration Authority · CA: Certificate Authority$t$::text))
  where id = '6d4813a1-6013-471c-a565-19cc02c0236c' and content_blocks #>> '{5,terms,0,term}' = $t$RA / CA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{5,terms,3,full}', to_jsonb($t$Crime Prevention Through Environmental Design$t$::text))
  where id = '6d4813a1-6013-471c-a565-19cc02c0236c' and content_blocks #>> '{5,terms,3,term}' = $t$CPTED$t$;

-- Remote Access and VPN Technologies
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["VPN: Virtual Private Network", "SSL: Secure Sockets Layer · TLS: Transport Layer Security"]$t$::jsonb)
  where id = '70c50729-a54e-40df-81d4-02dfa33e8f81' and content_blocks #> '{2,columns}' = $t$["IPsec VPN", "SSL/TLS VPN"]$t$::jsonb;

-- Site and Facility Security Design
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$Crime Prevention Through Environmental Design$t$::text))
  where id = '7b344522-5652-4bb1-900f-bff93c746439' and content_blocks #>> '{2,term}' = $t$CPTED$t$;

-- Security Capabilities of Information Systems
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,2,full}', to_jsonb($t$Address Space Layout Randomization$t$::text))
  where id = '7be3253f-5b0d-4387-b718-73d27753311b' and content_blocks #>> '{3,terms,2,term}' = $t$ASLR$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$DEP: Data Execution Prevention · NX: No-Execute$t$::text))
  where id = '7be3253f-5b0d-4387-b718-73d27753311b' and content_blocks #>> '{3,terms,3,term}' = $t$DEP / NX bit$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,columnsFull}', $t$["Trusted Platform Module", "Hardware Security Module", null]$t$::jsonb)
  where id = '7be3253f-5b0d-4387-b718-73d27753311b' and content_blocks #> '{4,columns}' = $t$["TPM", "HSM", "TEE / secure enclave"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{5,diagram,steps,2,full}', to_jsonb($t$OS: Operating System$t$::text))
  where id = '7be3253f-5b0d-4387-b718-73d27753311b' and content_blocks #>> '{5,diagram,steps,2,label}' = $t$OS kernel$t$;

-- Detective and Preventive Security Controls
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$IDS: Intrusion Detection System · IPS: Intrusion Prevention System$t$::text))
  where id = '7edde4f5-36af-4fd9-a1ed-6e439e21cd3e' and content_blocks #>> '{1,terms,1,term}' = $t$IDS / IPS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["Intrusion Detection System", "Intrusion Prevention System"]$t$::jsonb)
  where id = '7edde4f5-36af-4fd9-a1ed-6e439e21cd3e' and content_blocks #> '{2,columns}' = $t$["IDS", "IPS"]$t$::jsonb;

-- IP Addressing and Subnetting
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,3,full}', to_jsonb($t$Network Address Translation$t$::text))
  where id = '82898f4e-6767-4371-9dd1-b957e71fc7fd' and content_blocks #>> '{1,rows,3,label}' = $t$NAT$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$IP: Internet Protocol · RFC: Request for Comments$t$::text))
  where id = '82898f4e-6767-4371-9dd1-b957e71fc7fd' and content_blocks #>> '{2,term}' = $t$Private IP ranges (RFC 1918)$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,columnsFull}', $t$["Network Address Translation", "Port Address Translation"]$t$::jsonb)
  where id = '82898f4e-6767-4371-9dd1-b957e71fc7fd' and content_blocks #> '{4,columns}' = $t$["NAT", "PAT"]$t$::jsonb;

-- Software-Defined Networks, Virtualization, and Cloud Connectivity
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$VPC: Virtual Private Cloud$t$::text))
  where id = '86a0a006-e36f-4615-a084-90e86d776b1b' and content_blocks #>> '{2,terms,2,term}' = $t$VPC / VNet peering$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,4,full}', to_jsonb($t$Content Delivery Network$t$::text))
  where id = '86a0a006-e36f-4615-a084-90e86d776b1b' and content_blocks #>> '{2,terms,4,term}' = $t$CDN$t$;

-- Software Supply Chain Risk and Software Composition
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$Software Bill of Materials$t$::text))
  where id = '8e3d8737-97cc-40a2-a582-be36546069da' and content_blocks #>> '{1,terms,2,term}' = $t$SBOM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,full}', to_jsonb($t$SBOM: Software Bill of Materials$t$::text))
  where id = '8e3d8737-97cc-40a2-a582-be36546069da' and content_blocks #>> '{4,term}' = $t$SBOM in action$t$;

-- Privileged Access Management (PAM)
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$Privileged Access Management$t$::text))
  where id = '8eaf04fe-084b-4590-88f5-e6cd2a768833' and content_blocks #>> '{1,terms,1,term}' = $t$PAM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,2,full}', to_jsonb($t$PAM: Privileged Access Management$t$::text))
  where id = '8eaf04fe-084b-4590-88f5-e6cd2a768833' and content_blocks #>> '{3,rows,2,label}' = $t$PAM's goal$t$;

-- Assessing Acquired Software: COTS, Open Source, and Cloud Services
update lessons set content_blocks = jsonb_set(content_blocks, '{1,columnsFull}', $t$["Commercial Off-the-Shelf", null]$t$::jsonb)
  where id = '927919a8-02df-44c3-850d-2c8463ceff54' and content_blocks #> '{1,columns}' = $t$["COTS", "Open source"]$t$::jsonb;

-- Logging and Monitoring
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$Security Information and Event Management$t$::text))
  where id = 'a9246639-6635-4521-bbd4-21da149383c2' and content_blocks #>> '{1,terms,0,term}' = $t$SIEM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,4,full}', to_jsonb($t$User and Entity Behavior Analytics$t$::text))
  where id = 'a9246639-6635-4521-bbd4-21da149383c2' and content_blocks #>> '{1,terms,4,term}' = $t$UEBA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$SIEM: Security Information and Event Management$t$::text))
  where id = 'a9246639-6635-4521-bbd4-21da149383c2' and content_blocks #>> '{2,term}' = $t$SIEM correlation$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,columnsFull}', $t$[null, "User and Entity Behavior Analytics"]$t$::jsonb)
  where id = 'a9246639-6635-4521-bbd4-21da149383c2' and content_blocks #> '{3,columns}' = $t$["Signature-based tools", "UEBA"]$t$::jsonb;

-- Identity Management and Directory Services
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$Lightweight Directory Access Protocol$t$::text))
  where id = 'b27b9de1-0c7a-45cd-8aaa-6d7b18420aeb' and content_blocks #>> '{1,terms,1,term}' = $t$LDAP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,steps,1,full}', to_jsonb($t$TGT: Ticket-Granting Ticket$t$::text))
  where id = 'b27b9de1-0c7a-45cd-8aaa-6d7b18420aeb' and content_blocks #>> '{2,diagram,steps,1,label}' = $t$Receive a TGT$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$KDC: Key Distribution Center$t$::text))
  where id = 'b27b9de1-0c7a-45cd-8aaa-6d7b18420aeb' and content_blocks #>> '{3,terms,0,term}' = $t$The KDC is a single point of failure$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,columnsFull}', $t$["Remote Authentication Dial-In User Service", "Terminal Access Controller Access-Control System"]$t$::jsonb)
  where id = 'b27b9de1-0c7a-45cd-8aaa-6d7b18420aeb' and content_blocks #> '{4,columns}' = $t$["RADIUS", "TACACS+"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,rows,2,full}', to_jsonb($t$AAA: Authentication, Authorization and Accounting$t$::text))
  where id = 'b27b9de1-0c7a-45cd-8aaa-6d7b18420aeb' and content_blocks #>> '{4,rows,2,label}' = $t$AAA functions$t$;

-- Identity as a Service (IDaaS) and Third-Party/Cloud Identity Integration
update lessons set content_blocks = jsonb_set(content_blocks, '{4,columnsFull}', $t$["System for Cross-Domain Identity Management", "JIT: Just-in-Time"]$t$::jsonb)
  where id = 'b3844d16-643c-4c25-9a89-88131ea018e1' and content_blocks #> '{4,columns}' = $t$["SCIM", "JIT provisioning"]$t$::jsonb;

-- Configuration Management
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,4,full}', to_jsonb($t$Configuration Management Database$t$::text))
  where id = 'b3b7bd96-756d-4350-9f43-a2d14a04ff51' and content_blocks #>> '{1,terms,4,term}' = $t$CMDB$t$;

-- Access Control Models: DAC, MAC, RBAC, and ABAC
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$DAC: Discretionary Access Control$t$::text))
  where id = 'b5a28839-a35b-49d8-bd9c-0a54359dad54' and content_blocks #>> '{1,terms,0,term}' = $t$DAC: discretionary$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$MAC: Mandatory Access Control$t$::text))
  where id = 'b5a28839-a35b-49d8-bd9c-0a54359dad54' and content_blocks #>> '{1,terms,1,term}' = $t$MAC: mandatory$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$RBAC: Role-Based Access Control$t$::text))
  where id = 'b5a28839-a35b-49d8-bd9c-0a54359dad54' and content_blocks #>> '{1,terms,2,term}' = $t$RBAC: role-based$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$ABAC: Attribute-Based Access Control$t$::text))
  where id = 'b5a28839-a35b-49d8-bd9c-0a54359dad54' and content_blocks #>> '{1,terms,3,term}' = $t$ABAC: attribute-based$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["Discretionary Access Control", "Mandatory Access Control", "Role-Based Access Control", "Attribute-Based Access Control"]$t$::jsonb)
  where id = 'b5a28839-a35b-49d8-bd9c-0a54359dad54' and content_blocks #> '{2,columns}' = $t$["DAC", "MAC", "RBAC", "ABAC"]$t$::jsonb;

-- Authentication Factors, Multi-Factor Authentication, and Biometrics
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,2,full}', to_jsonb($t$EER: Equal Error Rate$t$::text))
  where id = 'ba51a66a-11af-41ca-82c7-1500142d5cfa' and content_blocks #>> '{3,terms,2,term}' = $t$CER / EER: crossover error rate$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,rows,0,full}', to_jsonb($t$FAR: False Acceptance Rate$t$::text))
  where id = 'ba51a66a-11af-41ca-82c7-1500142d5cfa' and content_blocks #>> '{4,rows,0,label}' = $t$False acceptances (FAR)$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,rows,1,full}', to_jsonb($t$FRR: False Rejection Rate$t$::text))
  where id = 'ba51a66a-11af-41ca-82c7-1500142d5cfa' and content_blocks #>> '{4,rows,1,label}' = $t$False rejections (FRR)$t$;

-- Vulnerabilities in Embedded, IoT, Mobile, and Cyber-Physical Systems
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$[null, "SCADA: Supervisory Control and Data Acquisition · ICS: Industrial Control Systems"]$t$::jsonb)
  where id = 'c1e298b8-1ddb-4587-9ac3-f664acf440e7' and content_blocks #> '{2,columns}' = $t$["Enterprise IT", "SCADA / ICS"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,full}', to_jsonb($t$Supervisory Control and Data Acquisition$t$::text))
  where id = 'c1e298b8-1ddb-4587-9ac3-f664acf440e7' and content_blocks #>> '{3,term}' = $t$SCADA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{5,terms,3,full}', to_jsonb($t$Mobile Device Management$t$::text))
  where id = 'c1e298b8-1ddb-4587-9ac3-f664acf440e7' and content_blocks #>> '{5,terms,3,term}' = $t$MDM$t$;

-- Legal, Regulatory, and Compliance Issues
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,0,full}', to_jsonb($t$GDPR: General Data Protection Regulation$t$::text))
  where id = 'c288b889-3bc0-495b-8c88-eca196754299' and content_blocks #>> '{4,terms,0,term}' = $t$GDPR (EU)$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,1,full}', to_jsonb($t$HIPAA: Health Insurance Portability and Accountability Act$t$::text))
  where id = 'c288b889-3bc0-495b-8c88-eca196754299' and content_blocks #>> '{4,terms,1,term}' = $t$HIPAA (US)$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,2,full}', to_jsonb($t$GLBA: Gramm-Leach-Bliley Act$t$::text))
  where id = 'c288b889-3bc0-495b-8c88-eca196754299' and content_blocks #>> '{4,terms,2,term}' = $t$GLBA (US)$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,3,full}', to_jsonb($t$SOX: Sarbanes-Oxley Act$t$::text))
  where id = 'c288b889-3bc0-495b-8c88-eca196754299' and content_blocks #>> '{4,terms,3,term}' = $t$SOX (US)$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,4,full}', to_jsonb($t$FERPA: Family Educational Rights and Privacy Act$t$::text))
  where id = 'c288b889-3bc0-495b-8c88-eca196754299' and content_blocks #>> '{4,terms,4,term}' = $t$FERPA (US)$t$;

-- Data States and Security Controls
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$Data Loss Prevention$t$::text))
  where id = 'c5f65a31-59df-4755-9bfd-7dec16388401' and content_blocks #>> '{2,terms,0,term}' = $t$DLP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$Cloud Access Security Broker$t$::text))
  where id = 'c5f65a31-59df-4755-9bfd-7dec16388401' and content_blocks #>> '{2,terms,1,term}' = $t$CASB$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$Digital Rights Management$t$::text))
  where id = 'c5f65a31-59df-4755-9bfd-7dec16388401' and content_blocks #>> '{2,terms,2,term}' = $t$DRM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,columnsFull}', $t$["Data Loss Prevention", "Cloud Access Security Broker", "Digital Rights Management"]$t$::jsonb)
  where id = 'c5f65a31-59df-4755-9bfd-7dec16388401' and content_blocks #> '{3,columns}' = $t$["DLP", "CASB", "DRM"]$t$::jsonb;

-- Threat Modeling
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$Damage, Reproducibility, Exploitability, Affected Users and Discoverability$t$::text))
  where id = 'd39a4921-0bdb-4264-9560-31d2008e01fc' and content_blocks #>> '{3,terms,0,term}' = $t$DREAD$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$Process for Attack Simulation and Threat Analysis$t$::text))
  where id = 'd39a4921-0bdb-4264-9560-31d2008e01fc' and content_blocks #>> '{3,terms,1,term}' = $t$PASTA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,columnsFull}', $t$["Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service and Elevation of Privilege", "Damage, Reproducibility, Exploitability, Affected Users and Discoverability", "Process for Attack Simulation and Threat Analysis"]$t$::jsonb)
  where id = 'd39a4921-0bdb-4264-9560-31d2008e01fc' and content_blocks #> '{4,columns}' = $t$["STRIDE", "DREAD", "PASTA"]$t$::jsonb;

-- Voice, Multimedia Collaboration, and Converged Protocols
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$Voice over Internet Protocol$t$::text))
  where id = 'e0378370-8715-4cc5-8975-aae56eb10bcc' and content_blocks #>> '{2,terms,0,term}' = $t$VoIP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$Session Initiation Protocol$t$::text))
  where id = 'e0378370-8715-4cc5-8975-aae56eb10bcc' and content_blocks #>> '{2,terms,1,term}' = $t$SIP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$Real-Time Transport Protocol$t$::text))
  where id = 'e0378370-8715-4cc5-8975-aae56eb10bcc' and content_blocks #>> '{2,terms,2,term}' = $t$RTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$SRTP: Secure Real-Time Transport Protocol · TLS: Transport Layer Security$t$::text))
  where id = 'e0378370-8715-4cc5-8975-aae56eb10bcc' and content_blocks #>> '{2,terms,3,term}' = $t$SRTP and SIP over TLS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,full}', to_jsonb($t$VLAN: Virtual Local Area Network$t$::text))
  where id = 'e0378370-8715-4cc5-8975-aae56eb10bcc' and content_blocks #>> '{4,term}' = $t$Voice VLAN$t$;

-- Code Review and Software Testing
update lessons set content_blocks = jsonb_set(content_blocks, '{1,columnsFull}', $t$["Static Application Security Testing", "Dynamic Application Security Testing", "Interactive Application Security Testing"]$t$::jsonb)
  where id = 'e04d0bc9-8449-4ef0-b647-c66f6c569cb8' and content_blocks #> '{1,columns}' = $t$["SAST", "DAST", "IAST"]$t$::jsonb;

-- Business Continuity & Disaster Recovery Planning
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,after,0,full}', to_jsonb($t$Recovery Time Objective$t$::text))
  where id = 'e916584e-3a66-4a17-b529-ecb67bea3e77' and content_blocks #>> '{3,diagram,after,0,label}' = $t$RTO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,after,1,full}', to_jsonb($t$Work Recovery Time$t$::text))
  where id = 'e916584e-3a66-4a17-b529-ecb67bea3e77' and content_blocks #>> '{3,diagram,after,1,label}' = $t$WRT$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,before,full}', to_jsonb($t$Recovery Point Objective$t$::text))
  where id = 'e916584e-3a66-4a17-b529-ecb67bea3e77' and content_blocks #>> '{3,diagram,before,label}' = $t$RPO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,total,full}', to_jsonb($t$Maximum Tolerable Downtime$t$::text))
  where id = 'e916584e-3a66-4a17-b529-ecb67bea3e77' and content_blocks #>> '{3,diagram,total,label}' = $t$MTD$t$;

-- Wireless Network Security
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,steps,0,full}', to_jsonb($t$Wired Equivalent Privacy$t$::text))
  where id = 'ed588a29-80e1-4dd4-89c6-3b58b5fac109' and content_blocks #>> '{1,diagram,steps,0,label}' = $t$WEP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,steps,1,full}', to_jsonb($t$Wi-Fi Protected Access$t$::text))
  where id = 'ed588a29-80e1-4dd4-89c6-3b58b5fac109' and content_blocks #>> '{1,diagram,steps,1,label}' = $t$WPA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,steps,2,full}', to_jsonb($t$Wi-Fi Protected Access 2$t$::text))
  where id = 'ed588a29-80e1-4dd4-89c6-3b58b5fac109' and content_blocks #>> '{1,diagram,steps,2,label}' = $t$WPA2$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,steps,3,full}', to_jsonb($t$Wi-Fi Protected Access 3$t$::text))
  where id = 'ed588a29-80e1-4dd4-89c6-3b58b5fac109' and content_blocks #>> '{1,diagram,steps,3,label}' = $t$WPA3$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["PSK: Pre-Shared Key", null]$t$::jsonb)
  where id = 'ed588a29-80e1-4dd4-89c6-3b58b5fac109' and content_blocks #> '{2,columns}' = $t$["Personal (PSK)", "Enterprise (802.1X)"]$t$::jsonb;

-- Incident Management
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,1,full}', to_jsonb($t$IR: Incident Response$t$::text))
  where id = 'eea5b18a-a57d-4ad3-b200-9d31b4f7c4ea' and content_blocks #>> '{4,terms,1,term}' = $t$IR team$t$;

-- System Architecture Vulnerabilities: Client-Server, Distributed, Cloud, and Virtualization
update lessons set content_blocks = jsonb_set(content_blocks, '{6,terms,0,full}', to_jsonb($t$VM: Virtual Machine$t$::text))
  where id = 'ef076720-367b-4b10-9bd2-96849db7904c' and content_blocks #>> '{6,terms,0,term}' = $t$VM escape$t$;

-- Network Devices and Segmentation
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$Virtual Local Area Network$t$::text))
  where id = 'f3ef6f14-5427-407e-8ca4-0fc220417050' and content_blocks #>> '{3,terms,0,term}' = $t$VLAN$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$Demilitarized Zone$t$::text))
  where id = 'f3ef6f14-5427-407e-8ca4-0fc220417050' and content_blocks #>> '{3,terms,1,term}' = $t$DMZ$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,diagram,steps,2,full}', to_jsonb($t$Demilitarized Zone$t$::text))
  where id = 'f3ef6f14-5427-407e-8ca4-0fc220417050' and content_blocks #>> '{4,diagram,steps,2,label}' = $t$DMZ$t$;

-- The OSI and TCP/IP Models
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["TCP: Transmission Control Protocol · IP: Internet Protocol", null, null, null]$t$::jsonb)
  where id = 'f74e0117-c11a-4677-b1b8-e34f70ce61f7' and content_blocks #> '{2,columns}' = $t$["TCP/IP layer", "Unit of data", "Devices and protocols", "Typical attacks"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,0,full}', to_jsonb($t$MAC: Media Access Control$t$::text))
  where id = 'f74e0117-c11a-4677-b1b8-e34f70ce61f7' and content_blocks #>> '{4,terms,0,term}' = $t$Decides by MAC address$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,1,full}', to_jsonb($t$IP: Internet Protocol$t$::text))
  where id = 'f74e0117-c11a-4677-b1b8-e34f70ce61f7' and content_blocks #>> '{4,terms,1,term}' = $t$Decides by IP address$t$;

-- The Software Development Life Cycle (SDLC) and Secure Development
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$SDLC: Software Development Life Cycle · SSDLC: Secure Software Development Life Cycle$t$::text))
  where id = 'faa57b2f-2890-4c5b-a392-03de7f2fbbde' and content_blocks #>> '{2,terms,0,term}' = $t$Secure SDLC (SSDLC)$t$;

-- Secure Network Protocols
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,1,full}', to_jsonb($t$File Transfer Protocol$t$::text))
  where id = 'fcf57ce4-9dc0-46bf-8d35-9a5890e01ae0' and content_blocks #>> '{2,rows,1,label}' = $t$FTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,2,full}', to_jsonb($t$Hypertext Transfer Protocol$t$::text))
  where id = 'fcf57ce4-9dc0-46bf-8d35-9a5890e01ae0' and content_blocks #>> '{2,rows,2,label}' = $t$HTTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,4,full}', to_jsonb($t$DNS: Domain Name System$t$::text))
  where id = 'fcf57ce4-9dc0-46bf-8d35-9a5890e01ae0' and content_blocks #>> '{2,rows,4,label}' = $t$Plain DNS$t$;

-- ---------------- cysa-plus ----------------

-- Core Detection Tools: Packet Analysis, SIEM, and EDR/XDR
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$Security Information and Event Management$t$::text))
  where id = '04c36d74-68ee-40e3-9dec-d3b7575b2af0' and content_blocks #>> '{2,term}' = $t$SIEM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,columnsFull}', $t$["Endpoint Detection and Response", "Extended Detection and Response"]$t$::jsonb)
  where id = '04c36d74-68ee-40e3-9dec-d3b7575b2af0' and content_blocks #> '{3,columns}' = $t$["EDR", "XDR"]$t$::jsonb;

-- Evidence Handling and Chain of Custody
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,rungs,1,full}', to_jsonb($t$Random Access Memory$t$::text))
  where id = '06ac9b03-2165-4aae-bd4b-9bde86b5bf2d' and content_blocks #>> '{2,diagram,rungs,1,label}' = $t$RAM$t$;

-- Vulnerability Scanners and Cloud Security Tools
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$Cloud Security Posture Management$t$::text))
  where id = '239e9727-aa93-47ce-a11c-8147f2e26788' and content_blocks #>> '{2,term}' = $t$CSPM$t$;

-- Domain 3 Recap: Incident Response and Management
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$ATT&CK: Adversarial Tactics, Techniques, and Common Knowledge · IR: Incident Response$t$::text))
  where id = '2a38db67-3145-4ed5-bf86-39693d7b06fe' and content_blocks #>> '{1,terms,2,term}' = $t$ATT&CK in IR$t$;

-- Secure Application Development Concepts
update lessons set content_blocks = jsonb_set(content_blocks, '{1,columnsFull}', $t$["Static Application Security Testing", "Dynamic Application Security Testing"]$t$::jsonb)
  where id = '2a9bc0d8-2567-4a94-a181-3d2330a38eff' and content_blocks #> '{1,columns}' = $t$["SAST", "DAST"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$Software Bill of Materials$t$::text))
  where id = '2a9bc0d8-2567-4a94-a181-3d2330a38eff' and content_blocks #>> '{3,terms,0,term}' = $t$SBOM$t$;

-- Prioritizing Vulnerabilities: CVSS and EPSS
update lessons set content_blocks = jsonb_set(content_blocks, '{1,columnsFull}', $t$["Common Vulnerability Scoring System", "Exploit Prediction Scoring System"]$t$::jsonb)
  where id = '3353e8d3-70c2-4dc8-94d7-d3bf52b8c154' and content_blocks #> '{1,columns}' = $t$["CVSS", "EPSS"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,points,0,full}', to_jsonb($t$CVSS: Common Vulnerability Scoring System$t$::text))
  where id = '3353e8d3-70c2-4dc8-94d7-d3bf52b8c154' and content_blocks #>> '{2,diagram,points,0,label}' = $t$High CVSS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,points,1,full}', to_jsonb($t$EPSS: Exploit Prediction Scoring System$t$::text))
  where id = '3353e8d3-70c2-4dc8-94d7-d3bf52b8c154' and content_blocks #>> '{2,diagram,points,1,label}' = $t$High EPSS$t$;

-- System and Network Architecture Fundamentals
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$OS: Operating System$t$::text))
  where id = '35ae6282-d734-4570-9460-ce42715d1c20' and content_blocks #>> '{1,terms,3,term}' = $t$OS hardening$t$;

-- Identity, Encryption, and Modern Network Architecture
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$Identity and Access Management$t$::text))
  where id = '4574b25e-8f4b-466a-8501-4d7451e1bcc5' and content_blocks #>> '{1,terms,0,term}' = $t$IAM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$Secure Access Service Edge$t$::text))
  where id = '4574b25e-8f4b-466a-8501-4d7451e1bcc5' and content_blocks #>> '{1,terms,3,term}' = $t$SASE$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$Secure Access Service Edge$t$::text))
  where id = '4574b25e-8f4b-466a-8501-4d7451e1bcc5' and content_blocks #>> '{2,term}' = $t$SASE$t$;

-- Domain 4 Recap: Reporting and Communication
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$Mean Time to Detect$t$::text))
  where id = 'a2f17b46-0b93-4611-bdac-cfffc81d6b91' and content_blocks #>> '{3,terms,0,term}' = $t$MTTD$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$MTTR: Mean Time to Repair$t$::text))
  where id = 'a2f17b46-0b93-4611-bdac-cfffc81d6b91' and content_blocks #>> '{3,terms,1,term}' = $t$MTTR (incident)$t$;

-- The MITRE ATT&CK Framework in Incident Response
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$ATT&CK: Adversarial Tactics, Techniques, and Common Knowledge$t$::text))
  where id = 'a3e0ced0-64ed-4c09-94fb-cf8e23935ce1' and content_blocks #>> '{2,term}' = $t$ATT&CK Navigator$t$;

-- Specialized Scanning Considerations
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,0,full}', to_jsonb($t$ICS: Industrial Control Systems · OT: Operational Technology$t$::text))
  where id = 'b0d864aa-3d42-422b-ae6a-9189b1ca72fd' and content_blocks #>> '{1,rows,0,label}' = $t$ICS / OT$t$;

-- Threat Intelligence Concepts
update lessons set content_blocks = jsonb_set(content_blocks, '{3,full}', to_jsonb($t$ATT&CK: Adversarial Tactics, Techniques, and Common Knowledge$t$::text))
  where id = 'b36dd07e-ef33-4c64-916a-83f37388ab91' and content_blocks #>> '{3,term}' = $t$MITRE ATT&CK$t$;

-- Domain 2 Recap: Vulnerability Management
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$ICS: Industrial Control Systems · OT: Operational Technology$t$::text))
  where id = 'b665931f-217f-4c9c-885f-412f569d76d3' and content_blocks #>> '{1,terms,3,term}' = $t$ICS / OT$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$ZAP: Zed Attack Proxy$t$::text))
  where id = 'b665931f-217f-4c9c-885f-412f569d76d3' and content_blocks #>> '{2,terms,1,term}' = $t$Burp, ZAP / Nikto$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$CVSS: Common Vulnerability Scoring System · EPSS: Exploit Prediction Scoring System$t$::text))
  where id = 'b665931f-217f-4c9c-885f-412f569d76d3' and content_blocks #>> '{3,terms,0,term}' = $t$CVSS / EPSS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,4,full}', to_jsonb($t$SAST: Static Application Security Testing · DAST: Dynamic Application Security Testing · SBOM: Software Bill of Materials$t$::text))
  where id = 'b665931f-217f-4c9c-885f-412f569d76d3' and content_blocks #>> '{3,terms,4,term}' = $t$SAST / DAST / SBOM$t$;

-- Network and Web Application Scanning Tools
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,2,full}', to_jsonb($t$IP: Internet Protocol$t$::text))
  where id = 'bb79bdac-6e4c-433f-a4a4-8a1addf702d4' and content_blocks #>> '{1,rows,2,label}' = $t$Angry IP Scanner$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,1,full}', to_jsonb($t$OWASP: Open Worldwide Application Security Project · ZAP: Zed Attack Proxy$t$::text))
  where id = 'bb79bdac-6e4c-433f-a4a4-8a1addf702d4' and content_blocks #>> '{2,rows,1,label}' = $t$OWASP ZAP$t$;

-- Domain 1 Recap: Security Operations
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$SASE: Secure Access Service Edge$t$::text))
  where id = 'c24220d0-7952-4f04-8b91-4bd12f9cc046' and content_blocks #>> '{1,terms,2,term}' = $t$Zero trust / SASE$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,5,full}', to_jsonb($t$BEC: Business Email Compromise$t$::text))
  where id = 'c24220d0-7952-4f04-8b91-4bd12f9cc046' and content_blocks #>> '{1,terms,5,term}' = $t$Impossible travel / BEC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$EDR: Endpoint Detection and Response · XDR: Extended Detection and Response$t$::text))
  where id = 'c24220d0-7952-4f04-8b91-4bd12f9cc046' and content_blocks #>> '{2,terms,1,term}' = $t$EDR / XDR$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,5,full}', to_jsonb($t$Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service and Elevation of Privilege$t$::text))
  where id = 'c24220d0-7952-4f04-8b91-4bd12f9cc046' and content_blocks #>> '{2,terms,5,term}' = $t$STRIDE$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$Security Orchestration, Automation and Response$t$::text))
  where id = 'c24220d0-7952-4f04-8b91-4bd12f9cc046' and content_blocks #>> '{3,terms,1,term}' = $t$SOAR$t$;

-- Vulnerability Metrics and Stakeholder Communication
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$MTTR: Mean Time to Repair$t$::text))
  where id = 'e0f19da0-6f19-43e8-90c8-80ef3ca23897' and content_blocks #>> '{1,terms,2,term}' = $t$Mean time to remediate (MTTR)$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$SLA: Service-Level Agreement$t$::text))
  where id = 'e0f19da0-6f19-43e8-90c8-80ef3ca23897' and content_blocks #>> '{1,terms,3,term}' = $t$SLA compliance rate$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$SLA: Service-Level Agreement$t$::text))
  where id = 'e0f19da0-6f19-43e8-90c8-80ef3ca23897' and content_blocks #>> '{2,term}' = $t$Remediation SLA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,steps,1,full}', to_jsonb($t$SLA: Service-Level Agreement$t$::text))
  where id = 'e0f19da0-6f19-43e8-90c8-80ef3ca23897' and content_blocks #>> '{3,diagram,steps,1,label}' = $t$SLA compliance falling$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,steps,2,full}', to_jsonb($t$MTTR: Mean Time to Repair$t$::text))
  where id = 'e0f19da0-6f19-43e8-90c8-80ef3ca23897' and content_blocks #>> '{3,diagram,steps,2,label}' = $t$MTTR growing$t$;

-- Efficiency and Process Improvement in Security Operations
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["Security Information and Event Management", "Security Orchestration, Automation and Response"]$t$::jsonb)
  where id = 'e5559adc-ffb8-47c5-81e1-7241c00dce1e' and content_blocks #> '{2,columns}' = $t$["SIEM", "SOAR"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$API: Application Programming Interface$t$::text))
  where id = 'e5559adc-ffb8-47c5-81e1-7241c00dce1e' and content_blocks #>> '{3,terms,1,term}' = $t$API integration$t$;

-- Playbooks, Triage, and Timeline Construction
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$IR: Incident Response$t$::text))
  where id = 'e83210fd-971f-493a-879a-985d35696139' and content_blocks #>> '{1,terms,0,term}' = $t$IR playbook$t$;

-- ---------------- it-fundamentals ----------------

-- Domain 5 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$DML: Data Manipulation Language · DDL: Data Definition Language$t$::text))
  where id = '17a5674f-f7df-44d4-9e8a-eb595ac62fda' and content_blocks #>> '{2,terms,1,term}' = $t$DML / DDL$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$UI: User Interface$t$::text))
  where id = '17a5674f-f7df-44d4-9e8a-eb595ac62fda' and content_blocks #>> '{2,terms,2,term}' = $t$Direct / programmatic / UI$t$;

-- Domain 1 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$ASCII: American Standard Code for Information Interchange$t$::text))
  where id = '33705071-4555-425b-841c-6332478845c2' and content_blocks #>> '{1,terms,1,term}' = $t$ASCII / Unicode$t$;

-- Notational Systems and Data Representation
update lessons set content_blocks = jsonb_set(content_blocks, '{4,columnsFull}', $t$["American Standard Code for Information Interchange", null]$t$::jsonb)
  where id = '39af7424-0365-4473-9366-5a6fd4731fc5' and content_blocks #> '{4,columns}' = $t$["ASCII", "Unicode"]$t$::jsonb;

-- Domain 6 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$Authentication, Authorization and Accounting$t$::text))
  where id = '3d6f9ebe-9cb9-4020-8e5e-a37a8d419579' and content_blocks #>> '{2,terms,0,term}' = $t$AAA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,4,full}', to_jsonb($t$DR: Disaster Recovery$t$::text))
  where id = '3d6f9ebe-9cb9-4020-8e5e-a37a8d419579' and content_blocks #>> '{2,terms,4,term}' = $t$Redundancy / backup / DR$t$;

-- Internet Service Types
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,2,full}', to_jsonb($t$Digital Subscriber Line$t$::text))
  where id = '43722f99-f0c3-4310-95e9-18b960e2f326' and content_blocks #>> '{1,rows,2,label}' = $t$DSL$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,3,full}', to_jsonb($t$RF: Radio Frequency$t$::text))
  where id = '43722f99-f0c3-4310-95e9-18b960e2f326' and content_blocks #>> '{1,rows,3,label}' = $t$Fixed wireless (RF)$t$;

-- Non-Relational Databases
update lessons set content_blocks = jsonb_set(content_blocks, '{1,columnsFull}', $t$[null, "NoSQL: Not Only SQL"]$t$::jsonb)
  where id = '4569d444-292a-4e07-9696-c2a45915f549' and content_blocks #> '{1,columns}' = $t$["Relational", "Non-relational (NoSQL)"]$t$::jsonb;

-- Domain 2 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$Video Graphics Array$t$::text))
  where id = '45b23295-f048-41a2-8221-0b65f3a037d6' and content_blocks #>> '{1,terms,1,term}' = $t$VGA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$RAM: Random Access Memory$t$::text))
  where id = '45b23295-f048-41a2-8221-0b65f3a037d6' and content_blocks #>> '{1,terms,3,term}' = $t$RAM / storage$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,4,full}', to_jsonb($t$BIOS: Basic Input/Output System · UEFI: Unified Extensible Firmware Interface$t$::text))
  where id = '45b23295-f048-41a2-8221-0b65f3a037d6' and content_blocks #>> '{1,terms,4,term}' = $t$BIOS / UEFI$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$DSL: Digital Subscriber Line$t$::text))
  where id = '45b23295-f048-41a2-8221-0b65f3a037d6' and content_blocks #>> '{2,terms,0,term}' = $t$Fiber / cable / DSL$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$IP: Internet Protocol · MAC: Media Access Control$t$::text))
  where id = '45b23295-f048-41a2-8221-0b65f3a037d6' and content_blocks #>> '{3,terms,0,term}' = $t$IP / MAC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$Domain Name System$t$::text))
  where id = '45b23295-f048-41a2-8221-0b65f3a037d6' and content_blocks #>> '{3,terms,1,term}' = $t$DNS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$SMTP: Simple Mail Transfer Protocol · POP3: Post Office Protocol Version 3 · IMAP: Internet Message Access Protocol$t$::text))
  where id = '45b23295-f048-41a2-8221-0b65f3a037d6' and content_blocks #>> '{3,terms,3,term}' = $t$SMTP / POP3, IMAP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,4,full}', to_jsonb($t$WEP: Wired Equivalent Privacy · WPA: Wi-Fi Protected Access · WPA2: Wi-Fi Protected Access 2$t$::text))
  where id = '45b23295-f048-41a2-8221-0b65f3a037d6' and content_blocks #>> '{3,terms,4,term}' = $t$WEP, WPA, WPA2$t$;

-- Units of Measure
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,2,full}', to_jsonb($t$CPU: Central Processing Unit$t$::text))
  where id = '56588cad-45e3-412c-adab-a9a940ece395' and content_blocks #>> '{2,rows,2,label}' = $t$CPU speed$t$;

-- Domain 3 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$NTFS: New Technology File System · FAT32: File Allocation Table 32 · APFS: Apple File System$t$::text))
  where id = '5916bbf9-892c-49f6-8281-eb88d4f775cc' and content_blocks #>> '{1,terms,1,term}' = $t$NTFS, FAT32, APFS, ext4$t$;

-- Internal Computing Components
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,1,full}', to_jsonb($t$BIOS: Basic Input/Output System · UEFI: Unified Extensible Firmware Interface$t$::text))
  where id = '5b03aae1-fcb9-441b-9f78-b81edb9dc29e' and content_blocks #>> '{1,rows,1,label}' = $t$BIOS / UEFI$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,2,full}', to_jsonb($t$Central Processing Unit$t$::text))
  where id = '5b03aae1-fcb9-441b-9f78-b81edb9dc29e' and content_blocks #>> '{1,rows,2,label}' = $t$CPU$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,3,full}', to_jsonb($t$Random Access Memory$t$::text))
  where id = '5b03aae1-fcb9-441b-9f78-b81edb9dc29e' and content_blocks #>> '{1,rows,3,label}' = $t$RAM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,5,full}', to_jsonb($t$Graphics Processing Unit$t$::text))
  where id = '5b03aae1-fcb9-441b-9f78-b81edb9dc29e' and content_blocks #>> '{1,rows,5,label}' = $t$GPU$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,7,full}', to_jsonb($t$Network Interface Card$t$::text))
  where id = '5b03aae1-fcb9-441b-9f78-b81edb9dc29e' and content_blocks #>> '{1,rows,7,label}' = $t$NIC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["Random Access Memory", "SSD: Solid-State Drive · HDD: Hard Disk Drive"]$t$::jsonb)
  where id = '5b03aae1-fcb9-441b-9f78-b81edb9dc29e' and content_blocks #> '{2,columns}' = $t$["RAM", "Storage (SSD, HDD)"]$t$::jsonb;

-- Interfacing with Databases
update lessons set content_blocks = jsonb_set(content_blocks, '{1,columnsFull}', $t$["Data Manipulation Language", "Data Definition Language"]$t$::jsonb)
  where id = '750da6db-477d-4178-b607-427fa6da4d40' and content_blocks #> '{1,columns}' = $t$["DML", "DDL"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,2,full}', to_jsonb($t$UI: User Interface$t$::text))
  where id = '750da6db-477d-4178-b607-427fa6da4d40' and content_blocks #>> '{2,rows,2,label}' = $t$UI based$t$;

-- Basic Networking Concepts
update lessons set content_blocks = jsonb_set(content_blocks, '{1,columnsFull}', $t$["IP: Internet Protocol", "MAC: Media Access Control"]$t$::jsonb)
  where id = '79c2970b-936d-470d-ae9e-c4f8a0c4bf44' and content_blocks #> '{1,columns}' = $t$["IP address", "MAC address"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$Domain Name System$t$::text))
  where id = '79c2970b-936d-470d-ae9e-c4f8a0c4bf44' and content_blocks #>> '{2,term}' = $t$DNS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$Local Area Network$t$::text))
  where id = '79c2970b-936d-470d-ae9e-c4f8a0c4bf44' and content_blocks #>> '{3,terms,0,term}' = $t$LAN$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$Wide Area Network$t$::text))
  where id = '79c2970b-936d-470d-ae9e-c4f8a0c4bf44' and content_blocks #>> '{3,terms,1,term}' = $t$WAN$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,2,full}', to_jsonb($t$HTTP: Hypertext Transfer Protocol · HTTPS: HTTP Secure$t$::text))
  where id = '79c2970b-936d-470d-ae9e-c4f8a0c4bf44' and content_blocks #>> '{3,terms,2,term}' = $t$HTTP / HTTPS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$Simple Mail Transfer Protocol$t$::text))
  where id = '79c2970b-936d-470d-ae9e-c4f8a0c4bf44' and content_blocks #>> '{3,terms,3,term}' = $t$SMTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,4,full}', to_jsonb($t$POP3: Post Office Protocol Version 3 · IMAP: Internet Message Access Protocol$t$::text))
  where id = '79c2970b-936d-470d-ae9e-c4f8a0c4bf44' and content_blocks #>> '{3,terms,4,term}' = $t$POP3 / IMAP$t$;

-- OS Components
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,0,full}', to_jsonb($t$New Technology File System$t$::text))
  where id = '91cf6e16-b6e6-4884-96a7-9602aadabe86' and content_blocks #>> '{1,rows,0,label}' = $t$NTFS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,1,full}', to_jsonb($t$File Allocation Table 32$t$::text))
  where id = '91cf6e16-b6e6-4884-96a7-9602aadabe86' and content_blocks #>> '{1,rows,1,label}' = $t$FAT32$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,2,full}', to_jsonb($t$HFS: Hierarchical File System · APFS: Apple File System$t$::text))
  where id = '91cf6e16-b6e6-4884-96a7-9602aadabe86' and content_blocks #>> '{1,rows,2,label}' = $t$HFS+ / APFS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$CLI: Command-Line Interface · GUI: Graphical User Interface$t$::text))
  where id = '91cf6e16-b6e6-4884-96a7-9602aadabe86' and content_blocks #>> '{3,terms,3,term}' = $t$Console (CLI) / GUI$t$;

-- Authentication, Authorization, Accounting, and Non-Repudiation
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$MFA: Multifactor Authentication$t$::text))
  where id = '9b85d226-4265-4567-8a80-01f5c190ba9f' and content_blocks #>> '{2,terms,0,term}' = $t$Single factor / MFA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$Single Sign-on$t$::text))
  where id = '9b85d226-4265-4567-8a80-01f5c190ba9f' and content_blocks #>> '{2,terms,1,term}' = $t$SSO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$Role-Based Access Control$t$::text))
  where id = '9b85d226-4265-4567-8a80-01f5c190ba9f' and content_blocks #>> '{2,terms,3,term}' = $t$RBAC$t$;

-- I/O Device Interfaces
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$Near-Field Communication$t$::text))
  where id = 'e1d2894f-31ae-46c9-aaa3-ebbd136f6bb5' and content_blocks #>> '{2,terms,1,term}' = $t$NFC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$Radio Frequency$t$::text))
  where id = 'e1d2894f-31ae-46c9-aaa3-ebbd136f6bb5' and content_blocks #>> '{2,terms,2,term}' = $t$RF$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,3,full}', to_jsonb($t$Video Graphics Array$t$::text))
  where id = 'e1d2894f-31ae-46c9-aaa3-ebbd136f6bb5' and content_blocks #>> '{3,rows,3,label}' = $t$VGA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,4,full}', to_jsonb($t$Digital Visual Interface$t$::text))
  where id = 'e1d2894f-31ae-46c9-aaa3-ebbd136f6bb5' and content_blocks #>> '{3,rows,4,label}' = $t$DVI$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,5,full}', to_jsonb($t$High-Definition Multimedia Interface$t$::text))
  where id = 'e1d2894f-31ae-46c9-aaa3-ebbd136f6bb5' and content_blocks #>> '{3,rows,5,label}' = $t$HDMI$t$;

-- Installing and Securing a Basic Wireless Network
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$Service Set Identifier$t$::text))
  where id = 'e314f96e-b421-4801-98a5-fa7e1dac946e' and content_blocks #>> '{2,term}' = $t$SSID$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,rungs,0,full}', to_jsonb($t$Wi-Fi Protected Access 2$t$::text))
  where id = 'e314f96e-b421-4801-98a5-fa7e1dac946e' and content_blocks #>> '{3,diagram,rungs,0,label}' = $t$WPA2$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,rungs,1,full}', to_jsonb($t$Wi-Fi Protected Access$t$::text))
  where id = 'e314f96e-b421-4801-98a5-fa7e1dac946e' and content_blocks #>> '{3,diagram,rungs,1,label}' = $t$WPA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,rungs,2,full}', to_jsonb($t$Wired Equivalent Privacy$t$::text))
  where id = 'e314f96e-b421-4801-98a5-fa7e1dac946e' and content_blocks #>> '{3,diagram,rungs,2,label}' = $t$WEP$t$;

-- ---------------- network-plus ----------------

-- Switching Fundamentals and VLANs
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$Virtual Local Area Network$t$::text))
  where id = '04ad67f0-64ab-4756-bd44-a751cdc951fe' and content_blocks #>> '{2,term}' = $t$VLAN$t$;

-- Naming, Time, and Management Protocols
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,steps,3,full}', to_jsonb($t$TLD: Top-Level Domain$t$::text))
  where id = '0e171b0b-cfbc-4706-9232-5ce187189638' and content_blocks #>> '{1,diagram,steps,3,label}' = $t$TLD server$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,1,full}', to_jsonb($t$IPv6 Address Record$t$::text))
  where id = '0e171b0b-cfbc-4706-9232-5ce187189638' and content_blocks #>> '{2,rows,1,label}' = $t$AAAA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,2,full}', to_jsonb($t$Canonical Name$t$::text))
  where id = '0e171b0b-cfbc-4706-9232-5ce187189638' and content_blocks #>> '{2,rows,2,label}' = $t$CNAME$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,3,full}', to_jsonb($t$Mail Exchanger$t$::text))
  where id = '0e171b0b-cfbc-4706-9232-5ce187189638' and content_blocks #>> '{2,rows,3,label}' = $t$MX$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,4,full}', to_jsonb($t$Text$t$::text))
  where id = '0e171b0b-cfbc-4706-9232-5ce187189638' and content_blocks #>> '{2,rows,4,label}' = $t$TXT$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,5,full}', to_jsonb($t$Name Server$t$::text))
  where id = '0e171b0b-cfbc-4706-9232-5ce187189638' and content_blocks #>> '{2,rows,5,label}' = $t$NS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,6,full}', to_jsonb($t$Pointer$t$::text))
  where id = '0e171b0b-cfbc-4706-9232-5ce187189638' and content_blocks #>> '{2,rows,6,label}' = $t$PTR$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,full}', to_jsonb($t$DHCP: Dynamic Host Configuration Protocol · IP: Internet Protocol$t$::text))
  where id = '0e171b0b-cfbc-4706-9232-5ce187189638' and content_blocks #>> '{4,term}' = $t$DHCP relay (IP helper)$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{5,terms,0,full}', to_jsonb($t$Network Time Protocol$t$::text))
  where id = '0e171b0b-cfbc-4706-9232-5ce187189638' and content_blocks #>> '{5,terms,0,term}' = $t$NTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{5,terms,1,full}', to_jsonb($t$Simple Network Management Protocol$t$::text))
  where id = '0e171b0b-cfbc-4706-9232-5ce187189638' and content_blocks #>> '{5,terms,1,term}' = $t$SNMP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{5,terms,2,full}', to_jsonb($t$Lightweight Directory Access Protocol$t$::text))
  where id = '0e171b0b-cfbc-4706-9232-5ce187189638' and content_blocks #>> '{5,terms,2,term}' = $t$LDAP$t$;

-- Cloud Concepts and Connectivity Options
update lessons set content_blocks = jsonb_set(content_blocks, '{4,full}', to_jsonb($t$Software-Defined Networking$t$::text))
  where id = '1c177ebe-314e-4561-a549-9cd8b839cda2' and content_blocks #>> '{4,term}' = $t$SDN$t$;

-- Segmentation and Security Appliances
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,rungs,0,full}', to_jsonb($t$Web Application Firewall$t$::text))
  where id = '1c6fc27a-5f23-4474-a8f1-4d11045dba5c' and content_blocks #>> '{1,diagram,rungs,0,label}' = $t$WAF$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,rungs,1,full}', to_jsonb($t$Next-Generation Firewall$t$::text))
  where id = '1c6fc27a-5f23-4474-a8f1-4d11045dba5c' and content_blocks #>> '{1,diagram,rungs,1,label}' = $t$NGFW$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["Intrusion Detection System", "Intrusion Prevention System"]$t$::jsonb)
  where id = '1c6fc27a-5f23-4474-a8f1-4d11045dba5c' and content_blocks #> '{2,columns}' = $t$["IDS", "IPS"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,steps,2,full}', to_jsonb($t$Demilitarized Zone$t$::text))
  where id = '1c6fc27a-5f23-4474-a8f1-4d11045dba5c' and content_blocks #>> '{3,diagram,steps,2,label}' = $t$DMZ$t$;

-- Transmission Media and Transceivers
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["SMF: Single-Mode Fiber", "MMF: Multimode Fiber"]$t$::jsonb)
  where id = '3812675b-c221-410e-9b4f-094b2a19d6eb' and content_blocks #> '{2,columns}' = $t$["Single-mode (SMF)", "Multimode (MMF)"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$Lucent Connector$t$::text))
  where id = '3812675b-c221-410e-9b4f-094b2a19d6eb' and content_blocks #>> '{3,terms,0,term}' = $t$LC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$SC: Subscriber Connector · ST: Straight Tip$t$::text))
  where id = '3812675b-c221-410e-9b4f-094b2a19d6eb' and content_blocks #>> '{3,terms,1,term}' = $t$SC / ST$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,2,full}', to_jsonb($t$SFP: Small Form-Factor Pluggable$t$::text))
  where id = '3812675b-c221-410e-9b4f-094b2a19d6eb' and content_blocks #>> '{3,terms,2,term}' = $t$SFP / SFP+$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$Quad Small Form-Factor Pluggable$t$::text))
  where id = '3812675b-c221-410e-9b4f-094b2a19d6eb' and content_blocks #>> '{3,terms,3,term}' = $t$QSFP$t$;

-- Physical Installation Factors
update lessons set content_blocks = jsonb_set(content_blocks, '{1,columnsFull}', $t$["Main Distribution Frame", "Intermediate Distribution Frame"]$t$::jsonb)
  where id = '491dd58a-275c-4304-bd18-07f655a08e2e' and content_blocks #> '{1,columns}' = $t$["MDF", "IDF"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,columnsFull}', $t$["Uninterruptible Power Supply", "Power Distribution Unit"]$t$::jsonb)
  where id = '491dd58a-275c-4304-bd18-07f655a08e2e' and content_blocks #> '{3,columns}' = $t$["UPS", "PDU"]$t$::jsonb;

-- Common Network Attacks I: Denial of Service and On-Path Attacks
update lessons set content_blocks = jsonb_set(content_blocks, '{1,columnsFull}', $t$[null, "Distributed Denial-of-Service"]$t$::jsonb)
  where id = '4da7098d-9b84-4fcb-bd2b-2458a54f0303' and content_blocks #> '{1,columns}' = $t$["DoS", "DDoS"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,0,full}', to_jsonb($t$ARP: Address Resolution Protocol$t$::text))
  where id = '4da7098d-9b84-4fcb-bd2b-2458a54f0303' and content_blocks #>> '{3,rows,0,label}' = $t$ARP spoofing$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,1,full}', to_jsonb($t$DNS: Domain Name System$t$::text))
  where id = '4da7098d-9b84-4fcb-bd2b-2458a54f0303' and content_blocks #>> '{3,rows,1,label}' = $t$DNS spoofing$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,2,full}', to_jsonb($t$MAC: Media Access Control$t$::text))
  where id = '4da7098d-9b84-4fcb-bd2b-2458a54f0303' and content_blocks #>> '{3,rows,2,label}' = $t$MAC flooding$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,full}', to_jsonb($t$ARP: Address Resolution Protocol$t$::text))
  where id = '4da7098d-9b84-4fcb-bd2b-2458a54f0303' and content_blocks #>> '{4,term}' = $t$ARP spoofing$t$;

-- Wireless Deployment and Site Considerations
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$LTE: Long-Term Evolution$t$::text))
  where id = '5a4064bc-2cea-40b2-bba6-f918a5956620' and content_blocks #>> '{3,terms,3,term}' = $t$Cellular (LTE, 5G)$t$;

-- Subnetting in Practice
update lessons set content_blocks = jsonb_set(content_blocks, '{4,full}', to_jsonb($t$Variable-Length Subnet Masking$t$::text))
  where id = '5be06466-f0b4-472d-b570-9420ed932f62' and content_blocks #>> '{4,term}' = $t$VLSM$t$;

-- Network Service Issues
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$DHCP: Dynamic Host Configuration Protocol$t$::text))
  where id = '5d7d3a57-f0b4-4cf2-9c8f-93e980a6767a' and content_blocks #>> '{1,terms,0,term}' = $t$DHCP scope exhaustion$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$APIPA: Automatic Private IP Addressing$t$::text))
  where id = '5d7d3a57-f0b4-4cf2-9c8f-93e980a6767a' and content_blocks #>> '{1,terms,1,term}' = $t$APIPA (169.254)$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$IP: Internet Protocol$t$::text))
  where id = '5d7d3a57-f0b4-4cf2-9c8f-93e980a6767a' and content_blocks #>> '{1,terms,2,term}' = $t$IP address conflict$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$DNS: Domain Name System$t$::text))
  where id = '5d7d3a57-f0b4-4cf2-9c8f-93e980a6767a' and content_blocks #>> '{2,terms,0,term}' = $t$Wrong DNS server$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,steps,1,full}', to_jsonb($t$IP: Internet Protocol$t$::text))
  where id = '5d7d3a57-f0b4-4cf2-9c8f-93e980a6767a' and content_blocks #>> '{3,diagram,steps,1,label}' = $t$Ping by IP$t$;

-- Domain 2 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$RIP: Routing Information Protocol · EIGRP: Enhanced Interior Gateway Routing Protocol · OSPF: Open Shortest Path First · BGP: Border Gateway Protocol$t$::text))
  where id = '63042c20-aafa-4a9b-8cf1-d668905f21fa' and content_blocks #>> '{1,terms,2,term}' = $t$RIP, EIGRP / OSPF / BGP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$Port Address Translation$t$::text))
  where id = '63042c20-aafa-4a9b-8cf1-d668905f21fa' and content_blocks #>> '{1,terms,3,term}' = $t$PAT$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,4,full}', to_jsonb($t$Virtual Local Area Networks$t$::text))
  where id = '63042c20-aafa-4a9b-8cf1-d668905f21fa' and content_blocks #>> '{1,terms,4,term}' = $t$VLANs$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$Spanning Tree Protocol$t$::text))
  where id = '63042c20-aafa-4a9b-8cf1-d668905f21fa' and content_blocks #>> '{2,terms,0,term}' = $t$STP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$VLAN: Virtual Local Area Network$t$::text))
  where id = '63042c20-aafa-4a9b-8cf1-d668905f21fa' and content_blocks #>> '{2,terms,1,term}' = $t$Trunk / native VLAN$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$Link Aggregation Control Protocol$t$::text))
  where id = '63042c20-aafa-4a9b-8cf1-d668905f21fa' and content_blocks #>> '{2,terms,2,term}' = $t$LACP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,2,full}', to_jsonb($t$WPA3: Wi-Fi Protected Access 3 · SAE: Simultaneous Authentication of Equals$t$::text))
  where id = '63042c20-aafa-4a9b-8cf1-d668905f21fa' and content_blocks #>> '{3,terms,2,term}' = $t$WPA3 / SAE$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$MDF: Main Distribution Frame · IDF: Intermediate Distribution Frame$t$::text))
  where id = '63042c20-aafa-4a9b-8cf1-d668905f21fa' and content_blocks #>> '{3,terms,3,term}' = $t$MDF / IDF$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,4,full}', to_jsonb($t$UPS: Uninterruptible Power Supply · PDU: Power Distribution Unit$t$::text))
  where id = '63042c20-aafa-4a9b-8cf1-d668905f21fa' and content_blocks #>> '{3,terms,4,term}' = $t$UPS / PDU$t$;

-- Organizational Processes and Documentation
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,0,full}', to_jsonb($t$Service-Level Agreement$t$::text))
  where id = '69856dee-0686-4a7c-aa5e-5d913ae5b763' and content_blocks #>> '{2,rows,0,label}' = $t$SLA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,1,full}', to_jsonb($t$Memorandum of Understanding$t$::text))
  where id = '69856dee-0686-4a7c-aa5e-5d913ae5b763' and content_blocks #>> '{2,rows,1,label}' = $t$MOU$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,2,full}', to_jsonb($t$Non-Disclosure Agreement$t$::text))
  where id = '69856dee-0686-4a7c-aa5e-5d913ae5b763' and content_blocks #>> '{2,rows,2,label}' = $t$NDA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,3,full}', to_jsonb($t$IP Address Management$t$::text))
  where id = '69856dee-0686-4a7c-aa5e-5d913ae5b763' and content_blocks #>> '{4,terms,3,term}' = $t$IPAM$t$;

-- Disaster Recovery Concepts
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,after,0,full}', to_jsonb($t$Recovery Time Objective$t$::text))
  where id = '6acfa0ae-5228-4176-b84f-e5a095afced4' and content_blocks #>> '{1,diagram,after,0,label}' = $t$RTO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,before,full}', to_jsonb($t$Recovery Point Objective$t$::text))
  where id = '6acfa0ae-5228-4176-b84f-e5a095afced4' and content_blocks #>> '{1,diagram,before,label}' = $t$RPO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["Mean Time Between Failures", "Mean Time to Repair"]$t$::jsonb)
  where id = '6acfa0ae-5228-4176-b84f-e5a095afced4' and content_blocks #> '{2,columns}' = $t$["MTBF", "MTTR"]$t$::jsonb;

-- Wireless Standards and Security
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,rungs,0,full}', to_jsonb($t$Wi-Fi Protected Access 3$t$::text))
  where id = '71a9ce22-66de-4103-adbb-488759f4b00a' and content_blocks #>> '{3,diagram,rungs,0,label}' = $t$WPA3$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,rungs,1,full}', to_jsonb($t$Wi-Fi Protected Access 2$t$::text))
  where id = '71a9ce22-66de-4103-adbb-488759f4b00a' and content_blocks #>> '{3,diagram,rungs,1,label}' = $t$WPA2$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,rungs,2,full}', to_jsonb($t$Wi-Fi Protected Access$t$::text))
  where id = '71a9ce22-66de-4103-adbb-488759f4b00a' and content_blocks #>> '{3,diagram,rungs,2,label}' = $t$WPA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,rungs,3,full}', to_jsonb($t$Wired Equivalent Privacy$t$::text))
  where id = '71a9ce22-66de-4103-adbb-488759f4b00a' and content_blocks #>> '{3,diagram,rungs,3,label}' = $t$WEP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,full}', to_jsonb($t$Simultaneous Authentication of Equals$t$::text))
  where id = '71a9ce22-66de-4103-adbb-488759f4b00a' and content_blocks #>> '{4,term}' = $t$SAE$t$;

-- Network Hardening and Access Control
update lessons set content_blocks = jsonb_set(content_blocks, '{3,columnsFull}', $t$["Remote Authentication Dial-In User Service", "Terminal Access Controller Access-Control System"]$t$::jsonb)
  where id = '7629923f-1b15-443b-9edf-3426b4526b15' and content_blocks #> '{3,columns}' = $t$["RADIUS", "TACACS+"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,2,full}', to_jsonb($t$Authentication, Authorization and Accounting$t$::text))
  where id = '7629923f-1b15-443b-9edf-3426b4526b15' and content_blocks #>> '{3,rows,2,label}' = $t$AAA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,columnsFull}', $t$["Access Control List", "Network Access Control"]$t$::jsonb)
  where id = '7629923f-1b15-443b-9edf-3426b4526b15' and content_blocks #> '{4,columns}' = $t$["ACL", "NAC"]$t$::jsonb;

-- OSI Model Layers and Encapsulation
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["PDU: Protocol Data Unit", null]$t$::jsonb)
  where id = '77558548-52c0-4e7a-ac84-b9b83ff4120b' and content_blocks #> '{2,columns}' = $t$["PDU name", "Header adds"]$t$::jsonb;

-- Common Ports and Protocols
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,0,full}', to_jsonb($t$File Transfer Protocol$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{1,rows,0,label}' = $t$FTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,1,full}', to_jsonb($t$SSH: Secure Shell · SFTP: SSH File Transfer Protocol$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{1,rows,1,label}' = $t$SSH / SFTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,3,full}', to_jsonb($t$Hypertext Transfer Protocol$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{1,rows,3,label}' = $t$HTTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,4,full}', to_jsonb($t$HTTP Secure$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{1,rows,4,label}' = $t$HTTPS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,5,full}', to_jsonb($t$FTP Secure$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{1,rows,5,label}' = $t$FTPS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,6,full}', to_jsonb($t$Remote Desktop Protocol$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{1,rows,6,label}' = $t$RDP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,0,full}', to_jsonb($t$Simple Mail Transfer Protocol$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{2,rows,0,label}' = $t$SMTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,2,full}', to_jsonb($t$Post Office Protocol Version 3$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{2,rows,2,label}' = $t$POP3$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,3,full}', to_jsonb($t$Internet Message Access Protocol$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{2,rows,3,label}' = $t$IMAP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,0,full}', to_jsonb($t$Domain Name System$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{3,rows,0,label}' = $t$DNS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,1,full}', to_jsonb($t$Dynamic Host Configuration Protocol$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{3,rows,1,label}' = $t$DHCP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,2,full}', to_jsonb($t$Trivial File Transfer Protocol$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{3,rows,2,label}' = $t$TFTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,3,full}', to_jsonb($t$Network Time Protocol$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{3,rows,3,label}' = $t$NTP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,4,full}', to_jsonb($t$Simple Network Management Protocol$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{3,rows,4,label}' = $t$SNMP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,5,full}', to_jsonb($t$LDAP: Lightweight Directory Access Protocol · LDAPS: Secure LDAP$t$::text))
  where id = '7adaf102-02ab-4ed9-a0a3-2aa987578fdc' and content_blocks #>> '{3,rows,5,label}' = $t$LDAP / LDAPS$t$;

-- Domain 4 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$DDoS: Distributed Denial-of-Service$t$::text))
  where id = '7ce72855-8306-4d8c-bdf3-4cc7766aaeab' and content_blocks #>> '{1,terms,1,term}' = $t$DoS / DDoS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$ARP: Address Resolution Protocol · DNS: Domain Name System$t$::text))
  where id = '7ce72855-8306-4d8c-bdf3-4cc7766aaeab' and content_blocks #>> '{1,terms,2,term}' = $t$ARP / DNS spoofing$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$MAC: Media Access Control$t$::text))
  where id = '7ce72855-8306-4d8c-bdf3-4cc7766aaeab' and content_blocks #>> '{1,terms,3,term}' = $t$MAC flooding$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,4,full}', to_jsonb($t$VLAN: Virtual Local Area Network$t$::text))
  where id = '7ce72855-8306-4d8c-bdf3-4cc7766aaeab' and content_blocks #>> '{1,terms,4,term}' = $t$VLAN hopping$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,5,full}', to_jsonb($t$AP: Access Point$t$::text))
  where id = '7ce72855-8306-4d8c-bdf3-4cc7766aaeab' and content_blocks #>> '{1,terms,5,term}' = $t$Rogue AP / evil twin$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$RADIUS: Remote Authentication Dial-In User Service · TACACS: Terminal Access Controller Access-Control System$t$::text))
  where id = '7ce72855-8306-4d8c-bdf3-4cc7766aaeab' and content_blocks #>> '{2,terms,1,term}' = $t$RADIUS / TACACS+$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$ACL: Access Control List · NAC: Network Access Control$t$::text))
  where id = '7ce72855-8306-4d8c-bdf3-4cc7766aaeab' and content_blocks #>> '{2,terms,2,term}' = $t$ACL / NAC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$NGFW: Next-Generation Firewall · WAF: Web Application Firewall$t$::text))
  where id = '7ce72855-8306-4d8c-bdf3-4cc7766aaeab' and content_blocks #>> '{2,terms,3,term}' = $t$Stateful firewall / NGFW / WAF$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,4,full}', to_jsonb($t$IDS: Intrusion Detection System · IPS: Intrusion Prevention System$t$::text))
  where id = '7ce72855-8306-4d8c-bdf3-4cc7766aaeab' and content_blocks #>> '{2,terms,4,term}' = $t$IDS / IPS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,5,full}', to_jsonb($t$Demilitarized Zone$t$::text))
  where id = '7ce72855-8306-4d8c-bdf3-4cc7766aaeab' and content_blocks #>> '{2,terms,5,term}' = $t$DMZ$t$;

-- Networking Appliances and Their Functions
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,5,full}', to_jsonb($t$IDS: Intrusion Detection System · IPS: Intrusion Prevention System$t$::text))
  where id = '81282d03-be25-42cf-af32-fea46bd9cbce' and content_blocks #>> '{1,terms,5,term}' = $t$IDS / IPS$t$;

-- Network Monitoring Technologies
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$IPFIX: IP Flow Information Export$t$::text))
  where id = '874b400a-9212-483b-9620-32a2b52457cb' and content_blocks #>> '{2,terms,1,term}' = $t$NetFlow / sFlow / IPFIX$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$SPAN: Switched Port Analyzer$t$::text))
  where id = '874b400a-9212-483b-9620-32a2b52457cb' and content_blocks #>> '{2,terms,3,term}' = $t$Port mirroring (SPAN)$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,1,full}', to_jsonb($t$CPU: Central Processing Unit$t$::text))
  where id = '874b400a-9212-483b-9620-32a2b52457cb' and content_blocks #>> '{4,terms,1,term}' = $t$CPU and memory$t$;

-- Evolving Network Environments
update lessons set content_blocks = jsonb_set(content_blocks, '{1,columnsFull}', $t$["Software-Defined Networking", null]$t$::jsonb)
  where id = '92b302c0-7557-41f3-836f-917e344cb9bb' and content_blocks #> '{1,columns}' = $t$["SDN", "SD-WAN"]$t$::jsonb;

-- Domain 5 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$TX: Transmit · RX: Receive$t$::text))
  where id = '97fa3df7-b8ac-4d0b-b147-20d49b255250' and content_blocks #>> '{1,terms,2,term}' = $t$TX/RX reversed$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$IP: Internet Protocol$t$::text))
  where id = '97fa3df7-b8ac-4d0b-b147-20d49b255250' and content_blocks #>> '{2,terms,1,term}' = $t$IP works, name doesn't$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,4,full}', to_jsonb($t$TDR: Time-Domain Reflectometer · OTDR: Optical Time-Domain Reflectometer$t$::text))
  where id = '97fa3df7-b8ac-4d0b-b147-20d49b255250' and content_blocks #>> '{3,terms,4,term}' = $t$TDR / OTDR$t$;

-- Spanning Tree, Trunking, and Link Aggregation
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$VLAN: Virtual Local Area Network$t$::text))
  where id = 'a9b92195-f33a-4656-9b83-6c49903fbe59' and content_blocks #>> '{2,terms,3,term}' = $t$Native VLAN$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,4,full}', to_jsonb($t$Link Aggregation Control Protocol$t$::text))
  where id = 'a9b92195-f33a-4656-9b83-6c49903fbe59' and content_blocks #>> '{2,terms,4,term}' = $t$LACP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,rows,0,full}', to_jsonb($t$VLANs: Virtual Local Area Networks$t$::text))
  where id = 'a9b92195-f33a-4656-9b83-6c49903fbe59' and content_blocks #>> '{4,rows,0,label}' = $t$VLANs carried$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{5,full}', to_jsonb($t$LACP: Link Aggregation Control Protocol$t$::text))
  where id = 'a9b92195-f33a-4656-9b83-6c49903fbe59' and content_blocks #>> '{5,term}' = $t$Link aggregation (LACP)$t$;

-- Routing Technologies
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,rungs,2,full}', to_jsonb($t$EIGRP: Enhanced Interior Gateway Routing Protocol$t$::text))
  where id = 'b6ac3f57-475f-49cb-b2d8-930c48e02b49' and content_blocks #>> '{3,diagram,rungs,2,label}' = $t$EIGRP: 90$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,rungs,3,full}', to_jsonb($t$OSPF: Open Shortest Path First$t$::text))
  where id = 'b6ac3f57-475f-49cb-b2d8-930c48e02b49' and content_blocks #>> '{3,diagram,rungs,3,label}' = $t$OSPF: 110$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,diagram,rungs,4,full}', to_jsonb($t$RIP: Routing Information Protocol$t$::text))
  where id = 'b6ac3f57-475f-49cb-b2d8-930c48e02b49' and content_blocks #>> '{3,diagram,rungs,4,label}' = $t$RIP: 120$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,full}', to_jsonb($t$NAT: Network Address Translation · PAT: Port Address Translation$t$::text))
  where id = 'b6ac3f57-475f-49cb-b2d8-930c48e02b49' and content_blocks #>> '{4,term}' = $t$NAT and PAT$t$;

-- Domain 1 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$OSI: Open Systems Interconnection$t$::text))
  where id = 'b903ed18-cea7-4a4c-9eb3-49fbcc70030c' and content_blocks #>> '{1,terms,0,term}' = $t$OSI layers$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$Protocol Data Units$t$::text))
  where id = 'b903ed18-cea7-4a4c-9eb3-49fbcc70030c' and content_blocks #>> '{1,terms,1,term}' = $t$PDUs$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$Discover, Offer, Request, Acknowledge$t$::text))
  where id = 'b903ed18-cea7-4a4c-9eb3-49fbcc70030c' and content_blocks #>> '{2,terms,1,term}' = $t$DORA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$Automatic Private IP Addressing$t$::text))
  where id = 'b903ed18-cea7-4a4c-9eb3-49fbcc70030c' and content_blocks #>> '{3,terms,1,term}' = $t$APIPA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$SDN: Software-Defined Networking$t$::text))
  where id = 'b903ed18-cea7-4a4c-9eb3-49fbcc70030c' and content_blocks #>> '{3,terms,3,term}' = $t$SDN / SD-WAN$t$;

-- Common Network Attacks II: VLAN Hopping, Rogue Devices, and Social Engineering
update lessons set content_blocks = jsonb_set(content_blocks, '{1,full}', to_jsonb($t$VLAN: Virtual Local Area Network$t$::text))
  where id = 'c64b2918-bb2c-4cad-a777-2a8a7b20f4e3' and content_blocks #>> '{1,term}' = $t$VLAN hopping$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$DHCP: Dynamic Host Configuration Protocol$t$::text))
  where id = 'c64b2918-bb2c-4cad-a777-2a8a7b20f4e3' and content_blocks #>> '{2,term}' = $t$Rogue DHCP server$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,columnsFull}', $t$["AP: Access Point", null]$t$::jsonb)
  where id = 'c64b2918-bb2c-4cad-a777-2a8a7b20f4e3' and content_blocks #> '{3,columns}' = $t$["Rogue AP", "Evil twin"]$t$::jsonb;

-- Network Access and Management Methods
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$Secure Shell$t$::text))
  where id = 'cd8e19ce-d9c8-45fc-9ac7-4569cabd949d' and content_blocks #>> '{3,terms,0,term}' = $t$SSH$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$Remote Desktop Protocol$t$::text))
  where id = 'cd8e19ce-d9c8-45fc-9ac7-4569cabd949d' and content_blocks #>> '{3,terms,1,term}' = $t$RDP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,2,full}', to_jsonb($t$API: Application Programming Interface$t$::text))
  where id = 'cd8e19ce-d9c8-45fc-9ac7-4569cabd949d' and content_blocks #>> '{3,terms,2,term}' = $t$API (RESTful)$t$;

-- Additional Troubleshooting Tools and Software
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,3,full}', to_jsonb($t$Time-Domain Reflectometer$t$::text))
  where id = 'd4adb8fc-02d5-440b-ad76-d8dbc2759ef4' and content_blocks #>> '{1,rows,3,label}' = $t$TDR$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,4,full}', to_jsonb($t$Optical Time-Domain Reflectometer$t$::text))
  where id = 'd4adb8fc-02d5-440b-ad76-d8dbc2759ef4' and content_blocks #>> '{1,rows,4,label}' = $t$OTDR$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$[null, null, "TDR: Time-Domain Reflectometer · OTDR: Optical Time-Domain Reflectometer"]$t$::jsonb)
  where id = 'd4adb8fc-02d5-440b-ad76-d8dbc2759ef4' and content_blocks #> '{2,columns}' = $t$["Cable tester", "Cable certifier", "TDR / OTDR"]$t$::jsonb;

-- Domain 3 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$SLA: Service-Level Agreement · MOU: Memorandum of Understanding · NDA: Non-Disclosure Agreement$t$::text))
  where id = 'd5bedaf9-add9-453b-8c0f-a3d43d13dc5e' and content_blocks #>> '{1,terms,0,term}' = $t$SLA / MOU / NDA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$SNMP: Simple Network Management Protocol$t$::text))
  where id = 'd5bedaf9-add9-453b-8c0f-a3d43d13dc5e' and content_blocks #>> '{1,terms,2,term}' = $t$SNMP poll / trap$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$RPO: Recovery Point Objective · RTO: Recovery Time Objective$t$::text))
  where id = 'd5bedaf9-add9-453b-8c0f-a3d43d13dc5e' and content_blocks #>> '{2,terms,0,term}' = $t$RPO / RTO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$MTBF: Mean Time Between Failures · MTTR: Mean Time to Repair$t$::text))
  where id = 'd5bedaf9-add9-453b-8c0f-a3d43d13dc5e' and content_blocks #>> '{2,terms,1,term}' = $t$MTBF / MTTR$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$DORA: Discover, Offer, Request, Acknowledge$t$::text))
  where id = 'd5bedaf9-add9-453b-8c0f-a3d43d13dc5e' and content_blocks #>> '{3,terms,0,term}' = $t$DORA, reservation, relay$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$VPN: Virtual Private Network$t$::text))
  where id = 'd5bedaf9-add9-453b-8c0f-a3d43d13dc5e' and content_blocks #>> '{3,terms,3,term}' = $t$Site-to-site / client-to-site VPN$t$;

-- Implementing IPv4 and IPv6 Network Services
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$IP: Internet Protocol$t$::text))
  where id = 'e4738f97-69dc-4fad-ab09-9b002ff8e035' and content_blocks #>> '{2,terms,1,term}' = $t$Relay / IP helper$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,1,full}', to_jsonb($t$IPv6 Address Record$t$::text))
  where id = 'e4738f97-69dc-4fad-ab09-9b002ff8e035' and content_blocks #>> '{3,rows,1,label}' = $t$AAAA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,2,full}', to_jsonb($t$Canonical Name$t$::text))
  where id = 'e4738f97-69dc-4fad-ab09-9b002ff8e035' and content_blocks #>> '{3,rows,2,label}' = $t$CNAME$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,3,full}', to_jsonb($t$Mail Exchanger$t$::text))
  where id = 'e4738f97-69dc-4fad-ab09-9b002ff8e035' and content_blocks #>> '{3,rows,3,label}' = $t$MX$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,4,full}', to_jsonb($t$Text$t$::text))
  where id = 'e4738f97-69dc-4fad-ab09-9b002ff8e035' and content_blocks #>> '{3,rows,4,label}' = $t$TXT$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,5,full}', to_jsonb($t$Pointer$t$::text))
  where id = 'e4738f97-69dc-4fad-ab09-9b002ff8e035' and content_blocks #>> '{3,rows,5,label}' = $t$PTR$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,6,full}', to_jsonb($t$Name Server$t$::text))
  where id = 'e4738f97-69dc-4fad-ab09-9b002ff8e035' and content_blocks #>> '{3,rows,6,label}' = $t$NS$t$;

-- Performance Issues: Wireless and Interference
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["Received Signal Strength Indicator", "Signal-to-Noise Ratio"]$t$::jsonb)
  where id = 'ee19b5d9-a650-4860-8cb9-a639bd9afbcd' and content_blocks #> '{2,columns}' = $t$["RSSI", "SNR"]$t$::jsonb;

-- IPv4 Addressing Fundamentals
update lessons set content_blocks = jsonb_set(content_blocks, '{3,full}', to_jsonb($t$Automatic Private IP Addressing$t$::text))
  where id = 'fb12b858-5660-4647-b3a1-580a204ba272' and content_blocks #>> '{3,term}' = $t$APIPA$t$;

-- ---------------- nicet-shs-level-1 ----------------

-- Task Area 5 Recap: Safety
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$OSHA: Occupational Safety and Health Administration$t$::text))
  where id = '0692bb12-9a2c-4bd5-a98d-0faa8f0aeaaa' and content_blocks #>> '{1,terms,0,term}' = $t$OSHA 1926 / 1910$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$Lockout/Tagout$t$::text))
  where id = '0692bb12-9a2c-4bd5-a98d-0faa8f0aeaaa' and content_blocks #>> '{2,terms,0,term}' = $t$LOTO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$Safety Data Sheet$t$::text))
  where id = '0692bb12-9a2c-4bd5-a98d-0faa8f0aeaaa' and content_blocks #>> '{3,terms,0,term}' = $t$SDS$t$;

-- Task Area 4 Recap: System Design and Configuration
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$AHJ: Authority Having Jurisdiction$t$::text))
  where id = '07fbc29d-8572-4aa7-b2d9-279e9d49c88c' and content_blocks #>> '{3,terms,0,term}' = $t$Committees, jurisdictions, AHJ$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$NFPA: National Fire Protection Association$t$::text))
  where id = '07fbc29d-8572-4aa7-b2d9-279e9d49c88c' and content_blocks #>> '{3,terms,3,term}' = $t$NFPA 11$t$;

-- Installing Raceways and Conduit
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,2,full}', to_jsonb($t$EMT: Electrical Metallic Tubing$t$::text))
  where id = '0a61f1c0-d51a-4532-95a7-dbc70cecd5ba' and content_blocks #>> '{3,terms,2,term}' = $t$Support EMT$t$;

-- Standards, Codes, Specifications, and Listings
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$Authority Having Jurisdiction$t$::text))
  where id = '201ddffe-ba0b-4fef-993c-975f62c8af4b' and content_blocks #>> '{1,terms,3,term}' = $t$AHJ$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,steps,0,full}', to_jsonb($t$NFPA: National Fire Protection Association$t$::text))
  where id = '201ddffe-ba0b-4fef-993c-975f62c8af4b' and content_blocks #>> '{2,diagram,steps,0,label}' = $t$NFPA committees$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,steps,5,full}', to_jsonb($t$Authority Having Jurisdiction$t$::text))
  where id = '201ddffe-ba0b-4fef-993c-975f62c8af4b' and content_blocks #>> '{2,diagram,steps,5,label}' = $t$AHJ$t$;

-- Inspecting Clean Agent Cylinders and Discharge Hoses
update lessons set content_blocks = jsonb_set(content_blocks, '{3,full}', to_jsonb($t$CGA: Compressed Gas Association$t$::text))
  where id = '2343ac35-c506-4f81-a5c3-25492d96bc1e' and content_blocks #>> '{3,term}' = $t$CGA C-6$t$;

-- Using the Code Books Fast
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,0,full}', to_jsonb($t$NFPA: National Fire Protection Association$t$::text))
  where id = '23c7ce63-260e-478a-8b5c-653abcacb369' and content_blocks #>> '{1,rows,0,label}' = $t$NFPA 12$t$;

-- OSHA Basics, Lockout/Tagout, and Confined Spaces
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$GFCI: Ground-Fault Circuit Interrupter$t$::text))
  where id = '7e26f8c7-bbca-4957-a55c-156c0889ce9d' and content_blocks #>> '{2,terms,2,term}' = $t$Dry area and GFCI$t$;

-- Task Area 1 Recap: Inspection, Testing, and Maintenance
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$NFPA: National Fire Protection Association$t$::text))
  where id = '92be6a13-0f85-4e7c-8b17-5dfe046fb59c' and content_blocks #>> '{1,terms,0,term}' = $t$NFPA 12 / 2001 / 72 / 70$t$;

-- Job-Site Hazards and Personal Protective Equipment
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,0,full}', to_jsonb($t$CFR: Code of Federal Regulations$t$::text))
  where id = 'ac40f134-a140-4a56-9e0d-ae6ba0380156' and content_blocks #>> '{1,rows,0,label}' = $t$29 CFR 1926$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,diagram,rungs,4,full}', to_jsonb($t$Personal Protective Equipment$t$::text))
  where id = 'ac40f134-a140-4a56-9e0d-ae6ba0380156' and content_blocks #>> '{2,diagram,rungs,4,label}' = $t$PPE$t$;

-- Deriving Installation Information from Plans and Specifications
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$Request for Information$t$::text))
  where id = 'd67b7932-0c33-4238-9dc4-fa6101e51481' and content_blocks #>> '{2,terms,2,term}' = $t$RFI$t$;

-- ---------------- security-plus ----------------

-- Domain 1 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$CIA: Confidentiality, Integrity and Availability · AAA: Authentication, Authorization and Accounting$t$::text))
  where id = '0cd6c679-30a4-42b2-913c-d685488427e8' and content_blocks #>> '{1,terms,2,term}' = $t$CIA / AAA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$Public Key Infrastructure$t$::text))
  where id = '0cd6c679-30a4-42b2-913c-d685488427e8' and content_blocks #>> '{3,terms,0,term}' = $t$PKI$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$TPM: Trusted Platform Module · HSM: Hardware Security Module$t$::text))
  where id = '0cd6c679-30a4-42b2-913c-d685488427e8' and content_blocks #>> '{3,terms,3,term}' = $t$TPM / HSM$t$;

-- Physical, Network, and Application Attack Indicators
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$RFID: Radio-Frequency Identification$t$::text))
  where id = '0d4c0ee9-b2d7-4192-97c1-393f5396a1ba' and content_blocks #>> '{1,terms,1,term}' = $t$RFID cloning$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$Distributed Denial-of-Service$t$::text))
  where id = '0d4c0ee9-b2d7-4192-97c1-393f5396a1ba' and content_blocks #>> '{2,terms,0,term}' = $t$DDoS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$DNS: Domain Name System$t$::text))
  where id = '0d4c0ee9-b2d7-4192-97c1-393f5396a1ba' and content_blocks #>> '{2,terms,3,term}' = $t$DNS attack$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,1,full}', to_jsonb($t$CSRF: Cross-Site Request Forgery$t$::text))
  where id = '0d4c0ee9-b2d7-4192-97c1-393f5396a1ba' and content_blocks #>> '{4,terms,1,term}' = $t$Forgery (CSRF)$t$;

-- On-Premises, Centralized/Decentralized, and IoT/ICS/SCADA Architecture
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$Industrial Control Systems$t$::text))
  where id = '137c5a8c-66d7-42a8-9c0e-7df7a1ab013f' and content_blocks #>> '{3,terms,1,term}' = $t$ICS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,2,full}', to_jsonb($t$Supervisory Control and Data Acquisition$t$::text))
  where id = '137c5a8c-66d7-42a8-9c0e-7df7a1ab013f' and content_blocks #>> '{3,terms,2,term}' = $t$SCADA$t$;

-- Domain 2 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$TOCTOU: Time-of-Check to Time-of-Use · XSS: Cross-Site Scripting$t$::text))
  where id = '1c7d7819-3a0b-4bd8-b871-c179bb8562d4' and content_blocks #>> '{2,terms,0,term}' = $t$Overflow / TOCTOU / SQLi / XSS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$VM: Virtual Machine$t$::text))
  where id = '1c7d7819-3a0b-4bd8-b871-c179bb8562d4' and content_blocks #>> '{2,terms,1,term}' = $t$Misconfiguration / VM escape / zero-day$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$DDoS: Distributed Denial-of-Service$t$::text))
  where id = '1c7d7819-3a0b-4bd8-b871-c179bb8562d4' and content_blocks #>> '{3,terms,0,term}' = $t$Amplified DDoS / on-path / replay$t$;

-- Cryptographic Solutions: PKI, Encryption, Hashing, and Certificates
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$Certificate Signing Request$t$::text))
  where id = '2be4fd54-01c6-400d-aa2e-354bed86e1e2' and content_blocks #>> '{1,terms,1,term}' = $t$CSR$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$CRL: Certificate Revocation List · OCSP: Online Certificate Status Protocol$t$::text))
  where id = '2be4fd54-01c6-400d-aa2e-354bed86e1e2' and content_blocks #>> '{1,terms,2,term}' = $t$CRL / OCSP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,columnsFull}', $t$["Trusted Platform Module", "Hardware Security Module", null]$t$::jsonb)
  where id = '2be4fd54-01c6-400d-aa2e-354bed86e1e2' and content_blocks #> '{4,columns}' = $t$["TPM", "HSM", "Secure enclave"]$t$::jsonb;

-- Security Techniques for Computing Resources
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$Wi-Fi Protected Access 3$t$::text))
  where id = '3286eb04-6d8b-4542-9c46-e1a612163393' and content_blocks #>> '{1,terms,2,term}' = $t$WPA3$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$Mobile Device Management$t$::text))
  where id = '3286eb04-6d8b-4542-9c46-e1a612163393' and content_blocks #>> '{1,terms,3,term}' = $t$MDM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,columnsFull}', $t$["Bring Your Own Device", "Corporate-Owned, Personally Enabled", "Choose Your Own Device"]$t$::jsonb)
  where id = '3286eb04-6d8b-4542-9c46-e1a612163393' and content_blocks #> '{4,columns}' = $t$["BYOD", "COPE", "CYOD"]$t$::jsonb;

-- Application and Operating System Vulnerabilities
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$TOCTOU: Time-of-Check to Time-of-Use$t$::text))
  where id = '34d0dee5-5c62-4f34-8932-7298e1fa4298' and content_blocks #>> '{2,terms,2,term}' = $t$Race condition (TOCTOU)$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$SQL: Structured Query Language$t$::text))
  where id = '34d0dee5-5c62-4f34-8932-7298e1fa4298' and content_blocks #>> '{2,terms,3,term}' = $t$SQL injection$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,columnsFull}', $t$["SQL: Structured Query Language", null]$t$::jsonb)
  where id = '34d0dee5-5c62-4f34-8932-7298e1fa4298' and content_blocks #> '{3,columns}' = $t$["SQL injection", "Cross-site scripting"]$t$::jsonb;

-- Vulnerability Management
update lessons set content_blocks = jsonb_set(content_blocks, '{3,full}', to_jsonb($t$Common Vulnerabilities and Exposures$t$::text))
  where id = '3e2f6319-7109-4738-a3d7-be36b5e68115' and content_blocks #>> '{3,term}' = $t$CVE$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,full}', to_jsonb($t$Common Vulnerability Scoring System$t$::text))
  where id = '3e2f6319-7109-4738-a3d7-be36b5e68115' and content_blocks #>> '{4,term}' = $t$CVSS$t$;

-- Mitigation Techniques
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$Host-Based Intrusion Prevention System$t$::text))
  where id = '45127b90-a224-4ffb-8d63-a9db7a25864a' and content_blocks #>> '{2,terms,1,term}' = $t$HIPS$t$;

-- The Risk Management Process
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$Single Loss Expectancy$t$::text))
  where id = '50186e4d-3368-4021-93f8-71ab370ecdd4' and content_blocks #>> '{2,terms,2,term}' = $t$SLE$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$Annualized Rate of Occurrence$t$::text))
  where id = '50186e4d-3368-4021-93f8-71ab370ecdd4' and content_blocks #>> '{2,terms,3,term}' = $t$ARO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,4,full}', to_jsonb($t$Annualized Loss Expectancy$t$::text))
  where id = '50186e4d-3368-4021-93f8-71ab370ecdd4' and content_blocks #>> '{2,terms,4,term}' = $t$ALE$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{7,diagram,after,0,full}', to_jsonb($t$Recovery Time Objective$t$::text))
  where id = '50186e4d-3368-4021-93f8-71ab370ecdd4' and content_blocks #>> '{7,diagram,after,0,label}' = $t$RTO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{7,diagram,before,full}', to_jsonb($t$Recovery Point Objective$t$::text))
  where id = '50186e4d-3368-4021-93f8-71ab370ecdd4' and content_blocks #>> '{7,diagram,before,label}' = $t$RPO$t$;

-- Domain 5 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,0,full}', to_jsonb($t$SLE: Single Loss Expectancy · ALE: Annualized Loss Expectancy$t$::text))
  where id = '5affe219-8a10-4f19-97a1-5a401398a604' and content_blocks #>> '{2,terms,0,term}' = $t$SLE and ALE$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$RTO: Recovery Time Objective · RPO: Recovery Point Objective$t$::text))
  where id = '5affe219-8a10-4f19-97a1-5a401398a604' and content_blocks #>> '{2,terms,2,term}' = $t$RTO / RPO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$SLA: Service-Level Agreement · MOU: Memorandum of Understanding · MSA: Master Service Agreement · SOW: Statement of Work · NDA: Non-Disclosure Agreement$t$::text))
  where id = '5affe219-8a10-4f19-97a1-5a401398a604' and content_blocks #>> '{3,terms,0,term}' = $t$SLA / MOU / MSA / SOW / NDA$t$;

-- Data Sources for Security Investigations
update lessons set content_blocks = jsonb_set(content_blocks, '{1,rows,3,full}', to_jsonb($t$OS: Operating System$t$::text))
  where id = '6212c163-038b-452f-8b87-2b534d437f97' and content_blocks #>> '{1,rows,3,label}' = $t$OS security logs$t$;

-- Domain 4 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$BYOD: Bring Your Own Device · COPE: Corporate-Owned, Personally Enabled · CYOD: Choose Your Own Device$t$::text))
  where id = '6a6915fd-03ec-4d38-ba7f-b24d5a1f8ab8' and content_blocks #>> '{1,terms,0,term}' = $t$BYOD / COPE / CYOD$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$Security Information and Event Management$t$::text))
  where id = '6a6915fd-03ec-4d38-ba7f-b24d5a1f8ab8' and content_blocks #>> '{2,terms,3,term}' = $t$SIEM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$SPF: Sender Policy Framework · DKIM: DomainKeys Identified Mail · DMARC: Domain-Based Message Authentication, Reporting and Conformance$t$::text))
  where id = '6a6915fd-03ec-4d38-ba7f-b24d5a1f8ab8' and content_blocks #>> '{3,terms,0,term}' = $t$SPF / DKIM / DMARC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$EDR: Endpoint Detection and Response · XDR: Extended Detection and Response$t$::text))
  where id = '6a6915fd-03ec-4d38-ba7f-b24d5a1f8ab8' and content_blocks #>> '{3,terms,1,term}' = $t$EDR / XDR$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,2,full}', to_jsonb($t$NAC: Network Access Control · DLP: Data Loss Prevention$t$::text))
  where id = '6a6915fd-03ec-4d38-ba7f-b24d5a1f8ab8' and content_blocks #>> '{3,terms,2,term}' = $t$NAC / DLP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$Web Application Firewall$t$::text))
  where id = '6a6915fd-03ec-4d38-ba7f-b24d5a1f8ab8' and content_blocks #>> '{3,terms,3,term}' = $t$WAF$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,0,full}', to_jsonb($t$MAC: Mandatory Access Control · DAC: Discretionary Access Control · RBAC: Role-Based Access Control · ABAC: Attribute-Based Access Control$t$::text))
  where id = '6a6915fd-03ec-4d38-ba7f-b24d5a1f8ab8' and content_blocks #>> '{4,terms,0,term}' = $t$MAC / DAC / RBAC / ABAC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,1,full}', to_jsonb($t$Multifactor Authentication$t$::text))
  where id = '6a6915fd-03ec-4d38-ba7f-b24d5a1f8ab8' and content_blocks #>> '{4,terms,1,term}' = $t$MFA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,2,full}', to_jsonb($t$JIT: Just-in-Time$t$::text))
  where id = '6a6915fd-03ec-4d38-ba7f-b24d5a1f8ab8' and content_blocks #>> '{4,terms,2,term}' = $t$JIT / vaulting / ephemeral$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,terms,4,full}', to_jsonb($t$IR: Incident Response$t$::text))
  where id = '6a6915fd-03ec-4d38-ba7f-b24d5a1f8ab8' and content_blocks #>> '{4,terms,4,term}' = $t$IR order$t$;

-- Enterprise Security Capabilities I: Network and Perimeter Defenses
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$NGFW: Next-Generation Firewall$t$::text))
  where id = '72da3c0b-f4f7-429c-8be3-536692f6b6bd' and content_blocks #>> '{1,terms,1,term}' = $t$NGFW (layer 7)$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,2,full}', to_jsonb($t$Web Application Firewall$t$::text))
  where id = '72da3c0b-f4f7-429c-8be3-536692f6b6bd' and content_blocks #>> '{1,terms,2,term}' = $t$WAF$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$Unified Threat Management$t$::text))
  where id = '72da3c0b-f4f7-429c-8be3-536692f6b6bd' and content_blocks #>> '{1,terms,3,term}' = $t$UTM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$["Web Application Firewall", "Next-Generation Firewall"]$t$::jsonb)
  where id = '72da3c0b-f4f7-429c-8be3-536692f6b6bd' and content_blocks #> '{2,columns}' = $t$["WAF", "NGFW"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,full}', to_jsonb($t$DNS: Domain Name System$t$::text))
  where id = '72da3c0b-f4f7-429c-8be3-536692f6b6bd' and content_blocks #>> '{4,term}' = $t$DNS filtering$t$;

-- Third-Party Risk Assessment and Management
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,0,full}', to_jsonb($t$Service-Level Agreement$t$::text))
  where id = 'b40f6e51-894a-4340-b3dc-c7e2a7ece366' and content_blocks #>> '{2,rows,0,label}' = $t$SLA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,1,full}', to_jsonb($t$Memorandum of Understanding$t$::text))
  where id = 'b40f6e51-894a-4340-b3dc-c7e2a7ece366' and content_blocks #>> '{2,rows,1,label}' = $t$MOU$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,2,full}', to_jsonb($t$Memorandum of Agreement$t$::text))
  where id = 'b40f6e51-894a-4340-b3dc-c7e2a7ece366' and content_blocks #>> '{2,rows,2,label}' = $t$MOA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,3,full}', to_jsonb($t$Master Service Agreement$t$::text))
  where id = 'b40f6e51-894a-4340-b3dc-c7e2a7ece366' and content_blocks #>> '{2,rows,3,label}' = $t$MSA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,4,full}', to_jsonb($t$SOW: Statement of Work$t$::text))
  where id = 'b40f6e51-894a-4340-b3dc-c7e2a7ece366' and content_blocks #>> '{2,rows,4,label}' = $t$SOW / WO$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,5,full}', to_jsonb($t$Non-Disclosure Agreement$t$::text))
  where id = 'b40f6e51-894a-4340-b3dc-c7e2a7ece366' and content_blocks #>> '{2,rows,5,label}' = $t$NDA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,rows,6,full}', to_jsonb($t$Business Partnership Agreement$t$::text))
  where id = 'b40f6e51-894a-4340-b3dc-c7e2a7ece366' and content_blocks #>> '{2,rows,6,label}' = $t$BPA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,full}', to_jsonb($t$MSA: Master Service Agreement · SOW: Statement of Work$t$::text))
  where id = 'b40f6e51-894a-4340-b3dc-c7e2a7ece366' and content_blocks #>> '{3,term}' = $t$MSA and SOW together$t$;

-- Automation and Orchestration in Security Operations
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,4,full}', to_jsonb($t$API: Application Programming Interface$t$::text))
  where id = 'ce35f608-e54e-4ffa-b179-b656d4c20109' and content_blocks #>> '{1,terms,4,term}' = $t$API integrations$t$;

-- Security Alerting and Monitoring
update lessons set content_blocks = jsonb_set(content_blocks, '{2,full}', to_jsonb($t$Security Information and Event Management$t$::text))
  where id = 'd4607f49-01f9-439f-a176-100faebbe458' and content_blocks #>> '{2,term}' = $t$SIEM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,full}', to_jsonb($t$Security Content Automation Protocol$t$::text))
  where id = 'd4607f49-01f9-439f-a176-100faebbe458' and content_blocks #>> '{3,term}' = $t$SCAP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{5,terms,1,full}', to_jsonb($t$SNMP: Simple Network Management Protocol$t$::text))
  where id = 'd4607f49-01f9-439f-a176-100faebbe458' and content_blocks #>> '{5,terms,1,term}' = $t$SNMP traps$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{5,terms,3,full}', to_jsonb($t$Data Loss Prevention$t$::text))
  where id = 'd4607f49-01f9-439f-a176-100faebbe458' and content_blocks #>> '{5,terms,3,term}' = $t$DLP$t$;

-- Identity and Access Management Implementation
update lessons set content_blocks = jsonb_set(content_blocks, '{2,columnsFull}', $t$[null, "Single Sign-on"]$t$::jsonb)
  where id = 'd9c082b4-ff04-4e60-8085-0b64e49062bf' and content_blocks #> '{2,columns}' = $t$["Federation", "SSO"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,0,full}', to_jsonb($t$Mandatory Access Control$t$::text))
  where id = 'd9c082b4-ff04-4e60-8085-0b64e49062bf' and content_blocks #>> '{3,rows,0,label}' = $t$MAC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,1,full}', to_jsonb($t$Discretionary Access Control$t$::text))
  where id = 'd9c082b4-ff04-4e60-8085-0b64e49062bf' and content_blocks #>> '{3,rows,1,label}' = $t$DAC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,2,full}', to_jsonb($t$Role-Based Access Control$t$::text))
  where id = 'd9c082b4-ff04-4e60-8085-0b64e49062bf' and content_blocks #>> '{3,rows,2,label}' = $t$RBAC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,rows,4,full}', to_jsonb($t$Attribute-Based Access Control$t$::text))
  where id = 'd9c082b4-ff04-4e60-8085-0b64e49062bf' and content_blocks #>> '{3,rows,4,label}' = $t$ABAC$t$;

-- Securing Enterprise Infrastructure
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,0,full}', to_jsonb($t$DMZ: Demilitarized Zone$t$::text))
  where id = 'dcd0c75d-35ac-4068-a2b3-739ec8557c3f' and content_blocks #>> '{1,terms,0,term}' = $t$Screened subnet (DMZ)$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,0,full}', to_jsonb($t$Next-Generation Firewall$t$::text))
  where id = 'dcd0c75d-35ac-4068-a2b3-739ec8557c3f' and content_blocks #>> '{3,terms,0,term}' = $t$NGFW$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,1,full}', to_jsonb($t$IDS: Intrusion Detection System · IPS: Intrusion Prevention System$t$::text))
  where id = 'dcd0c75d-35ac-4068-a2b3-739ec8557c3f' and content_blocks #>> '{3,terms,1,term}' = $t$IDS / IPS$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{3,terms,3,full}', to_jsonb($t$Virtual Private Network$t$::text))
  where id = 'dcd0c75d-35ac-4068-a2b3-739ec8557c3f' and content_blocks #>> '{3,terms,3,term}' = $t$VPN$t$;

-- Domain 3 Recap
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,3,full}', to_jsonb($t$ICS: Industrial Control Systems · SCADA: Supervisory Control and Data Acquisition$t$::text))
  where id = 'dde2456e-814e-43c5-8efb-7d839d35ff46' and content_blocks #>> '{1,terms,3,term}' = $t$ICS and SCADA$t$;

-- Cloud, Supply Chain, and Virtualization Vulnerabilities
update lessons set content_blocks = jsonb_set(content_blocks, '{1,terms,1,full}', to_jsonb($t$VM: Virtual Machine$t$::text))
  where id = 'f4c7d851-7fd4-4ef0-b940-7e960bb24b7f' and content_blocks #>> '{1,terms,1,term}' = $t$VM escape$t$;

-- Enterprise Security Capabilities II: Endpoint, Email, and Data Protection
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,steps,0,full}', to_jsonb($t$Sender Policy Framework$t$::text))
  where id = 'f9697b09-2475-4d12-acb2-2701af51414d' and content_blocks #>> '{1,diagram,steps,0,label}' = $t$SPF$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,steps,1,full}', to_jsonb($t$DomainKeys Identified Mail$t$::text))
  where id = 'f9697b09-2475-4d12-acb2-2701af51414d' and content_blocks #>> '{1,diagram,steps,1,label}' = $t$DKIM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{1,diagram,steps,2,full}', to_jsonb($t$Domain-Based Message Authentication, Reporting and Conformance$t$::text))
  where id = 'f9697b09-2475-4d12-acb2-2701af51414d' and content_blocks #>> '{1,diagram,steps,2,label}' = $t$DMARC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,1,full}', to_jsonb($t$File Integrity Monitoring$t$::text))
  where id = 'f9697b09-2475-4d12-acb2-2701af51414d' and content_blocks #>> '{2,terms,1,term}' = $t$FIM$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,2,full}', to_jsonb($t$Data Loss Prevention$t$::text))
  where id = 'f9697b09-2475-4d12-acb2-2701af51414d' and content_blocks #>> '{2,terms,2,term}' = $t$DLP$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,3,full}', to_jsonb($t$Network Access Control$t$::text))
  where id = 'f9697b09-2475-4d12-acb2-2701af51414d' and content_blocks #>> '{2,terms,3,term}' = $t$NAC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{2,terms,4,full}', to_jsonb($t$User and Entity Behavior Analytics$t$::text))
  where id = 'f9697b09-2475-4d12-acb2-2701af51414d' and content_blocks #>> '{2,terms,4,term}' = $t$UEBA$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{4,full}', to_jsonb($t$Network Access Control$t$::text))
  where id = 'f9697b09-2475-4d12-acb2-2701af51414d' and content_blocks #>> '{4,term}' = $t$NAC$t$;
update lessons set content_blocks = jsonb_set(content_blocks, '{5,columnsFull}', $t$["Endpoint Detection and Response", "Extended Detection and Response"]$t$::jsonb)
  where id = 'f9697b09-2475-4d12-acb2-2701af51414d' and content_blocks #> '{5,columns}' = $t$["EDR", "XDR"]$t$::jsonb;
update lessons set content_blocks = jsonb_set(content_blocks, '{6,full}', to_jsonb($t$User and Entity Behavior Analytics$t$::text))
  where id = 'f9697b09-2475-4d12-acb2-2701af51414d' and content_blocks #>> '{6,term}' = $t$UEBA$t$;
