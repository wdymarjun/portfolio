@echo off
echo ====================================================
echo Arjun Singh Portfolio -- GitHub Push Helper
echo ====================================================
echo.
echo Pushing branch 'main' to https://github.com/wdymarjun/portfolio.git ...
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Pushed to GitHub!
    echo Now open https://vercel.com/new and click Import on 'portfolio'.
) else (
    echo [NOTE] If repository was not found, make sure you created:
    echo https://github.com/new?name=portfolio
)
echo.
pause
