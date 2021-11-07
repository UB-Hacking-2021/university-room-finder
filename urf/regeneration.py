# This file handles everything for generating the initial database data from the website
import datetime
import time

from .models import Course, Room


# Build the rooms and classes from the website
def build_database():
    # TODO

    my_room = Room.objects.create(
        building_name="NSC",
        room_number="225",
    )

    my_course = Course.objects.create(
        abbr="cse",
        number="116",
        reg_number="12345",
        # start_time=datetime.time(hour=10, minute=30),
        # end_time=datetime.time(hour=11, minute=30),
        # session_start=datetime.date(year=2021, month=9, day=1),
        # session_end=datetime.date(year=2021, month=12, day=10),
        # is_sunday=False,
        # is_monday=True,
        # is_tuesday=False,
        # is_wednesday=False,
        # is_thursday=False,
        # is_friday=False,
        # is_saturday=False,
        room=my_room
    )

    my_course.is_saturday = True

    my_room.save()
    my_course.save()


# Erase all rooms and classes from databases
def wipe_database():
    Course.objects.all().delete()
    Room.objects.all().delete()
