from django.shortcuts import render

# Create your views here.

def index(request):
    return render(request, "anasayfa.html")

def arama(request):
    return render(request, "arama_sayfasi.html")

def urun(request):
    return render(request, "urun_sayfasi.html")