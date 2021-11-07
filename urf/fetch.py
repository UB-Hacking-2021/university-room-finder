# This file handles everything for fetching the results from a user's request

import datetime

from .models import Course, Room


# find all results appropriate for the user's query filtered to building (if specified)
# and sorted in descending order in time remaining until the room will be reserved
# Return a list of possible COURSES that will interfere with free time.
# Building name is a string, possibly empty.
# Current time is the user provided time they're looking for a free space at.
# Day is the user provided day's name as a string like "Monday"
def get_results(building_name, current_time, day):

    # 1. Create a map of all rooms with their availability open until midnight
    room_map = {}
    for room in Room.objects.all():
        room_map[room] = datetime.time(23, 59, 59)

    # 2. Get courses where their start time is after the current time
    courses_after_now = Course.objects.filter(start_time__gt=current_time)
    if building_name:
        courses_after_now = courses_after_now.filter(room__building_name=building_name)

    if day == "sunday":
        courses_after_now.filter(is_sunday=True)
    elif day == "monday":
        courses_after_now.filter(is_monday=True)
    # TODO more of this tedious part

    for course in courses_after_now:
        start_time = course.start_time
        room = course.room
        this_room_latest_availability = room_map[room]
        if start_time < this_room_latest_availability:
            room_map[room] = this_room_latest_availability

    # TODO sort the map somehow
    return room_map
