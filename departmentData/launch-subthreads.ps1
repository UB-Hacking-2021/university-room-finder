$i=0
$dptMap.Keys | foreach {
    if($i++ -lt 5){
        Start-Process powershell.exe -ArgumentList @(".\perDepartmentScraper.ps1", "-versionSite", $dptMap[$i]) -Wait -NoNewWindow
    }
}
