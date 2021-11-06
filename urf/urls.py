from django.urls import path
from urf import views

urlpatterns = [
    path('', views.index, name="index")
]