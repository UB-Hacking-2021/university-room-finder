$json = ConvertFrom-Json (Get-Content .\allCourses.json)

$csvTable = @()

$json | foreach {
    $roomData = $_.room.split(" ")
    
    $startDateData = $_.start.date
    $startDateData = $startDateData.substring(0,$startDateData.indexOf("T"))#.split("-")

    $endDateData = $_.end.date
    $endDateData = $endDateData.substring(0,$endDateData.indexOf("T"))#.split("-")

    $classObject = [pscustomobject]@{
        building_name = $roomData[0]
        room_number = $roomData[1]

        abbr = $_.abbr
        number = $_.num
        reg_number = $_.regnum
        start_time = $_.start.time
        end_time = $_.end.time
        session_start = $startDateData
        session_end = $endDateData
        is_sunday = $_.when.days.sunday
        is_monday = $_.when.days.monday
        is_tuesday = $_.when.days.tuesday
        is_wednesday = $_.when.days.wednesday
        is_thursday= $_.when.days.thursday
        is_friday = $_.when.days.friday
        is_saturday = $_.when.days.saturday
    }

    $csvTable+= $classObject

}

$csvTable | Export-csv -Path ".\classes.csv" -NoTypeInformation
