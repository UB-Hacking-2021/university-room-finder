from django.shortcuts import render
from urf import regeneration
from .models import Course, Room
from .forms import MainForm
from .fetch import get_results
import datetime


def index(request):
    results_to_show = {}  # Results to show the user
    if request.method == "POST":
        form = MainForm(request.POST)
        if form.is_valid():
            # process form
            building = form.cleaned_data["building_name"],
            day = str(form.cleaned_data["day"]),
            time = form.cleaned_data["time"],
            results_to_show = get_results(building[0], time[0], day[0])
    else:
        form = MainForm()

    data = {"test": "test string", "form": form, "results": results_to_show}
    return render(request, "urf/index.html", {"data": data})


# I don't think we need this anymore, but I'm afraid to remove it
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


def make_fake_data(request):


    nsc = Room.objects.create(
        building_name="NSC",
        room_number="225",
    )

    park = Room.objects.create(
        building_name="Park",
        room_number="102",
    )

    capen = Room.objects.create(
        building_name="Capen",
        room_number="305",
    )



    cse = Course.objects.create(
        abbr="cse",
        number="116",
        reg_number="12345",
        start_time=datetime.time(hour=10, minute=30),
        end_time=datetime.time(hour=11, minute=30),
        session_start=datetime.date(year=2021, month=9, day=1),
        session_end=datetime.date(year=2021, month=12, day=10),
        is_sunday=False,
        is_monday=True,
        is_tuesday=False,
        is_wednesday=False,
        is_thursday=False,
        is_friday=False,
        is_saturday=False,
        room=nsc
    )

    eng = Course.objects.create(
        abbr="ENG",
        number="101",
        reg_number="12345",
        start_time=datetime.time(hour=15, minute=30),
        end_time=datetime.time(hour=16, minute=30),
        session_start=datetime.date(year=2021, month=9, day=1),
        session_end=datetime.date(year=2021, month=12, day=10),
        is_sunday=False,
        is_monday=True,
        is_tuesday=False,
        is_wednesday=True,
        is_thursday=False,
        is_friday=True,
        is_saturday=False,
        room=park
    )

    mth = Course.objects.create(
        abbr="MTH",
        number="142",
        reg_number="12345",
        start_time=datetime.time(hour=2, minute=30),
        end_time=datetime.time(hour=5, minute=30),
        session_start=datetime.date(year=2021, month=9, day=1),
        session_end=datetime.date(year=2021, month=12, day=10),
        is_sunday=False,
        is_monday=False,
        is_tuesday=True,
        is_wednesday=False,
        is_thursday=True,
        is_friday=False,
        is_saturday=False,
        room=capen
    )

    psy = Course.objects.create(
        abbr="PSY",
        number="101",
        reg_number="12345",
        start_time=datetime.time(hour=11, minute=30),
        end_time=datetime.time(hour=12, minute=30),
        session_start=datetime.date(year=2021, month=9, day=1),
        session_end=datetime.date(year=2021, month=12, day=10),
        is_sunday=False,
        is_monday=False,
        is_tuesday=True,
        is_wednesday=False,
        is_thursday=True,
        is_friday=False,
        is_saturday=False,
        room=capen
    )

    nsc.save()
    park.save()
    capen.save()
    cse.save()
    eng.save()
    nsc.save()
    psy.save()

    data = {
        "rooms": Room.objects.all(),
        "courses": Course.objects.all(),
        "fake_added": True,
    }
    return render(request, "urf/debug.html", {"data": data})
