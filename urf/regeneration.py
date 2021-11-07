# This file handles everything for generating the initial database data from the website
import datetime
import csv

from .models import Course, Room


# Build the rooms and classes from the website
def build_database():
    # TODO
    
    with open('./departmentData/classes.csv') as csvfile:
#        csvReader = csv.reader(csvfile, delimeter=',', quotechar='"')
        reader = csv.DictReader(csvfile)
        for row in reader:

            my_room = Room.objects.create(
                building_name=row['building_name'],
                room_number=row['room_number'],
            )
        
            my_course = Course.objects.create(
                abbr=row['abbr'],
                number=row['number'],
                reg_number=row['reg_number'],
                start_time=datetime.time(hour=int(int(row['start_time'])/100), minute=int(int(row['start_time'])/60)),
                end_time=datetime.time(hour=int(int(row['end_time'])/100), minute=int(int(row['end_time'])/60)),
                session_start=datetime.date(year=2021, month=9, day=1),
                session_end=datetime.date(year=2021, month=12, day=10),
                is_sunday=row['is_sunday']=="True",
                is_monday=row['is_monday']=="True",
                is_tuesday=row['is_tuesday']=="True",
                is_wednesday=row['is_wednesday']=="True",
                is_thursday=row['is_thursday']=="True",
                is_friday=row['is_friday']=="True",
                is_saturday=row['is_saturday']=="True",
                room=my_room
            )
        
            my_course.is_saturday = True
        
            my_room.save()
            my_course.save()


# Erase all rooms and classes from databases
def wipe_database():
    Course.objects.all().delete()
    Room.objects.all().delete()
