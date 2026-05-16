# Daily Cron Job Setup

This setup runs the daily report generation every night at 11:00 PM.

## Option 1: System Cron Job (Linux/Mac)

Edit crontab:
```bash
crontab -e
```

Add this line (runs daily at 23:00):
```bash
0 23 * * * cd /path/to/library-management-saas && npm run report:daily >> logs/daily-report.log 2>&1
```

## Option 2: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 11:00 PM
4. Set action: Run program
   - Program: `npm`
   - Arguments: `run report:daily`
   - Start in: `C:\path\to\library-management-saas`

## Option 3: Using PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start ecosystem.config.js --cron "0 23 * * *"
```

## API Endpoint

The daily report also runs via API:
```
GET /api/cron/daily-report
```

## Scripts Available

- `npm run report:daily` - Generate daily report
- `npm run report:monthly` - Generate monthly report
