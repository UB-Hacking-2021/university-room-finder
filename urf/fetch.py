# This file handles everything for fetching the results from a user's request

import datetime
from .models import Course, Room

NOT_AVAILABLE_TIME = datetime.time(0, 0, 0)


# Convert an Django Time object into a Python Datetime.time object for easier comparisons
def django_time_to_datetime_time(djtime):
    return datetime.time(djtime.hour, djtime.minute, djtime.second)


# find all results appropriate for the user's query filtered to building (if specified)
# and sorted in descending order in time remaining until the room will be reserved
# Return a list of possible COURSES that will interfere with free time.
# Building name is a string, possibly empty.
# Current time is the user provided time they're looking for a free space at.
# Day is the user provided day's name as a string like "Monday"
def get_results(building_name: str, current_time: datetime.time, day: str):
    # 1. Create a map of all rooms with their availability open until midnight
    room_map = {}
    for room in Room.objects.all():
        room_map[room] = datetime.time(23, 59, 59)

    # 2. Get courses where their start time is after the current time
    # This doesn't quite work here, but the next section does
    courses_after_now = Course.objects.all()  # start_time__gte=current_time)
    # I later discovered this was due to having different types of times. Solved with django_time_to_datetime_time

    if day == "sunday":
        courses_after_now = courses_after_now.filter(is_sunday=True)
    elif day == "monday":
        courses_after_now = courses_after_now.filter(is_monday=True)
    elif day == "tuesday":
        courses_after_now = courses_after_now.filter(is_tuesday=True)
    elif day == "wednesday":
        courses_after_now = courses_after_now.filter(is_wednesday=True)
    elif day == "thursday":
        courses_after_now = courses_after_now.filter(is_thursday=True)
    elif day == "friday":
        courses_after_now = courses_after_now.filter(is_firday=True)
    elif day == "saturday":
        courses_after_now = courses_after_now.filter(is_saturday=True)

    for course in courses_after_now:

        # print(course)

        course_start_time = django_time_to_datetime_time(course.start_time)
        course_end_time = django_time_to_datetime_time(course.end_time)

        # Filter to courses where their start time is after the current time
        if course_start_time < current_time:
            # If this course already started
            if course_end_time < current_time:
                # If this course already ended, it doesn't affect our results, so ignore it
                continue
            else:
                # This course is in session, so exclude this room.
                room_map[course.room] = NOT_AVAILABLE_TIME  # This is a bad match at this time.

        start_time = course.start_time
        room = course.room
        this_room_latest_availability = room_map[room]
        if start_time < this_room_latest_availability:
            room_map[room] = start_time

    # TODO sort the map somehow
    ret = [{"room": room, "time": latest_time}
           for room, latest_time in room_map.items()
           if latest_time != NOT_AVAILABLE_TIME]  # Build list of dicts
    ret.sort(key=lambda x: x["time"])  # Sort by time
    ret.reverse()  # Return classes with longer availability first

    # Prioritize rooms in the building the user specified

    # for temp in ret:  # for testing
    #     print(temp["room"].building_name.lower())

    ret.sort(key=lambda x: x["room"].building_name.lower() != building_name.lower())

    return ret
    # Returns list of dicts like:
    # [
    #     {"room": room1, "time": latest_time1},
    #     {"room": room2, "time": latest_time2}, ...
    # ]
