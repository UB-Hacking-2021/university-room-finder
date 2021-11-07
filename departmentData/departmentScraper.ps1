$versionSite     = "http://www.buffalo.edu/class-schedule?switch=showdepartments&semester=spring&division=UGRD"

Import-Module "$PSScriptRoot\WebDriver.dll"

$seleniumOptions = New-Object OpenQA.Selenium.Chrome.ChromeOptions

$seleniumOptions.AddArgument("--log-level=3")

$ChromeDriver = New-Object OpenQA.Selenium.Chrome.ChromeDriver($seleniumOptions)

$ChromeDriver.Navigate().GoToUrl($versionSite)  >> $null

$src = $ChromeDriver.PageSource

$dptMap = @{}

$urlBufferLen = 140
6..130 | foreach {$i = $_;
    $urlPoint = $ChromeDriver.FindElementByXPath('/html/body/table[4]/tbody/tr/td[1]/table/tbody/tr[' + $i + ']/td[1]/a')
    $dptNameIdx = $src.IndexOf($urlPoint.Text.Replace("&","&amp;"))
    
    if($dptNameIdx -eq -1){
        Write-Host "FOUND -1 WHEN SEARCHING FOR " $urlPoint.Text -ForegroundColor Red -BackgroundColor Black
    }

    $urlApproximation = $src.Substring($dptNameIdx - $urlBufferLen, $urlBufferLen)
#    $urlApproximation 
    $departmentUrl = $urlApproximation.Substring($urlApproximation.IndexOf('"')+1)
#    $departmentUrl 
    $departmentUrl = $departmentUrl.Substring(0,$departmentUrl.IndexOf('"'))
#    $departmentUrl 
    $head = "dept="
    $dpt = $departmentUrl.Substring($departmentUrl.IndexOf($head) + $head.Length)
    $dpt
#    "=====================End of DPT=====================`r`n`r`n"
    $dpt
    $departmentUrl
    $dptMap[$dpt]=$departmentUrl
}

$ChromeDriver.Close()
$ChromeDriver.Quit()

$departmentURLcsv = @("dpt,url")
$dptMap.Keys | foreach {
    $departmentURLcsv += ("" + $_ + "," + $dptMap[$_])
    Start-Process -FilePath .\perDepartmentScraper.ps1 -versionSite $dptMap[$_]
}

Set-Content -Value $departmentURLcsv -Path .\departmentURLs.csv

