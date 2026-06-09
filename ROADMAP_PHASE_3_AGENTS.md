# 10xWorkforce.AI - Phase 3 Agent Intelligence Checklist

This checklist tracks the remaining AI logic required to make the Next.js backend fully compliant with the target architecture, utilizing the newly established Master Tables.

## 📋 01. Employee Onboarding
- [ ] **Auto-Booking Calendars:** Integrate scheduling for medical or HR appointments.

## 💰 02. Petty Cash
- [ ] *(All core features completed in Phase 2)*
- [x] **Dynamic Budget Checking:** (Optional Bonus) Update agent to query `sites.total_budget` instead of using a hardcoded number.

## 🛒 03. MR Procurement
- [x] **Recommend vendors:** AI suggests ideal vendors to buy from (querying `materials_master`).
- [x] **Compare pricing trends:** Implement price memory to track historical costs.
- [x] **Predict stock shortages:** Alert when site inventory drops below thresholds.
- [x] **Track deliveries & escalations:** Monitor ETA and escalate if overdue.
- [ ] **Real Email Integration:** Swap out the Telegram test pipeline for a real email service (like Resend/SendGrid) to directly email vendors.

## 🏗️ 04. Work Output Tracking
- [ ] **Correlate factors:** Analyze weather, materials, and manpower to explain productivity drops.

## 🔧 06. Tools Management
- [ ] **Detect missing tools:** AI reading images of tools to verify condition and presence.
- [ ] **Predict tool demand:** Forecast what tools will be needed next month.
- [ ] **Monitor usage patterns:** Set up background timers (Cron Jobs) to detect tool hoarding automatically over weeks.

## 👷 08. Daily Manpower
- [x] **Auto-allocate manpower:** Go beyond analyzing manual input and actively suggest optimal team sizes.
- [x] **Match skills to tasks/sites:** Cross-reference the `employees` master table to ensure assigned trades match the work.
- [x] **Predict workforce demand:** Forecast labor needs based on project schedules.

## 🏕️ 07. Camp Boss
- [ ] **Real SMS Gateway:** Swap out the Telegram test pipeline for a real SMS service (like Twilio) to text workers.

## 🧠 09. Multi-Agent Orchestrator (Supervisor)
- [x] **Autonomous Data Fetching:** Update the Supervisor Agent to actively query all 8 Supabase tables for "High Risk" and "Pending" alerts simultaneously.
- [x] **Cross-Correlate Alerts:** Program the AI to connect the dots (e.g., matching a Procurement Delay to a Daily Manpower Shortage on the same site).
