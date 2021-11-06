from django.db import models

# Create your models here.


class Room(models.Model):
    building_name = models.CharField(max_length=128)
    room_number = models.CharField(max_length=128)


class Course(models.Model):
    pass
