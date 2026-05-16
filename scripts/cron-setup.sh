#!/bin/bash
# Cron job setup for monthly report generation
# Runs daily at 11:00 PM

# Add to crontab (runs daily at 23:00)
echo "0 23 * * * cd /path/to/library-management-saas && npm run report:monthly >> logs/monthly-report.log 2>&1"

echo "Cron job configured. To activate, run:"
echo "  crontab -e"
echo "  Then add the line above."
