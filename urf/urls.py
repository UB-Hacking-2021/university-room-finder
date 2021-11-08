from django.urls import path
from urf import views

urlpatterns = [
    path('', views.index, name="index"),
    path('regenerate', views.regenerate, name="regenerate"),
    path('results', views.results, name="results"),
    path('debug', views.debug, name="debug"),
    path('fake', views.make_fake_data, name="fake"),
    path('room/<int:id>', views.room, name="room"),
]
