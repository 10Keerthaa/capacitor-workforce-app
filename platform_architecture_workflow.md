# 10xWorkforce.ai: End-to-End Module Architecture

This document outlines the complete data lifecycle for all 6 core modules in the 10xWorkforce.ai platform. It explains exactly what happens from the moment a field worker clicks "Submit" to the moment the Executive Manager reviews the AI's decision on the dashboard.

---

## 1. Daily Manpower Module
**Objective:** Track worker attendance, site allocation, and calculate overtime efficiency.

*   **Form Submission:** The foreman submits a log specifying the Site, Shift Time, and assigns specific workers to roles (Engineer, Foreman, Driver, Other Staff).
*   **Database Storage:** The raw data is instantly saved into the `daily_manpower` Supabase table.
*   **Agentic AI Processing:** 
    *   **Morning Check-In:** Bypasses AI completely to save costs. It auto-approves the record.
    *   **Evening Check-Out:** The Manpower AI wakes up. It compares the Evening log against the Morning log, checks if the shift was dangerously long, flags unauthorized overtime, and reads the "Remarks" to detect if the team size was too small for the task.
*   **Dashboard Visualization:** 
    *   The Morning Check-In instantly updates the **"Current Site"** column in the Workers Directory.
    *   The Evening Check-Out AI analysis is sent to the **Human-in-the-Loop** queue (Orange) if it detects Overtime Risk or Poor Allocation, waiting for manager approval.

---

## 2. Tools Management (Asset) Module
**Objective:** Prevent tool loss, track damages, and predict maintenance needs.

*   **Form Submission:** The storekeeper logs a tool being taken (Checkout) or returned (Return), noting the Tool ID, Quantity, Custodian, and Condition.
*   **Database Storage:** The transaction is saved into the `tools_management` table.
*   **Agentic AI Processing:** 
    *   **Checkout Phase:** The Asset AI checks the worker's history. *Are they hoarding tools? Have they lost this specific tool before?* If so, it flags a "High Flight Risk".
    *   **Return Phase:** The AI compares the returned condition to the master database. If a tool was checked out in "Good" condition and returned "Damaged" on the same day, it flags a "High Risk of Negligence."
*   **Dashboard Visualization:** 
    *   The active/damaged/lost status instantly updates the **Company Assets Directory** (the pie charts).
    *   Any high-risk AI flags (hoarding or negligence) are sent to the **Human-in-the-Loop** queue for the manager to review the custodian's behavior.

---

## 3. Petty Cash (Finance) Module
**Objective:** Automate expense categorization, prevent duplicate claims, and flag financial fraud.

*   **Form Submission:** A worker submits an expense, providing the Amount, Date, Project, and a written Description (e.g., "Coffee and markers").
*   **Database Storage:** The claim is saved into the `petty_cash` table.
*   **Agentic AI Processing:** The Finance AI immediately analyzes the claim.
    *   It uses natural language intelligence to **auto-categorize** the expense based purely on the description (e.g., classifying it as "Office Supplies").
    *   It scans the database for identical amounts on the same date to detect **Duplicates**.
    *   It analyzes the cost-to-item ratio (e.g., $2500 for "car rims") to flag **Fraud Risk**.
*   **Dashboard Visualization:** The AI's categorization and fraud detection are sent to the **Human-in-the-Loop** queue. The manager can read the AI's exact reasoning before clicking "Approve" to release the funds.

---

## 4. Procurement (Materials) Module
**Objective:** Streamline material requests, prevent hoarding, and match requests to approved vendors.

*   **Form Submission:** A site engineer requests materials, specifying the Material Name, Quantity, and Required Date.
*   **Database Storage:** The Material Request (MR) is saved into the `mr_procurement` table.
*   **Agentic AI Processing:** The Procurement AI analyzes the request against the master database.
    *   It checks if the requested quantity exceeds the site's standard limits (flagging **Hoarding**).
    *   It checks the `master_suppliers` table to see if the requested material matches a pre-approved vendor. If it doesn't, it flags it as an "Unapproved Vendor Risk."
*   **Dashboard Visualization:** The MR is placed in the **Human-in-the-Loop** queue. The manager sees the AI's assessment of whether the quantity is reasonable and if the vendor is officially approved.

---

## 5. Work Output (Operations) Module
**Objective:** Measure actual physical progress against daily targets to catch delays early.

*   **Form Submission:** At the end of the shift, the foreman logs exactly what was accomplished (e.g., "12 Cubic Meters of Concrete Poured") and explains any delays.
*   **Database Storage:** The output log is saved into the `work_output` table.
*   **Agentic AI Processing:** The Operations AI evaluates the performance.
    *   It calculates the Output Efficiency by comparing the actual output to standard industry rates.
    *   It reads the written description to categorize the root cause of any delays (e.g., "Material Shortage", "Weather", "Equipment Failure").
*   **Dashboard Visualization:** The efficiency metrics feed into the **Master Supervisor Core**, allowing the global AI to correlate low output with missing tools or understaffing. If output is severely low, it alerts the manager via the **Human-in-the-Loop** queue.

---

## 6. Camp Boss Module
**Objective:** Track worker health, housing availability, and manage unexcused absences.

*   **Form Submission:** The camp manager logs workers who remain in the camp during shift hours, tagging them as "Sick" or "Absent".
*   **Database Storage:** The log is saved into the `camp_boss` table.
*   **Agentic AI Processing:** The Camp Boss AI analyzes the absentee data.
    *   It looks for patterns: *Is this worker chronically absent? Are multiple people reporting sick from the same room (indicating a potential viral outbreak)?*
*   **Dashboard Visualization:** 
    *   Workers logged as Sick or Absent immediately have their status updated to **"In Camp (Absent/Sick)"** on the Workers Directory, ensuring site managers know not to expect them.
    *   If the AI detects an outbreak pattern, it escalates a Warning to the **Human-in-the-Loop** queue.
