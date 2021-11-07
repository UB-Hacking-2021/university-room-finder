from django.db import models

# Create your models here.


class Room(models.Model):
    building_name = models.CharField(max_length=128)
    room_number = models.CharField(max_length=128)

    def __str__(self):
        return "Room {} {} (id: {})".format(self.building_name, self.room_number, self.id)


class Course(models.Model):
    # Link to a Room
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True)
    abbr = models.CharField(max_length=8)
    number = models.CharField(max_length=8)
    reg_number = models.CharField(max_length=16)
    start_time = models.TimeField()
    end_time = models.TimeField()
    session_start = models.DateField()
    session_end = models.DateField()
    is_sunday = models.BooleanField()
    is_monday = models.BooleanField()
    is_tuesday = models.BooleanField()
    is_wednesday = models.BooleanField()
    is_thursday = models.BooleanField()
    is_friday = models.BooleanField()
    is_saturday = models.BooleanField()

    def __str__(self):
        return "Course {} {} (id: {})".format(self.abbr, self.number, self.id)
