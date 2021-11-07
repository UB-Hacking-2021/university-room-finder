from django.shortcuts import render
from urf import regeneration
from .models import Course, Room


def index(request):
    return render(request, "urf/index.html")


def results(request):
    # TODO give the results
    data = {"test": "test string"}
    return render(request, "urf/index.html", {"data": data})


# Wipe the database and regenerate all course schedules and rooms
def regenerate(request):
    regeneration.wipe_database()
    regeneration.build_database()
    return render(request, "urf/regeneration_complete.html")


# Wipe the database and regenerate all course schedules and rooms
def debug(request):
    data = {
        "rooms": Room.objects.all(),
        "courses": Course.objects.all(),
    }
    return render(request, "urf/debug.html", {"data": data})
