# Review Due

This initial policy is a simple product choice, not a scientifically optimal schedule

Review Due extends Mistake Review through the same task IDs and dismissal markers — it adds selected learned concepts rather than every question or whole reports

An incorrect original check is due immediately and resets the interval level — an independently correct learned concept starts at one elapsed day

Independent correct review advances to 3, 7, 14 and then 30 days — incorrect review returns in 10 minutes, assisted correct review in one hour, and both reset the level

Hints, solutions and recently exposed answers are assistance — the one-hour assistance window survives restarting a session and crosses between original lesson help and an open review session

Times are stored as UTC instants, due includes equality, and lateness has no penalty or invented failure — overdue means before the current UTC date

Sessions contain at most five due concepts for one course and resume after reload — draft, assistance, recorded results and position persist separately from assessment history

A recorded result is immutable, revisions reject stale requests, and a session/concept key prevents duplicate interval advancement — Skip records no success and leaves the schedule unchanged

Remove persists across reloads and shared Mistake Review — Undo restores the exact schedule and previous dismissal marker while available, and a new incorrect original check reactivates the concept

No old review attempts are fabricated during migration — selected existing correct/mistaken work seeds schedules when lessons load, with conservative assistance handling

Backup before adopting schema 3 — schedules, active sessions, review results and dismissal history travel with the SQLite backup
