param([Parameter(Mandatory=$true)]$versionSite)
$department = $versionSite.Substring($versionSite.Length -3)

if(Test-Path $PSScriptRoot\departments\$department.json){exit}

Import-Module "$PSScriptRoot\WebDriver.dll"

$seleniumOptions = New-Object OpenQA.Selenium.Chrome.ChromeOptions
$seleniumOptions.AddArgument("--log-level=3")
$ChromeDriver = New-Object OpenQA.Selenium.Chrome.ChromeDriver($seleniumOptions)
$ChromeDriver.Navigate().GoToUrl($versionSite)  >> $null
$src = $ChromeDriver.PageSource

$departmentCourseTable = @()

$x = 4
2..9 | foreach {$y=$_
    $departmentCourseTable += $ChromeDriver.FindElementByXPath("/html/body/table[4]/tbody/tr[$x]/td[$y]").Text
}
$entryWidth = $departmentCourseTable.Length

try{
    5..1000 | foreach {$x=$_
        Write-verbose "Trying row $x"
        2..9 | foreach {$y=$_
            $departmentCourseTable += $ChromeDriver.FindElementByXPath("/html/body/table[4]/tbody/tr[$x]/td[$y]").Text
        }
    }
}catch{}

$classArray = @()

0..(($departmentCourseTable.Length / $entryWidth) - 1) | foreach {
    $i = $_
    $classObject = @{}
    
    0..($entryWidth -1) | foreach {
        $classObject[$departmentCourseTable[$_]] = $departmentCourseTable[$entryWidth * $i + $_]
    }
    $classArray += $classObject
}

$departmentJSON = ConvertTo-Json -InputObject $classArray

Set-Content -Value $departmentJSON -Path $PSScriptRoot\departments\$department.json

$ChromeDriver.Close()
$ChromeDriver.Quit()
