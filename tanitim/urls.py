from django.urls import path
from . import views

urlpatterns = [
    path("", views.index),
    path("arama", views.arama),
    path("urun", views.urun),
]