@echo off
sqlcmd -S DESKTOP-9OOLRF4 -U sa -P "ledatquy2003" -d JOB_APPLICATION -Q "EXEC DailyExpirationUpdate;"
exit
