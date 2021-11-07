
$Global:ubBuildings = @{}

$ignoreRoomTerms = @("Arr","Remote","Unknown", "Off Ca", "To Be Det", "Future", "Coe", "Mai", "Squire", "Ec_Med", "Studen","Dorshe", "Clark")

ls $PSScriptRoot\departments | foreach {
    $jsonClassArray = ConvertFrom-Json (Get-Content $_.FullName)
    
    $ignoreRoomTerms | foreach{
        $badTerm = $_
        $jsonClassArray = $jsonClassArray | where {-not $_.room.Contains($badTerm)}
    }

    $jsonClassArray | foreach {
        $classData = $_

        $locationComponents = $_.room.split(" ")
        if(-not $Global:ubBuildings[$locationComponents[0]]){
            $Global:ubBuildings[$locationComponents[0]] = @{}
        }

        if(-not $Global:ubBuildings[$locationComponents[0]][$locationComponents[1]]){
            $Global:ubBuildings[$locationComponents[0]][$locationComponents[1]] = @{}
        }

        $_.when.pattern.ToCharArray() | foreach {
            if(-not $Global:ubBuildings[$locationComponents[0]][$locationComponents[1]][$_]){
                $Global:ubBuildings[$locationComponents[0]][$locationComponents[1]][$_] = @()
            }
        
            $timeObject = [PSCustomObject]@{
                start = $classData.start.time
                end   = $classData.end.time
            }
        
            $Global:ubBuildings[$locationComponents[0]][$locationComponents[1]][$_] += $timeObject
        }
    }
}

$Global:ubBuildingsSorted = @{}
$Global:ubBuildings.Keys | foreach {   #building
    $b = $_
    $Global:ubBuildingsSorted[$b] = @{}
    $Global:ubBuildings[$b].Keys | foreach {                #room
        $r = $_
        $Global:ubBuildingsSorted[$b][$r] = @{}
        $Global:ubBuildings[$b][$r].Keys | foreach {            #weekday
            $w = $_
            $Global:ubBuildingsSorted[$b][$r][$w] = $Global:ubBuildings[$b][$r][$w] | Sort-Object -Property start

            $Global:ubBuildingsSorted[$b][$r]["a"+$w] = @("0.." + $Global:ubBuildingsSorted[$b][$r][$w][0].start)
            (0..($Global:ubBuildingsSorted[$b][$r][$w].Length-2)) | foreach {
                $end = $Global:ubBuildingsSorted[$b][$r][$w][$_].end + 20
                $nextStart = $Global:ubBuildingsSorted[$b][$r][$w][$_+1].start
                if($end%100 -gt 59){
                    $end += 40
                }

                if($start -gt $end){
                    $Global:ubBuildingsSorted[$b][$r]["a"+$w] += $Global:ubBuildingsSorted[$b][$r][$w][$_].end + ".." + $start
                }
            }

            $Global:ubBuildingsSorted[$b][$r]["a"+$w] += (""+$Global:ubBuildingsSorted[$b][$r][$w][$Global:ubBuildingsSorted[$b][$r][$w].Length-1].end + "..2359")
        }
    }
}
