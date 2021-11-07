from django.shortcuts import render
from urf import regeneration


def index(request):
    return render(request, "urf/index.html")


# Wipe the database and regenerate all course schedules and rooms
def regenerate(request):
    regeneration.wipe_database()
    regeneration.build_database()
    return render(request, "urf/regeneration_complete.html")
