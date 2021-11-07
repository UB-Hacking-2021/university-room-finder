from django.shortcuts import render
from urf import regeneration
from .models import Course, Room
from .forms import MainForm


def index(request):
    results_to_show = []  # Results to show the user
    if request.method == "POST":
        form = MainForm(request.POST)
        if form.is_valid():
            # process form
            results_to_show = [form.cleaned_data["building_name"],
                               form.cleaned_data["day"],
                               form.cleaned_data["time"],
                               ]
    else:
        form = MainForm()

    data = {"test": "test string", "form": form, "results": results_to_show}
    return render(request, "urf/index.html", {"data": data})


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
