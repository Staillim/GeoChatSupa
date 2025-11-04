@echo off
echo ================================
echo GeoChat PostgreSQL Setup
echo ================================
echo.

REM Set PostgreSQL connection variables
set PGHOST=localhost
set PGPORT=5432
set PGDATABASE=geochat
set PGUSER=postgres
set PGPASSWORD=Staillim

echo Connecting to PostgreSQL...
echo Host: %PGHOST%
echo Port: %PGPORT%
echo Database: %PGDATABASE%
echo User: %PGUSER%
echo.

REM Execute the SQL schema file
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f database-schema-postgres.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================
    echo ✅ Database setup completed!
    echo ================================
) else (
    echo.
    echo ================================
    echo ❌ Database setup failed!
    echo ================================
    echo.
    echo Make sure:
    echo 1. PostgreSQL is running
    echo 2. Database 'geochat' exists
    echo 3. User 'postgres' has access
    echo 4. psql is in your PATH
)

echo.
pause
